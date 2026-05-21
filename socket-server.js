const { Server } = require("socket.io");
const http = require("http");

const server = http.createServer((req, res) => {
  if (req.url === "/ping") {
    res.writeHead(200, {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST"
    });
    res.end("PONG");
    return;
  }

  if (req.url === "/emit" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        const data = JSON.parse(body);
        console.log(`[SocketServer] Received /emit request for room: ${data.room}, event: ${data.event}`);
        if (data.room && data.event) {
          io.to(data.room).emit(data.event, data.payload);
          console.log(`[SocketServer] Emitted ${data.event} to room ${data.room}`);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        } else {
          console.warn("[SocketServer] Missing room or event in /emit payload");
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Missing room or event" }));
        }
      } catch (err) {
        console.error("[SocketServer] Error in /emit:", err);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });
    return;
  }
});
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all for development
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("join-room", (room) => {
    socket.join(room);
    console.log(`Socket ${socket.id} joined room: ${room}`);
  });
  socket.on("join-personal-room", (userId) => {
    socket.join(userId);
    console.log(`[SocketServer] User ${userId} joined personal room. Rooms now:`, Array.from(socket.rooms));
  });

  socket.on("send-message", (data) => {
    // data: { room, message, receiverId }
    io.to(data.room).emit("new-message", data.message);
    console.log(`Message in ${data.room}:`, data.message.content);
    if (data.receiverId) {
      console.log(`Emitting global-notification to ${data.receiverId}`);
      io.to(data.receiverId).emit("global-notification", data.message);
    }
  });

  socket.on("sos-triggered", (data) => {
    // Broadcast SOS to everyone (admins/attorneys will filter)
    console.log("SOS TRIGGERED:", data);
    io.emit("sos-alert", data);

    // Also send targeted notification if an attorney is assigned
    if (data.assigned_attorney_id) {
      console.log(`Targeting SOS alert to attorney: ${data.assigned_attorney_id}`);
      io.to(data.assigned_attorney_id).emit("sos-alert", data);
    }
  });

  socket.on("civil-intake-triggered", (data) => {
    // Broadcast Civil Intake to everyone
    console.log("CIVIL INTAKE TRIGGERED:", data);
    io.emit("new-civil-intake", data);

    // Also send targeted notification if an attorney is assigned
    if (data.assigned_attorney_id) {
      console.log(`Targeting intake alert to attorney: ${data.assigned_attorney_id}`);
      io.to(data.assigned_attorney_id).emit("new-civil-intake", data);
    }
  });

  socket.on("mark-read", (data) => {
    // data: { room, readByUserId }
    io.to(data.room).emit("messages-read", data.readByUserId);
  });

  socket.on("start-video-call", (data) => {
    // data: { room, receiverId, senderName, senderId }
    console.log(`[SocketServer] Video call request: From ${data.senderName} to ${data.receiverId}`);
    const targetRoom = data.receiverId;
    const clients = io.sockets.adapter.rooms.get(targetRoom);
    console.log(`[SocketServer] Target room ${targetRoom} has ${clients ? clients.size : 0} connected clients`);

    io.to(targetRoom).emit("incoming-video-call", data);
  });

  socket.on("decline-video-call", (data) => {
    // data: { callerId, declinerName }
    console.log(`Video call declined by ${data.declinerName} for caller ${data.callerId}`);
    io.to(data.callerId).emit("video-call-declined", data);
  });

  socket.on("recording-saved", (data) => {
    console.log(`[SocketServer] Recording saved for call: ${data.callId} for user ${data.targetUserId}`);
    if (data.targetUserId) io.to(data.targetUserId).emit("recording-saved", data);
  });

  socket.on("call-missed", (data) => {
    // data: { receiverId, callerId, callerName, callId, callType }
    console.log(`Missed call from ${data.callerName} — notifying receiver ${data.receiverId}`);
    io.to(data.receiverId).emit("call-missed", data);
  });

  socket.on("call-cancelled", (data) => {
    // data: { receiverId, callerId, callerName, callId }
    console.log(`Call cancelled by ${data.callerName} for receiver ${data.receiverId}`);
    io.to(data.receiverId).emit("call-cancelled", data);
  });

  socket.on("case-accepted", (data) => {
    // data: { userId, attorneyName, caseSubject, caseId, caseType }
    console.log(`Case accepted by ${data.attorneyName} — notifying user ${data.userId}`);
    io.to(data.userId).emit("case-accepted", data);
  });

  socket.on("attorney-assigned", (data) => {
    // data: { userId, attorneyName, caseSubject, caseId, caseType }
    console.log(`Attorney assigned: ${data.attorneyName} — notifying user ${data.userId}`);
    io.to(data.userId).emit("attorney-assigned", data);
  });

  socket.on("case-rejected", (data) => {
    // data: { userId, attorneyName, caseSubject, caseId, caseType, reason }
    console.log(`Case rejected by ${data.attorneyName} — notifying user ${data.userId}`);
    io.to(data.userId).emit("case-rejected", data);
  });

  socket.on("vendor-application", (data) => {
    // Broadcast to all connected clients — admin filter happens on the client
    console.log(`[SocketServer] New vendor application from: ${data.full_name}`);
    io.emit("vendor-application", data);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = 3001;
const HOST = "0.0.0.0";
server.listen(PORT, HOST, () => {
  console.log(`Socket.io server running on http://${HOST}:${PORT}`);
});

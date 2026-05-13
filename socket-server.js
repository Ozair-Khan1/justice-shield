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
    console.log(`User ${userId} joined personal room on socket ${socket.id}`);
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
    console.log(`Video call started in ${data.room} by ${data.senderName} for ${data.receiverId}`);
    io.to(data.receiverId).emit("incoming-video-call", data);
  });

  socket.on("decline-video-call", (data) => {
    // data: { callerId, declinerName }
    console.log(`Video call declined by ${data.declinerName} for caller ${data.callerId}`);
    io.to(data.callerId).emit("video-call-declined", data);
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

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = 3001;
const HOST = "0.0.0.0";
server.listen(PORT, HOST, () => {
  console.log(`Socket.io server running on http://${HOST}:${PORT}`);
});

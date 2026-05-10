const { Server } = require("socket.io");
const http = require("http");

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all for development
    methods: ["GET", "POST"]
  }
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

  socket.on("mark-read", (data) => {
    // data: { room, readByUserId }
    io.to(data.room).emit("messages-read", data.readByUserId);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Socket.io server running on http://localhost:${PORT}`);
});

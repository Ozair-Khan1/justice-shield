import { io } from "socket.io-client";

const email = process.argv[2] || "nenal38598@deapad.com";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return console.log("User not found");

  console.log(`Connecting as user: ${user.id}...`);
  const socket = io("http://localhost:3001");

  socket.on("connect", () => {
    console.log("Connected with socket ID:", socket.id);
    socket.emit("join-personal-room", user.id);
    
    // Now trigger the emit via API
    setTimeout(async () => {
      console.log("Triggering /emit via fetch...");
      try {
        await fetch("http://localhost:3001/emit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ room: user.id, event: "membership-expired", payload: {} })
        });
      } catch (err) {
        console.error("Fetch failed", err);
      }
    }, 1000);
  });

  socket.on("membership-expired", () => {
    console.log("✅ SUCCESS: Received 'membership-expired' event from server!");
    process.exit(0);
  });

  setTimeout(() => {
    console.log("❌ TIMEOUT: Did not receive event in 5 seconds.");
    process.exit(1);
  }, 5000);
}

main();

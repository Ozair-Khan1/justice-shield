import { io } from "socket.io-client";

export async function emitSocketEvent(event: string, data: any) {
  console.log(`[SocketEmit] Attempting to emit ${event}...`);

  // We'll try localhost first, which is standard
  const url = "http://localhost:3001";

  try {
    const socket = io(url, {
      transports: ["polling", "websocket"], // Use polling first for faster initial connect
      reconnection: false,
      timeout: 5000,
    });

    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        if (socket.connected) {
          socket.disconnect();
        }
        console.warn(`[SocketEmit] EMISSION TIMEOUT for ${event} on ${url}`);
        resolve(false);
      }, 5000);

      socket.on("connect", () => {
        socket.emit(event, data);
        console.log(`[SocketEmit] SUCCESSFULLY EMITTED ${event} to socket server`);

        // Give it a moment to actually send
        setTimeout(() => {
          clearTimeout(timeoutId);
          socket.disconnect();
          resolve(true);
        }, 300);
      });

      socket.on("connect_error", (err) => {
        console.error(`[SocketEmit] CONNECTION ERROR to ${url}:`, err.message);
        clearTimeout(timeoutId);
        socket.disconnect();
        resolve(false);
      });
    });
  } catch (error) {
    console.error("[SocketEmit] Catch block error:", error);
    return false;
  }
}

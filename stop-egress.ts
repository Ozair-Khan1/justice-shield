import { EgressClient } from "livekit-server-sdk";

const egressClient = new EgressClient("http://127.0.0.1:7800", "devkey", "12345678901234567890123456789012");

async function stopEgress() {
  console.log("Stopping egress...");
  await egressClient.stopEgress("EG_Abe48MCCU99p");
  console.log("Stopped.");
}

stopEgress().catch(console.error);

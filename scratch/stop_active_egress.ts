import { EgressClient } from "livekit-server-sdk";

const LIVEKIT_URL = "http://127.0.0.1:7800";
const API_KEY = "devkey";
const API_SECRET = "12345678901234567890123456789012";

const egressClient = new EgressClient(LIVEKIT_URL, API_KEY, API_SECRET);

async function main() {
  const egressId = "EG_9q7d2rJ2j3zd";
  console.log(`Stopping Egress: ${egressId}...`);
  try {
    const res = await egressClient.stopEgress(egressId);
    console.log("Success! Stop response:", res);
  } catch (err) {
    console.error("Failed to stop egress:", err);
  }
}

main();

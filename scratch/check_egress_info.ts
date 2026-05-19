import { EgressClient } from "livekit-server-sdk";

const LIVEKIT_URL = "http://127.0.0.1:7800";
const API_KEY = "devkey";
const API_SECRET = "12345678901234567890123456789012";

const egressClient = new EgressClient(LIVEKIT_URL, API_KEY, API_SECRET);

async function main() {
  const egressId = "EG_5ETch8SV5P9i"; // From our db
  try {
    const list = await egressClient.listEgress();
    const egress = list.find(e => e.egressId === egressId);
    console.log("Egress info:", egress);
  } catch (err) {
    console.error("Failed:", err);
  }
}

main();

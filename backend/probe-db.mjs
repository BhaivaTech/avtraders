import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Replicate server.js exactly.
const envPath = path.resolve(__dirname, ".env");
console.log("[probe] .env path:", envPath);
console.log("[probe] .env exists:", fs.existsSync(envPath));
const r = dotenv.config({ path: envPath });
console.log("[probe] dotenv.parsed keys:", r.parsed ? Object.keys(r.parsed) : "(none)");
console.log("[probe] DB_HOST after dotenv:", process.env.DB_HOST);

// Now import env + db in the same order the server does.
await import("/home/chethan/Documents/bhaivatech project/avtraders/backend/src/config/env.js");
try {
  await import("/home/chethan/Documents/bhaivatech project/avtraders/backend/src/config/db.js");
} catch (e) {
  console.log("[probe] db module threw:", e.message);
}

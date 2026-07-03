import { getDashboardData } from "../server/store.js";
import { methodNotAllowed, sendJson, withDatabase } from "./_utils.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    methodNotAllowed(res, ["GET"]);
    return;
  }

  await withDatabase(res, async () => {
    const data = await getDashboardData();
    sendJson(res, 200, data);
  });
}

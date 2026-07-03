import { upsertInventory } from "../server/store.js";
import { methodNotAllowed, parseBody, sendJson, withDatabase } from "./_utils.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    methodNotAllowed(res, ["POST"]);
    return;
  }

  await withDatabase(res, async () => {
    try {
      const inventory = await upsertInventory(await parseBody(req));
      sendJson(res, 201, inventory);
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
  });
}

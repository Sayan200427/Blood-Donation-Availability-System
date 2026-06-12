import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDatabase } from "./db.js";
import {
  addDonor,
  getDashboardData,
  upsertInventory,
  addRequest
} from "./store.js";

dotenv.config();

const app = express();
const port = 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/dashboard", async (_req, res) => {
  const data = await getDashboardData();
  res.json(data);
});

app.post("/api/donors", async (req, res) => {
  try {
    const donor = await addDonor(req.body);
    res.status(201).json(donor);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/inventory", async (req, res) => {
  try {
    const inventory = await upsertInventory(req.body);
    res.status(201).json(inventory);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/requests", async (req, res) => {
  try {
    const request = await addRequest(req.body);
    res.status(201).json(request);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

async function startServer() {
  await connectDatabase();

  app.listen(port, () => {
    console.log(`Emergency Blood Donation API running on http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error.message);
  process.exit(1);
});

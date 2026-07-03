import mongoose from "mongoose";

let connectionPromise;

export async function connectDatabase() {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error("MONGO_URI is missing. Add your MongoDB connection string to .env.");
  }

  if (mongoUri.includes("<db_password>") || mongoUri.includes("your_password_here")) {
    throw new Error("Replace the MongoDB password placeholder in .env before starting the server.");
  }

  if (mongoose.connection.readyState === 1) {
    return;
  }

  connectionPromise ||= mongoose.connect(mongoUri);
  await connectionPromise;
  console.log("MongoDB connected");
}

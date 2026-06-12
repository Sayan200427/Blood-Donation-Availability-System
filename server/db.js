import mongoose from "mongoose";

export async function connectDatabase() {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error("MONGO_URI is missing. Add your MongoDB connection string to .env.");
  }

  if (mongoUri.includes("<db_password>") || mongoUri.includes("your_password_here")) {
    throw new Error("Replace the MongoDB password placeholder in .env before starting the server.");
  }

  await mongoose.connect(mongoUri);
  console.log("MongoDB connected");
}

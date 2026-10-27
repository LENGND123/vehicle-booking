import mongoose from "mongoose";

type Cache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };

const g = globalThis as unknown as { _mongoose?: Cache };
const cache: Cache = g._mongoose ?? (g._mongoose = { conn: null, promise: null });

async function resolveUri(): Promise<string> {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;
  if (process.env.NODE_ENV === "production") {
    throw new Error("MONGODB_URI is not set. Add it to your environment variables.");
  }
  // Local development without Atlas: run a real MongoDB that keeps its data in .data/
  const { MongoMemoryServer } = await import("mongodb-memory-server");
  const fs = await import("fs");
  const path = await import("path");
  const dbPath = path.join(process.cwd(), ".data", "mongo");
  fs.mkdirSync(dbPath, { recursive: true });
  const server = await MongoMemoryServer.create({
    instance: { dbPath, storageEngine: "wiredTiger", port: 27027 },
  });
  console.log("[db] Using local MongoDB at", server.getUri());
  return server.getUri("vehicle-booking");
}

export async function connectDB() {
  if (cache.conn) return cache.conn;
  if (!cache.promise) {
    cache.promise = resolveUri().then((uri) => mongoose.connect(uri, { bufferCommands: false }));
  }
  try {
    cache.conn = await cache.promise;
  } catch (e) {
    cache.promise = null;
    throw e;
  }
  return cache.conn;
}

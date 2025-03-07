import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
let client;
let clientPromise;

if (!uri) {
  throw new Error("Please add your MongoDB URI to .env");
}

if (!client) {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export async function connectToDB() {
  const client = await clientPromise;
  return client.db("study_notes");
}

export async function addUser(email, password, role = "student") {
  const db = await connectToDB();
  const hashedPassword = await bcrypt.hash(password, 10);
  return await db.collection("users").insertOne({ email, password: hashedPassword, role });
}

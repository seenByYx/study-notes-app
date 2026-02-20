import { connectToDB } from "../../../lib/mongodb";
import bcrypt from "bcryptjs";

function isOwnerEmail(email) {
  const ownerEmail = String(process.env.OWNER_EMAIL || "").trim().toLowerCase();
  return Boolean(ownerEmail) && String(email || "").trim().toLowerCase() === ownerEmail;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method Not Allowed" });

  try {
    const { name, email, password, requestAdmin } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const db = await connectToDB();
    const usersCollection = db.collection("users");
    const existingUser = await usersCollection.findOne({ email });

    if (existingUser) {
      return res.status(409).json({ message: "User already exists. Please sign in." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const makeOwner = isOwnerEmail(email);
    const newUser = {
      name,
      email,
      password: hashedPassword,
      role: makeOwner ? "owner" : "user",
      adminRequested: makeOwner ? false : Boolean(requestAdmin),
      createdAt: new Date(),
    };
    await usersCollection.insertOne(newUser);

    return res.status(201).json({ message: "Signup successful! Please log in." });
  } catch (error) {
    console.error("Signup Error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}

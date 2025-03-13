import { connectToDB } from "../../../lib/mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method Not Allowed" });

  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) return res.status(400).json({ message: "All fields are required" });

    const db = await connectToDB();
    const usersCollection = db.collection("users");

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email });

    if (existingUser) {
      // ✅ If user exists, check password for auto sign-in
      const passwordMatch = await bcrypt.compare(password, existingUser.password);
      if (!passwordMatch) return res.status(400).json({ message: "Incorrect password. Please try again." });

      // ✅ Generate JWT Token
      const token = jwt.sign(
        { id: existingUser._id, email: existingUser.email, role: existingUser.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.status(200).json({ message: "Login successful!", token, user: existingUser });
    }

    // ❌ If user does NOT exist, create a new one
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { name, email, password: hashedPassword, role };

    await usersCollection.insertOne(newUser);

    res.status(201).json({ message: "Signup successful! Please log in." });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
}

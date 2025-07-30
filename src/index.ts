import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { z } from "zod";

dotenv.config();

import { connectDB, UserModel } from "./db";

const app = express();

app.use(express.json());

const signupSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be less than 30 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    ),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(128, "Password must be less than 128 characters"),
});

app.post("/api/v1/signup", async (req, res) => {
  try {
    console.log("Signup request received");

    // Input validation with Zod
    const validationResult = signupSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        message:
          "Username can only contain letters, numbers, and underscores and should have size between 3 to 30 characters, Password size must be between 6 to 128 characters",
      });
    }

    const { username, password } = validationResult.data;

    // Check if user already exists
    const existingUser = await UserModel.findOne({ username });
    if (existingUser) {
      return res.status(409).json({
        message: "Username already exists",
      });
    }

    // Hash the password with salt rounds
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user with hashed password
    const newUser = await UserModel.create({
      username,
      hashedPassword: hashedPassword,
      createdAt: new Date(),
    });

    // Return success response (don't include sensitive data)
    return res.status(201).json({
      message: "User created successfully",
    });
  } catch (err) {
    console.error("Signup error:", err);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

app.post("/api/v1/signin", (req, res) => {});

app.post("/api/v1/content", (req, res) => {});

app.get("/api/v1/content", (req, res) => {});

app.delete("/api/v1/content", (req, res) => {});

app.post("/api/v1/brain/share", (req, res) => {});

app.get("/api/v1/brain/:shareLink", (req, res) => {});

const startServer = async () => {
  try {
    await connectDB();
    app.listen(3000, () => {
      console.log("Server running on port 3000");
    });
  } catch (err) {
    console.error("Failed to start server:", err);
  }
};

startServer();

import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import cors from "cors";
import { z } from "zod";

dotenv.config();

import { connectDB, ContentModel, LinkModel, UserModel } from "./db";
import { userMiddleware } from "./middleware";
import { random } from "./utils";

const app = express();

app.use(cors());
app.use(express.json());

const signupSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be less than or 30 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    ),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(128, "Password must be less than 128 characters"),
});

const signinSchema = z.object({
  username: z
    .string()
    .min(3, "Username of size atleast 3 is required")
    .max(30, "Username size must not exceed 30 characters"),
  password: z
    .string()
    .min(1, "Password is required")
    .max(128, "Password must be less than 128 characters"),
});

app.post("/api/v1/signup", async (req, res) => {
  try {
    console.log("Signup request received");

    const validationResult = signupSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        message:
          "Username can only contain letters, numbers, and underscores and should have size between 3 to 30 characters, Password size must be between 6 to 128 characters",
      });
    }

    const { username, password } = validationResult.data;

    const existingUser = await UserModel.findOne({ username });
    if (existingUser) {
      return res.status(409).json({
        message: "Username already exists",
      });
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = await UserModel.create({
      username,
      hashedPassword: hashedPassword,
      createdAt: new Date(),
    });

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

app.post("/api/v1/signin", async (req, res) => {
  try {
    console.log("Signin request received");

    // Input validation with Zod
    const validationResult = signinSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        message: "Username and password are required",
      });
    }

    const { username, password } = validationResult.data;

    const user = await UserModel.findOne({ username });
    if (!user) {
      return res.status(401).json({
        message: "Invalid username or password",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.hashedPassword as string
    );
    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid username or password",
      });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        username: user.username,
      },
      process.env.JWT_SECRET as string,
      {
        expiresIn: "24h",
      }
    );

    return res.status(200).json({
      message: "Signin successful",
      token: token,
    });
  } catch (err) {
    console.error("Signin error:", err);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

app.post("/api/v1/content", userMiddleware, (req, res) => {
  try {
    console.log("BABA YAGA");
    const title = req.body.title;
    const link = req.body.link;
    const type = req.body.type;
    ContentModel.create({
      title,
      link,
      type,
      userId: req.userId,
      tags: [],
    });

    return res.json({
      message: "Content added",
    });
  } catch (err) {
    console.log("Content add error", err);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

app.get("/api/v1/content", userMiddleware, async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.userId;
    const content = await ContentModel.find({
      userId: userId,
    }).populate("userId", "username");

    return res.json({
      content,
    });
  } catch (err) {
    console.log("Content add error", err);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

app.delete("/api/v1/content", userMiddleware, async (req, res) => {
  try {
    const contentId = req.body.contentId;
    await ContentModel.deleteMany({
      contentId,
      //@ts-ignore
      userId: req.userId,
    });
    return res.json({
      message: "Deleted content",
    });
  } catch (err) {
    console.log("Delete content failed", err);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

app.post("/api/v1/brain/share", userMiddleware, async (req, res) => {
  try {
    const share = req.body.share;
    if (share) {
      const existingLink = await LinkModel.findOne({
        userId: req.userId,
      });

      if (existingLink) {
        res.json({
          hash: existingLink.hash,
        });
        return;
      }
      const hash = random(10);
      await LinkModel.create({
        userId: req.userId,
        hash: hash,
      });

      res.json({
        hash,
      });
    } else {
      await LinkModel.deleteOne({
        userId: req.userId,
      });

      res.json({
        message: "Removed link",
      });
    }
  } catch (err) {
    console.log("share post api crashed ", err);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

app.get("/api/v1/brain/:shareLink", async (req, res) => {
  try {
    const hash = req.params.shareLink;

    const link = await LinkModel.findOne({
      hash,
    });

    if (!link) {
      return res.status(411).json({
        message: "Sorry incorrect input",
      });
    }

    const content = await ContentModel.find({
      userId: link.userId,
    });

    const user = await UserModel.findOne({
      _id: link.userId,
    });

    if (!user) {
      return res.status(411).json({
        message: "User not found",
      });
    }

    return res.json({
      username: user.username,
      content: content,
    });
  } catch (err) {
    console.log("Get brain of given hash failed", err);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

const startServer = async () => {
  try {
    await connectDB(); // connecting to db before starting server.
    app.listen(3000, () => {
      console.log("Server running on port 3000");
    });
  } catch (err) {
    console.error("Failed to start server:", err);
  }
};

startServer();

"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const zod_1 = require("zod");
dotenv_1.default.config();
const db_1 = require("./db");
const middleware_1 = require("./middleware");
const app = (0, express_1.default)();
app.use(express_1.default.json());
const signupSchema = zod_1.z.object({
    username: zod_1.z
        .string()
        .min(3, "Username must be at least 3 characters")
        .max(30, "Username must be less than or 30 characters")
        .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
    password: zod_1.z
        .string()
        .min(6, "Password must be at least 6 characters")
        .max(128, "Password must be less than 128 characters"),
});
const signinSchema = zod_1.z.object({
    username: zod_1.z
        .string()
        .min(3, "Username of size atleast 3 is required")
        .max(30, "Username size must not exceed 30 characters"),
    password: zod_1.z
        .string()
        .min(1, "Password is required")
        .max(128, "Password must be less than 128 characters"),
});
app.post("/api/v1/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("Signup request received");
        const validationResult = signupSchema.safeParse(req.body);
        if (!validationResult.success) {
            return res.status(400).json({
                message: "Username can only contain letters, numbers, and underscores and should have size between 3 to 30 characters, Password size must be between 6 to 128 characters",
            });
        }
        const { username, password } = validationResult.data;
        const existingUser = yield db_1.UserModel.findOne({ username });
        if (existingUser) {
            return res.status(409).json({
                message: "Username already exists",
            });
        }
        const saltRounds = 12;
        const hashedPassword = yield bcrypt_1.default.hash(password, saltRounds);
        const newUser = yield db_1.UserModel.create({
            username,
            hashedPassword: hashedPassword,
            createdAt: new Date(),
        });
        return res.status(201).json({
            message: "User created successfully",
        });
    }
    catch (err) {
        console.error("Signup error:", err);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
}));
app.post("/api/v1/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const user = yield db_1.UserModel.findOne({ username });
        if (!user) {
            return res.status(401).json({
                message: "Invalid username or password",
            });
        }
        const isPasswordValid = yield bcrypt_1.default.compare(password, user.hashedPassword);
        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Invalid username or password",
            });
        }
        const token = jsonwebtoken_1.default.sign({
            userId: user._id,
            username: user.username,
        }, process.env.JWT_SECRET, {
            expiresIn: "24h",
        });
        return res.status(200).json({
            message: "Signin successful",
            token: token,
        });
    }
    catch (err) {
        console.error("Signin error:", err);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
}));
app.post("/api/v1/content", middleware_1.userMiddleware, (req, res) => {
    try {
        const link = req.body.link;
        const type = req.body.type;
        db_1.ContentModel.create({
            link,
            type,
            //@ts-ignore
            userId: req.userId, // ts-ignoring is fine here
            tags: [],
        });
        return res.json({
            message: "Content added",
        });
    }
    catch (err) {
        console.log("Content add error", err);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
});
app.get("/api/v1/content", (req, res) => { });
app.delete("/api/v1/content", (req, res) => { });
app.post("/api/v1/brain/share", (req, res) => { });
app.get("/api/v1/brain/:shareLink", (req, res) => { });
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, db_1.connectDB)();
        app.listen(3000, () => {
            console.log("Server running on port 3000");
        });
    }
    catch (err) {
        console.error("Failed to start server:", err);
    }
});
startServer();

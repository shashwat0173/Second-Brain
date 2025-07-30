import mongoose, { model, Schema } from "mongoose";
import { required } from "zod/v4/core/util.cjs";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string, {
      dbName: "brainly",
    });
    console.log("Database Connection: SUCCESS");
  } catch (err) {
    console.log("Database Connection: FAILED", err);
  }
};

const UserSchema = new Schema({
  username: { type: String, unique: true },
  hashedPassword: String,
});

export const UserModel = model("User", UserSchema);

const ContentSchema = new Schema({
  title: String,
  link: String,
  tags: [{ type: mongoose.Types.ObjectId, ref: "Tag" }],
  userId: { type: mongoose.Types.ObjectId, ref: "User", required: true },
});

export const ContentModel = model("Content", ContentSchema);

export { connectDB };

// export const UserModel = model("User", UserSchema);

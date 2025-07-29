import mongoose, { model, Schema } from "mongoose";

const UserSchema = new Schema({
  username: { type: String, unique: true },
  password: String,
});

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log("Database Connection: SUCCESS");
  } catch (err) {
    console.log("Database Connection: FAILED", err);
  }
};

export {connectDB};

export const UserModel = model("User", UserSchema);

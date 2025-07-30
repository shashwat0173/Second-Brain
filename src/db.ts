import mongoose, { model, Schema } from "mongoose";

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

export { connectDB };

// export const UserModel = model("User", UserSchema);

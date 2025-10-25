import mongoose from "mongoose";

const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    mobile: { type: String, required: true },
    password: { type: String, required: true },
    collegeName: { type: String, required: true },
    collegeId: { type: String, required: true },
    degree: { type: String, required: true },
    year: { type: String, required: true }
  },
  { timestamps: true }
);

export default mongoose.model("userinfo", userSchema);

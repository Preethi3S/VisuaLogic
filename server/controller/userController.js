import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs"
import User from "../models/User.js";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    res.status(200).json({
  _id: user._id,
  name: user.name,
  email: user.email,
  token: generateToken(user._id),
  expiresIn: 30 * 24 * 60 * 60 // 30 days in seconds
});

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const registerUser = async (req, res) => {
  try {
    const { name, email, mobile, password, collegeName, collegeId, degree, year } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name, email, mobile,
      password: hashedPassword,
      collegeName, collegeId, degree, year
    });

    res.status(201).json({
  _id: user._id,
  name: user.name,
  email: user.email,
  token: generateToken(user._id),
  expiresIn: 30 * 24 * 60 * 60
});

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

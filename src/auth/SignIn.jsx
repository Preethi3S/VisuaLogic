import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const trimmedEmail = email.trim();
      const trimmedPassword = password.trim();

      await login(trimmedEmail, trimmedPassword);
      navigate("/"); // redirect after login
    } catch (err) {
      setError(err);
    }
  };

  return (
    <div
      className="bg-cyber-grid animate-cyber-grid animate-cyber-grid-pulse min-h-screen flex items-center justify-center text-[#1F2937] px-4"
      style={{
        minHeight: "100vh",
        width: "100vw",
        margin: 0,
        padding: 0,
        position: "relative",
        flexDirection: "column",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="mb-6 text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#4B6CB7] to-[#67C8FF] select-none"
        style={{ userSelect: "none" }}
      >
        VisuaLogic
      </motion.div>

      <motion.div
        className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md border-t-4 border-[#4B6CB7]"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{ boxShadow: "0 0 44px #4B6CB777", zIndex: 3 }}
      >
        <h2 className="text-3xl font-bold mb-6 text-center text-[#1F2937]">Sign In</h2>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#67C8FF]"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#67C8FF]"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <button
            type="submit"
            className="w-full bg-[#4B6CB7] hover:bg-[#3e5bb3] text-white p-3 rounded-lg font-semibold transition"
          >
            Sign In
          </button>
        </form>

        <p className="text-sm mt-4 text-center">
          Don't have an account?{" "}
          <Link to="/signup" className="text-[#67C8FF] hover:underline font-medium">
            Sign Up
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default SignIn;

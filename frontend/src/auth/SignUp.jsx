import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = import.meta.env.VITE_API_URL || "https://visualogic-backend.onrender.com";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.11,
      duration: 0.6,
      ease: "easeOut",
    },
  }),
};
const fieldList = [
  { name: "name", label: "Full Name", type: "text", autoComplete: "name" },
  { name: "email", label: "Email", type: "email", autoComplete: "email" },
  { name: "mobile", label: "Mobile", type: "tel", autoComplete: "tel" },
  { name: "password", label: "Password", type: "password", autoComplete: "new-password" },
  { name: "collegeName", label: "College Name", type: "text", autoComplete: "organization" },
  { name: "collegeId", label: "College ID", type: "text", autoComplete: "off" },
  { name: "degree", label: "Degree/Course", type: "text", autoComplete: "off" },
  { name: "year", label: "Year/Semester", type: "text", autoComplete: "off" },
];

const SignUp = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    collegeName: "",
    collegeId: "",
    degree: "",
    year: "",
  });
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validateMobile = (mobile) =>
    /^(\+?\d{1,3}[- ]?)?\d{10}$/.test(mobile.replace(/\s+/g, ""));
  const getPasswordStrength = (password) => {
    if (password.length < 6) return "Weak";
    if (/[A-Z]/.test(password) && /\d/.test(password) && /[!@#$%^&*]/.test(password)) return "Strong";
    if (/[A-Z]/.test(password) && /\d/.test(password)) return "Medium";
    return "Weak";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (name === "password") {
      setPasswordStrength(getPasswordStrength(value));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!validateEmail(form.email)) newErrors.email = "Invalid email";
    if (!validateMobile(form.mobile)) newErrors.mobile = "Invalid mobile number (10 digits)";
    if (form.password.length < 6) newErrors.password = "At least 6 characters";
    if (!form.collegeName.trim()) newErrors.collegeName = "College name is required";
    if (!form.collegeId.trim()) newErrors.collegeId = "College ID required";
    if (!form.degree.trim()) newErrors.degree = "Degree/Course required";
    if (!form.year.trim()) newErrors.year = "Year/Semester required";
    if (!termsAccepted) newErrors.terms = "You must accept the Terms and Conditions";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  try {
    const response = await fetch(`${API_URL}/api/users/register`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(form),
});


    if (!response.ok) {
      const errorData = await response.json();
      setErrors({ api: errorData.message || "Registration failed" });
      return;
    }

    const data = await response.json();
    console.log("Registered:", data);

    // Clear form and navigate
    setForm({
      name: "",
      email: "",
      mobile: "",
      password: "",
      collegeName: "",
      collegeId: "",
      degree: "",
      year: "",
    });
    navigate("/signin");
  } catch (err) {
    console.error("Error registering:", err);
    setErrors({ api: "Server error. Please try again later." });
  }
};

  const getStrengthColor = () => {
    switch (passwordStrength) {
      case "Weak":
        return "bg-red-500";
      case "Medium":
        return "bg-amber-500";
      case "Strong":
        return "bg-emerald-500";
      default:
        return "bg-gray-300";
    }
  };

  return (
    <div
      className="bg-cyber-grid animate-cyber-grid animate-cyber-grid-pulse min-h-screen flex flex-col items-center justify-center px-4"
      style={{
        minHeight: "100vh",
        width: "100vw",
        position: "relative",
        margin: 0,
        padding: 0,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="mb-6 text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#4B6CB7] to-[#67C8FF] select-none"
      >
        VisuaLogic
      </motion.div>

      <motion.form
        onSubmit={handleSubmit}
        initial="hidden"
        animate="visible"
        className="backdrop-blur-md bg-white/95 w-full max-w-xl p-8 rounded-2xl shadow-xl border-t-4 border-[#4B6CB7] space-y-6"
        style={{
          boxShadow: "0 0 54px 0 #4B6CB750",
          zIndex: 7,
        }}
      >
        <motion.h2
          className="text-3xl font-bold text-center text-[#1F2937]"
          variants={fadeIn}
          custom={0}
        >
          Create Your Account
        </motion.h2>

        {fieldList.map((field, i) => (
          <motion.div key={field.name} variants={fadeIn} custom={i + 1}>
            <label className="block text-sm font-medium text-[#1F2937] mb-1">{field.label}</label>
            <input
              type={field.type}
              name={field.name}
              value={form[field.name] || ""}
              autoComplete={field.autoComplete}
              onChange={handleChange}
              placeholder={`Enter your ${field.label.toLowerCase()}`}
              className={`mt-1 w-full px-4 py-2 rounded-lg border ${
                errors[field.name] ? "border-red-500" : "border-gray-300"
              } focus:outline-none focus:ring-2 focus:ring-[#67C8FF] transition-all`}
            />
            {errors[field.name] && (
              <p className="text-red-500 text-xs mt-1">{errors[field.name]}</p>
            )}
          </motion.div>
        ))}

        {form.password && (
          <motion.div className="mt-2" variants={fadeIn} custom={fieldList.length + 1}>
            <label className="text-sm font-semibold text-[#1F2937]">
              Password Strength:
              <span
                className={`ml-2 px-2 py-1 text-white text-xs rounded-full ${getStrengthColor()}`}
              >
                {passwordStrength}
              </span>
            </label>
            <div className="w-full h-2 mt-2 bg-gray-300 rounded-full">
              <motion.div
                className={`h-2 rounded-full ${getStrengthColor()}`}
                initial={{ width: "0%" }}
                animate={{
                  width:
                    passwordStrength === "Weak"
                      ? "33%"
                      : passwordStrength === "Medium"
                      ? "66%"
                      : "100%",
                }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </motion.div>
        )}

        <motion.div
          className="flex items-center mt-4"
          variants={fadeIn}
          custom={fieldList.length + 2}
          style={{ userSelect: "none" }}
        >
          <input
            type="checkbox"
            id="terms"
            checked={termsAccepted}
            onChange={() => setTermsAccepted(!termsAccepted)}
            className={`mr-3 w-5 h-5 rounded border ${
              errors.terms ? "border-red-500" : "border-gray-300"
            } focus:ring-2 focus:ring-[#67C8FF] transition-all cursor-pointer`}
          />
          <label htmlFor="terms" className="text-sm text-[#1F2937] cursor-pointer select-text flex items-center">
            I agree to the{" "}
            <motion.span
              onClick={() => setShowTerms(true)}
              className="text-[#67C8FF] underline ml-1 cursor-pointer font-semibold"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Terms and Conditions
            </motion.span>
          </label>
        </motion.div>
        {errors.terms && (
          <p className="text-red-500 text-xs mt-1 ml-8">{errors.terms}</p>
        )}

        <motion.button
          type="submit"
          variants={fadeIn}
          custom={fieldList.length + 3}
          className="w-full bg-[#4B6CB7] hover:bg-[#3e5bb3] text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={!termsAccepted}
        >
          Sign Up
        </motion.button>

        <motion.p
          className="text-center text-sm text-[#1F2937]"
          variants={fadeIn}
          custom={fieldList.length + 4}
        >
          Already registered?{" "}
          <span
            onClick={() => navigate("/signin")}
            className="text-[#67C8FF] cursor-pointer hover:underline font-medium"
          >
            Sign In
          </span>
        </motion.p>
      </motion.form>

      {/* Terms and Conditions modal */}
      <AnimatePresence>
        {showTerms && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowTerms(false)}
          >
            <motion.div
              className="bg-white rounded-lg max-w-xl w-full max-h-[80vh] overflow-y-auto p-6 relative"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-4 text-[#1F2937]">Terms and Conditions</h3>
              <div className="text-sm text-gray-700 space-y-3 leading-relaxed max-h-[60vh] overflow-y-auto">
                <p>Welcome to VisuaLogic! Please read these terms and conditions carefully before using our service.</p>
                <p><b>1. Acceptance of Terms:</b> By signing up, you agree to abide by all rules and policies set forth.</p>
                <p><b>2. Privacy:</b> Your personal data will be handled securely and not shared without your consent.</p>
                <p><b>3. Use Restrictions:</b> You agree not to misuse the service, including unauthorized access or distribution.</p>
                <p><b>4. Intellectual Property:</b> All content and technology used belong to VisuaLogic and are protected.</p>
                <p><b>5. Liability:</b> VisuaLogic is not responsible for user errors or interruptions caused by external factors.</p>
                <p><b>6. Amendments:</b> Terms may be updated; continued use implies acceptance.</p>
                <p>Please contact support@visualogic.com for any inquiries.</p>
              </div>
              <button
                onClick={() => setShowTerms(false)}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                aria-label="Close Terms and Conditions"
              >
                &#x2715;
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SignUp;

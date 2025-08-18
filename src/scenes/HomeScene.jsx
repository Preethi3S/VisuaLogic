// src/scenes/HomeScene.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import Slider from "react-slick";
import { motion } from "framer-motion";
import {
  Cpu,
  Code,
  Network,
  Globe,
  Brain,
  Database,
  Terminal,
  Search,
  Instagram,
  Facebook,
  Twitter,
} from "lucide-react";

const subjects = [
  { name: "Operating Systems", path: "/os", icon: Cpu, color: "#4B6CB7", description: "Understand processes, scheduling, and system design." },
  { name: "Compiler Design", path: "/cd", icon: Code, color: "#67C8FF", description: "Learn lexical analysis, parsing, and code generation." },
  { name: "Computer Networks", path: "/cn", icon: Network, color: "#10B981", description: "Dive into OSI model, TCP/IP, and network protocols." },
  { name: "Web Design", path: "/web", icon: Globe, color: "#F59E0B", description: "Master HTML, CSS, JS and responsive design." },
  { name: "Artificial Intelligence", path: "/ai", icon: Brain, color: "#E11D48", description: "Explore ML, neural networks, and AI ethics." },
  { name: "Database Management", path: "/dbms", icon: Database, color: "#9333EA", description: "Work with relational models, SQL, and transactions." },
  { name: "Data Structures & Algorithms", path: "/dsa", icon: Terminal, color: "#F97316", description: "Implement efficient algorithms and structures." }
];

const categories = ["All", "Theory", "Programming", "AI"];

const plans = [
  { title: "Free", color: "#4B6CB7", price: "0", features: ["Basic Subject Access", "Limited Animations", "Community Support"], button: "Get Started" },
  { title: "Pro", color: "#FBBF24", price: "499", features: ["All Subjects", "3D Animations", "Priority Support"], button: "Upgrade", popular: true },
  { title: "Ultra", color: "#9333EA", price: "999", features: ["All Pro Features", "AI Tutor Access", "Early Feature Access"], button: "Go Ultra" }
];

const HomeScene = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categoryMap = {
    All: subjects,
    Theory: subjects.filter(s => ["Operating Systems", "Compiler Design", "Computer Networks"].includes(s.name)),
    Programming: subjects.filter(s => ["Data Structures & Algorithms"].includes(s.name)),
    AI: subjects.filter(s => ["Artificial Intelligence"].includes(s.name))
  };

  const filteredSubjects = categoryMap[selectedCategory] || subjects;

  const settings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    arrows: true,
    autoplay: true,
    autoplaySpeed: 3000,
    pauseOnHover: true,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 2 } },
      { breakpoint: 640, settings: { slidesToShow: 1 } }
    ]
  };

  return (
    <div className="min-h-screen bg-[#0a0f1c] flex flex-col relative overflow-hidden text-white">
      
      {/* CYBER GRID BACKGROUND WITH SCANNING LASER */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <svg className="w-full h-full opacity-40" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="1.5" result="blur"/>
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#00f6ff" strokeWidth="0.8" filter="url(#glow)" />
            </pattern>
          </defs>

          {/* Grid */}
          <rect width="100%" height="100%" fill="url(#grid)">
            <animateTransform
              attributeName="transform"
              type="translate"
              from="0 0"
              to="40 40"
              dur="6s"
              repeatCount="indefinite"
            />
          </rect>

          {/* Scanning Laser Effect */}
          <line x1="0" y1="0" x2="100%" y2="0" stroke="#00f6ff" strokeWidth="2" opacity="0.6">
            <animate
              attributeName="y1"
              from="0"
              to="100%"
              dur="4s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="y2"
              from="0"
              to="100%"
              dur="4s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0;0.6;0"
              dur="4s"
              repeatCount="indefinite"
            />
          </line>
        </svg>
      </div>

      {/* BLOBS */}
      <motion.div
        className="absolute top-0 left-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-40 z-0"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 80, ease: "linear" }}
      />
      <motion.div
        className="absolute top-40 right-0 w-96 h-96 bg-sky-400 rounded-full mix-blend-multiply filter blur-3xl opacity-40 z-0"
        animate={{ rotate: -360 }}
        transition={{ repeat: Infinity, duration: 100, ease: "linear" }}
      />

      {/* HEADER */}
      <header className=" text-white px-6 py-4 flex items-center justify-between shadow-md relative z-10">
        <motion.h1
          initial={{ rotate: -10, opacity: 0, scale: 0.8 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          whileHover={{ rotate: 5, scale: 1.05 }}
          transition={{ type: "spring", stiffness: 80 }}
          className="text-2xl font-extrabold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent tracking-wider"
        >
          ✨ VisuaLogic
        </motion.h1>

        <nav className="space-x-6 hidden md:flex">
          {["Home", "About", "Contact", "Batches"].map((link, i) => (
            <motion.div key={i} whileHover={{ scale: 1.1 }}>
              <Link to={`/${link.toLowerCase().replace(" ", "")}`} className="relative hover:text-[#F8FAFC] transition">
                {link}
                <motion.span
                  className="absolute left-0 -bottom-1 w-full h-0.5 bg-white"
                  layoutId="underline"
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.3 }}
                />
              </Link>
            </motion.div>
          ))}
        </nav>
      </header>

      {/* HERO SECTION */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8 }}
        className=" text-white py-16 px-6 rounded-b-3xl shadow-lg relative z-10"
      >
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-4xl md:text-5xl font-bold mb-4 text-center"
        >
          VisuaLogic — Learn Computer Science Visually
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.4 }}
          className="text-lg max-w-2xl mx-auto text-center"
        >
          Explore interactive 3D visualizations and animations to master
          Computer Science concepts with ease.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex justify-center mt-6"
        >
          <Link
            to="/quiz"
            className="px-6 py-3 bg-yellow-400 text-gray-900 font-bold rounded-full shadow-lg hover:bg-yellow-300 transition transform hover:scale-105"
          >
            🎯 Take a Fun Quiz!
          </Link>
        </motion.div>

        {/* SEARCH BAR */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          whileHover={{ scale: 1.02, boxShadow: "0 10px 20px rgba(0,0,0,0.2)" }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-8 flex items-center bg-white rounded-full shadow-md max-w-lg mx-auto px-4 py-2"
        >
          <Search className="text-gray-500" size={20} />
          <input
            type="text"
            placeholder="Search for a topic..."
            className="flex-1 px-3 py-2 outline-none text-gray-700"
          />
        </motion.div>
      </motion.div>

      {/* CATEGORY FILTER */}
      <motion.div
        className="flex justify-center mt-6 space-x-3 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ staggerChildren: 0.1 }}
      >
        {categories.map((cat, i) => (
          <motion.button
            key={i}
            onClick={() => setSelectedCategory(cat)}
            whileHover={{ scale: 1.1 }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              selectedCategory === cat
                ? "bg-[#4B6CB7] text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {cat}
          </motion.button>
        ))}
      </motion.div>

      {/* POPULAR SUBJECTS - CAROUSEL */}
      <motion.div
        className="p-8 flex-1 relative z-10"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <h2 className="text-2xl font-semibold text-[#F8FAFC] mb-6">Popular Subjects</h2>
        <Slider {...settings}>
          {filteredSubjects.map((subject, index) => {
            const Icon = subject.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="px-3"
              >
                <motion.div
                  whileHover={{ rotateY: 10, scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300"
                >
                  <div className="h-2" style={{ backgroundColor: subject.color }}></div>
                  <div className="p-6 flex flex-col items-center text-center">
                    <Icon size={50} color={subject.color} className="mb-4" />
                    <h3 className="text-lg font-semibold text-[#1F2937] mb-2">{subject.name}</h3>
                    <p className="text-sm text-gray-500 mb-4">{subject.description}</p>
                    <Link
                      to={subject.path}
                      className="px-4 py-2 rounded-lg text-white font-medium"
                      style={{ backgroundColor: subject.color }}
                    >
                      Explore
                    </Link>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </Slider>
      </motion.div>

      {/* SUBSCRIPTION MODEL */}
      <motion.section
        className="py-16 relative z-10"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        transition={{ staggerChildren: 0.2 }}
      >
        <h2 className="text-3xl font-bold text-center text-[#F8FAFC] mb-10">Choose Your Plan</h2>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 px-6">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}
              whileHover={{ scale: 1.05, boxShadow: `0 10px 20px ${plan.color}55` }}
              className={`bg-white rounded-2xl shadow-lg p-8 border flex flex-col items-center text-center relative ${plan.popular ? "border-yellow-400" : "border-gray-200"}`}
            >
              {plan.popular && <span className="absolute top-0 bg-yellow-400 text-gray-900 px-3 py-1 rounded-b-lg text-xs font-bold">POPULAR</span>}
              <h3 className="text-xl font-bold" style={{ color: plan.color }}>{plan.title}</h3>
              <p className="text-4xl font-extrabold my-4">₹{plan.price}<span className="text-lg font-normal">/mo</span></p>
              <ul className="text-gray-600 mb-6 space-y-2">{plan.features.map((f,i) => <li key={i}>✔ {f}</li>)}</ul>
              <button className="px-6 py-2 rounded-lg text-white font-bold" style={{ backgroundColor: plan.color, transition: "all 0.3s" }}>
                {plan.button}
              </button>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* FOOTER */}
      <motion.footer
        className="bg-[#1F2937] text-gray-300 py-6 relative z-10"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
      >
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
          <p>&copy; {new Date().getFullYear()} VisuaLogic. All rights reserved.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            {[Instagram, Facebook, Twitter].map((Icon, i) => (
              <motion.a key={i} href="#" target="_blank" rel="noreferrer" whileHover={{ scale: 1.2, color: "#ffffff" }}>
                <Icon />
              </motion.a>
            ))}
          </div>
        </div>
      </motion.footer>
    </div>
  );
};

export default HomeScene;

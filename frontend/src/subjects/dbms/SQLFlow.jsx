import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const colors = {
  primary: "#4B6CB7",
  accent: "#67C8FF",
  background: "#0A0F1F", // cyber grid base
  text: "#E0E7FF", // cyber grid text color
  boxBg: "#15203f", // cyber grid panel
  arrow: "#4B6CB7",
};

function simpleParseSQL(query) {
  const result = {
    select: [],
    from: null,
    joins: [],
    where: null,
  };

  try {
    const selectMatch = query.match(/select\s+(.*?)\s+from\s+/i);
    if (!selectMatch) throw new Error("Invalid SQL: Missing SELECT or FROM");
    result.select = selectMatch[1]
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);

    const fromMatch = query.match(/from\s+(\w+)/i);
    if (!fromMatch) throw new Error("Invalid SQL: Missing FROM table");
    result.from = fromMatch[1];

    const joinRegex = /join\s+(\w+)\s+on\s+(.*?)(?=\sjoin|\swhere|$)/gi;
    let match;
    while ((match = joinRegex.exec(query))) {
      result.joins.push({
        table: match[1],
        on: match[2].trim(),
      });
    }

    const whereMatch = query.match(/where\s+(.*)/i);
    if (whereMatch) {
      result.where = whereMatch[1].trim();
    }
  } catch {
    return null;
  }

  return result;
}

const boxVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4 } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.3 } },
};

const arrowVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
  exit: { opacity: 0, scale: 0.8, transition: { duration: 0.3 } },
};

function Box({ title, children }) {
  return (
    <motion.div
      variants={boxVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      style={{
        backgroundColor: colors.boxBg,
        border: `2px solid ${colors.primary}`,
        borderRadius: 10,
        padding: 20,
        minWidth: 160,
        textAlign: "center",
        fontWeight: "700",
        color: colors.text,
        margin: "0 10px",
        boxShadow: "0 0 18px #4B6CB744",
        fontSize: 17,
      }}
    >
      <div style={{ fontSize: 18 }}>{title}</div>
      {children && <div style={{ marginTop: 10, fontWeight: "normal", fontSize: 16 }}>{children}</div>}
    </motion.div>
  );
}

function Arrow() {
  return (
    <motion.div
      variants={arrowVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      style={{
        width: 44,
        height: 24,
        borderTop: `5px solid ${colors.arrow}`,
        borderRight: `5px solid ${colors.arrow}`,
        transform: "rotate(45deg)",
        margin: "0 8px",
      }}
    />
  );
}

export default function SQLFlowVisualizer() {
  const [query, setQuery] = useState("");
  const [parsed, setParsed] = useState(null);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");

  const getPlanStepsCount = () => {
    if (!parsed) return 0;
    return 1 + parsed.joins.length + (parsed.where ? 1 : 0) + 1;
  };

  const handleParse = () => {
    const res = simpleParseSQL(query);
    if (!res) {
      setError("Failed to parse SQL. Please use simple SELECT-FROM-JOIN-WHERE syntax.");
      setParsed(null);
      setStep(0);
      return;
    }
    setParsed(res);
    setError("");
    setStep(0);
  };

  const nextStep = () => {
    if (step < getPlanStepsCount() - 1) setStep(step + 1);
  };
  const prevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <div
      className="bg-cyber-grid animate-cyber-grid animate-cyber-grid-pulse"
      style={{
        minHeight: "100vh",
        width: "100vw",
        padding: "0",
        margin: "0",
        boxSizing: "border-box",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          maxWidth: 720,
          margin: "50px auto",
          background: "rgba(12,17,35,0.93)",
          borderRadius: "22px",
          boxShadow: "0 0 30px 0 rgba(70,180,255,0.15)",
          padding: "36px 30px",
          color: colors.text,
        }}
      >
        <h1
          style={{
            background: "linear-gradient(90deg,#8beee9 15%,#4B6CB7 85%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontWeight: 900,
            fontSize: 28,
            letterSpacing: 2,
            marginBottom: "24px",
            textAlign: "center",
          }}
        >
          SQL Flow Visualizer (Multiple JOINs) with Animation
        </h1>

        <textarea
          rows={4}
          placeholder="Enter a simple SQL SELECT query here..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            width: "100%",
            fontSize: 17,
            padding: 13,
            borderRadius: 8,
            border: `1.5px solid ${colors.primary}`,
            boxSizing: "border-box",
            fontFamily: "monospace",
            marginBottom: 16,
            background: "#15203f",
            color: colors.text,
            outlineColor: colors.accent,
          }}
        />
        <button
          onClick={handleParse}
          style={{
            background: "linear-gradient(90deg,#4B6CB7,#67C8FF)",
            color: "#fff",
            border: "none",
            padding: "13px 22px",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: "700",
            fontSize: 17,
            boxShadow: "0 0 10px #67C8FF44",
            marginBottom: 8,
          }}
        >
          Parse & Visualize
        </button>

        {error && (
          <p
            style={{
              marginTop: 14,
              color: "#fff",
              background: "#EF4444",
              padding: 12,
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 16,
              letterSpacing: 1,
              boxShadow: "0 0 5px #EF444466"
            }}
          >
            {error}
          </p>
        )}

        {parsed && (
          <div
            style={{
              marginTop: 32,
              padding: 18,
              background: "#223366",
              borderRadius: 12,
              border: `1.5px solid ${colors.accent}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflowX: "auto",
              boxShadow: "0 0 12px #67C8FF22",
            }}
          >
            <AnimatePresence>
              {/* Always show Scan */}
              {step >= 0 && (
                <>
                  <Box key="scan" title={`Scan Table: ${parsed.from}`} />
                  {step > 0 && <Arrow key="arrow-scan" />}
                </>
              )}

              {/* Join steps */}
              {parsed.joins.map((join, idx) =>
                step >= idx + 1 ? (
                  <React.Fragment key={`join-${idx}`}>
                    <Box title={`Join Table: ${join.table}`}>
                      <small>On: {join.on}</small>
                    </Box>
                    {step > idx + 1 && idx + 1 !== parsed.joins.length && <Arrow />}
                  </React.Fragment>
                ) : null
              )}

              {/* Filter step */}
              {parsed.where && step >= parsed.joins.length + 1 && (
                <>
                  <Arrow key="arrow-filter" />
                  <Box key="filter" title="Filter Rows">
                    <small>{parsed.where}</small>
                  </Box>
                </>
              )}

              {/* Output step */}
              {step >= getPlanStepsCount() - 1 && (
                <>
                  <Arrow key="arrow-output" />
                  <Box key="output" title="Output Result">
                    <small>SELECT {parsed.select.join(", ")}</small>
                  </Box>
                </>
              )}
            </AnimatePresence>
          </div>
        )}

        {parsed && (
          <div style={{ marginTop: 22, textAlign: "center" }}>
            <button
              onClick={prevStep}
              disabled={step === 0}
              style={{
                background: step === 0 ? "#334155" : "linear-gradient(90deg,#67C8FF,#4B6CB7)",
                color: step === 0 ? "#B0B0B0" : "#fff",
                border: "none",
                padding: "11px 18px",
                borderRadius: 8,
                cursor: step === 0 ? "default" : "pointer",
                fontWeight: "700",
                fontSize: 16,
                marginRight: 14,
                opacity: step === 0 ? "0.7" : "1",
              }}
            >
              Previous Step
            </button>
            <button
              onClick={nextStep}
              disabled={step === getPlanStepsCount() - 1}
              style={{
                background:
                  step === getPlanStepsCount() - 1
                    ? "#334155"
                    : "linear-gradient(90deg,#67C8FF,#4B6CB7)",
                color: step === getPlanStepsCount() - 1 ? "#B0B0B0" : "#fff",
                border: "none",
                padding: "11px 18px",
                borderRadius: 8,
                cursor: step === getPlanStepsCount() - 1 ? "default" : "pointer",
                fontWeight: "700",
                fontSize: 16,
                opacity: step === getPlanStepsCount() - 1 ? "0.7" : "1",
              }}
            >
              Next Step
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

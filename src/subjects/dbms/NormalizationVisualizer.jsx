// src/subjects/dbms/NormalizationVisualizer.jsx
import React, { useState } from "react";

const colors = {
  primary: "#4B6CB7",
  accent: "#67C8FF",
  success: "#10B981",
  warning: "#F59E0B",
  text: "#E0E7FF", // Cyber theme text color
  background: "#0A0F1F", // cyber grid dark base
};

// Utility functions...

function parseAttributes(input) {
  return input
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);
}

function parseFDs(input) {
  const fds = [];
  const lines = input.split("\n").map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    const parts = line.split("->");
    if (parts.length !== 2) throw new Error(`Invalid FD format: "${line}"`);
    const lhs = parseAttributes(parts[0]);
    const rhs = parseAttributes(parts[1]);
    if (lhs.length === 0 || rhs.length === 0) throw new Error(`Invalid FD attributes: "${line}"`);
    fds.push({ lhs, rhs });
  }
  return fds;
}

function computeClosure(attrs, fds) {
  const closure = new Set(attrs);
  let added;
  do {
    added = false;
    for (const fd of fds) {
      if (fd.lhs.every((a) => closure.has(a))) {
        fd.rhs.forEach((a) => {
          if (!closure.has(a)) {
            closure.add(a);
            added = true;
          }
        });
      }
    }
  } while (added);
  return closure;
}

function powerset(arr) {
  const result = [[]];
  for (const el of arr) {
    const copy = [...result];
    for (const subset of copy) {
      result.push([...subset, el]);
    }
  }
  return result;
}

function findCandidateKeys(allAttrs, fds) {
  const sortedSubsets = powerset(allAttrs)
    .filter((s) => s.length > 0)
    .sort((a, b) => a.length - b.length);
  const keys = [];
  for (const subset of sortedSubsets) {
    const closure = computeClosure(subset, fds);
    if (allAttrs.every((a) => closure.has(a))) {
      // minimality check
      if (!keys.some((key) => key.every((k) => subset.includes(k)))) {
        keys.push(subset);
      }
    }
  }
  return keys;
}

function findPartialDependencies(candidateKeys, fds) {
  const partials = [];
  for (const fd of fds) {
    for (const key of candidateKeys) {
      if (
        fd.lhs.length < key.length &&
        fd.lhs.every((a) => key.includes(a)) &&
        fd.rhs.some((a) => !fd.lhs.includes(a))
      ) {
        partials.push(fd);
        break;
      }
    }
  }
  return partials;
}

function findTransitiveDependencies(candidateKeys, fds, allAttrs) {
  const transitive = [];
  const keyAttrs = new Set(candidateKeys.flat());
  for (const fd of fds) {
    const closure = computeClosure(fd.lhs, fds);
    const isSuperkey = allAttrs.every((a) => closure.has(a));
    if (!isSuperkey) {
      if (fd.rhs.some((a) => !keyAttrs.has(a))) {
        transitive.push(fd);
      }
    }
  }
  return transitive;
}

function attrListToString(arr) {
  return arr.join(", ");
}

export default function NormalizationVisualizer() {
  const [attributesInput, setAttributesInput] = useState("");
  const [fdsInput, setFdsInput] = useState("");
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [message, setMessage] = useState("");

  // On Start: compute normalization steps
  const handleStart = () => {
    setMessage("");
    try {
      const attrs = parseAttributes(attributesInput);
      if (attrs.length === 0) {
        setMessage("Please enter at least one attribute.");
        return;
      }
      const fds = parseFDs(fdsInput);
      const candidateKeys = findCandidateKeys(attrs, fds);
      if (candidateKeys.length === 0) {
        setMessage("No candidate key found. Check your functional dependencies.");
        return;
      }
      const partialDeps = findPartialDependencies(candidateKeys, fds);
      const transitiveDeps = findTransitiveDependencies(candidateKeys, fds, attrs);

      const dynamicSteps = [];
      dynamicSteps.push({
        nf: "Unnormalized Form (UNF)",
        explanation: "Initial relation with attributes and functional dependencies.",
        relations: [{ name: "R", attributes: attrs }],
      });
      dynamicSteps.push({
        nf: "First Normal Form (1NF)",
        explanation: "Relation is in 1NF as all attributes are atomic (no repeating groups).",
        relations: [{ name: "R", attributes: attrs }],
      });
      if (partialDeps.length > 0) {
        dynamicSteps.push({
          nf: "Second Normal Form (2NF) Violation",
          explanation:
            `Partial dependencies found violating 2NF:\n` +
            partialDeps
              .map(
                (fd) => `${attrListToString(fd.lhs)} → ${attrListToString(fd.rhs)}`
              )
              .join("\n") +
            "\nDecompose relations to remove partial dependencies.",
          relations: [{ name: "R", attributes: attrs }],
          partialDeps,
        });
      } else {
        dynamicSteps.push({
          nf: "Second Normal Form (2NF)",
          explanation: "No partial dependencies found. Relation is in 2NF.",
          relations: [{ name: "R", attributes: attrs }],
        });
      }
      if (transitiveDeps.length > 0) {
        dynamicSteps.push({
          nf: "Third Normal Form (3NF) Violation",
          explanation:
            `Transitive dependencies found violating 3NF:\n` +
            transitiveDeps
              .map(
                (fd) => `${attrListToString(fd.lhs)} → ${attrListToString(fd.rhs)}`
              )
              .join("\n") +
            "\nDecompose relations to remove transitive dependencies.",
          relations: [{ name: "R", attributes: attrs }],
          transitiveDeps,
        });
      } else {
        dynamicSteps.push({
          nf: "Third Normal Form (3NF)",
          explanation: "No transitive dependencies found. Relation is in 3NF.",
          relations: [{ name: "R", attributes: attrs }],
        });
      }
      dynamicSteps.push({
        nf: "Boyce-Codd Normal Form (BCNF)",
        explanation:
          "BCNF requires every determinant to be a candidate key. Check your FDs for violations.",
        relations: [{ name: "R", attributes: attrs }],
      });
      setSteps(dynamicSteps);
      setCurrentStep(0);
    } catch (error) {
      setMessage(error.message || "Error parsing input.");
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setMessage("");
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setMessage("");
    }
  };

  // Example data for quick loading
  const exampleAttrs = "A, B, C, D, E";
  const exampleFDs = "A -> B\nB -> C, D\nA, E -> D";

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
          maxWidth: 770,
          margin: "48px auto",
          background: "rgba(12,17,35,0.92)",
          borderRadius: "20px",
          boxShadow: "0 0 32px 0 rgba(70,180,255,0.16)",
          padding: "36px 32px",
          color: colors.text,
        }}
      >
        <h1
          style={{
            background: "linear-gradient(90deg,#8beee9 20%,#4B6CB7 90%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontWeight: 900,
            fontSize: 32,
            letterSpacing: 2,
            marginBottom: "28px",
            textAlign: "center",
          }}
        >
          Normalization Visualizer
        </h1>
        <section
          style={{
            background: "#223366",
            padding: 18,
            borderRadius: 12,
            border: `1.5px solid ${colors.accent}`,
            marginBottom: 32,
            color: "#B3CAFF",
            boxShadow: "0 0 12px #67C8FF22",
            fontWeight: "600",
          }}
        >
          <label style={{ fontWeight: "700", color: colors.accent }}>
            Relation Attributes (comma separated)
          </label>
          <input
            type="text"
            value={attributesInput}
            onChange={(e) => setAttributesInput(e.target.value)}
            placeholder="E.g. A, B, C, D, E"
            style={{
              width: "100%",
              padding: 11,
              fontSize: 17,
              marginTop: 7,
              borderRadius: 8,
              border: `1.5px solid ${colors.primary}`,
              boxSizing: "border-box",
              background: "#15203f",
              color: "#E0E7FF",
              marginBottom: 10,
              fontFamily: "monospace",
              outlineColor: colors.accent,
            }}
          />

          <label
            style={{
              fontWeight: "700",
              color: colors.accent,
              marginTop: 16,
              display: "block",
            }}
          >
            Functional Dependencies (one per line, format: A,B -&gt; C,D)
          </label>
          <textarea
            rows={6}
            value={fdsInput}
            onChange={(e) => setFdsInput(e.target.value)}
            placeholder={"E.g.\nA -> B\nB -> C, D\nA, E -> D"}
            style={{
              width: "100%",
              padding: 11,
              fontSize: 17,
              marginTop: 7,
              borderRadius: 8,
              border: `1.5px solid ${colors.primary}`,
              boxSizing: "border-box",
              fontFamily: "monospace",
              background: "#15203f",
              color: "#E0E7FF",
              marginBottom: 16,
              outlineColor: colors.accent,
            }}
          />

          <div style={{ marginTop: 11 }}>
            <button
              onClick={handleStart}
              style={{
                background: "linear-gradient(90deg,#4B6CB7,#67C8FF)",
                color: "white",
                padding: "12px 26px",
                border: "none",
                borderRadius: 9,
                cursor: "pointer",
                marginRight: 15,
                fontWeight: "700",
                fontSize: 17,
                boxShadow: "0 0 10px #4B6CB744",
              }}
            >
              Start Normalization
            </button>
            <button
              onClick={() => {
                setAttributesInput(exampleAttrs);
                setFdsInput(exampleFDs);
                setSteps([]);
                setCurrentStep(-1);
                setMessage("");
              }}
              style={{
                background: "linear-gradient(90deg,#67C8FF,#4B6CB7)",
                color: "white",
                padding: "12px 26px",
                border: "none",
                borderRadius: 9,
                cursor: "pointer",
                fontWeight: "700",
                fontSize: 17,
                boxShadow: "0 0 10px #67C8FF44",
              }}
            >
              Load Example
            </button>
          </div>
          {message && (
            <p
              style={{
                marginTop: 16,
                padding: 12,
                background: colors.warning,
                color: "white",
                borderRadius: 8,
                whiteSpace: "pre-wrap",
                fontWeight: 700,
                fontSize: 16,
              }}
            >
              {message}
            </p>
          )}
        </section>

        {currentStep >= 0 && steps[currentStep] && (
          <section
            style={{
              background: "#192748",
              padding: 20,
              borderRadius: 13,
              border: `1.5px solid ${colors.primary}`,
              color: "#B3CAFF",
              boxShadow: "0 0 12px #4B6CB744",
            }}
          >
            <h2
              style={{
                color: colors.accent,
                fontSize: 24,
                letterSpacing: 1,
                fontWeight: 900,
                marginBottom: 14,
              }}
            >
              Step {currentStep + 1}: {steps[currentStep].nf}
            </h2>
            <p style={{ whiteSpace: "pre-wrap", fontSize: 17 }}>{steps[currentStep].explanation}</p>

            {steps[currentStep].relations.map((rel, idx) => (
              <div
                key={idx}
                style={{
                  marginTop: 10,
                  padding: 14,
                  borderRadius: 8,
                  border: `1px solid ${colors.accent}`,
                  background: "#223366",
                  fontWeight: "700",
                  color: "#E0E7FF",
                  fontSize: 17,
                  boxShadow: "0 0 5px #67C8FF22",
                }}
              >
                <strong>{rel.name}</strong> ({attrListToString(rel.attributes)})
              </div>
            ))}
            <div style={{ marginTop: 18 }}>
              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                style={{
                  background: currentStep === 0 ? "#334155" : "linear-gradient(90deg,#67C8FF,#4B6CB7)",
                  color: currentStep === 0 ? "#B0B0B0" : "white",
                  border: "none",
                  padding: "10px 22px",
                  borderRadius: 9,
                  cursor: currentStep === 0 ? "default" : "pointer",
                  marginRight: 14,
                  fontWeight: "700",
                  fontSize: 16,
                  opacity: currentStep === 0 ? "0.6" : "1",
                }}
              >
                Previous
              </button>
              <button
                onClick={nextStep}
                disabled={currentStep === steps.length - 1}
                style={{
                  background:
                    currentStep === steps.length - 1
                      ? "#334155"
                      : "linear-gradient(90deg,#67C8FF,#4B6CB7)",
                  color: currentStep === steps.length - 1 ? "#B0B0B0" : "white",
                  border: "none",
                  padding: "10px 22px",
                  borderRadius: 9,
                  cursor:
                    currentStep === steps.length - 1 ? "default" : "pointer",
                  fontWeight: "700",
                  fontSize: 16,
                  opacity: currentStep === steps.length - 1 ? "0.6" : "1",
                }}
              >
                Next
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

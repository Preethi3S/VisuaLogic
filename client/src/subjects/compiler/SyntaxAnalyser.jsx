import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

function tokenize(input) {
  const regex = /\s*(\d+|[()+\-\*/])\s*/g;
  let tokens = [];
  let m;
  while ((m = regex.exec(input)) !== null) {
    tokens.push(m[1]);
  }
  return tokens;
}

function createNode(type, value = null, children = []) {
  return { type, value, children };
}

function createParser(tokens) {
  let pos = 0;
  let history = [];
  let callStack = [];
  let tree = null;
  let error = null;

  function cloneNode(node) {
    if (!node) return null;
    return {
      type: node.type,
      value: node.value,
      children: node.children.map(cloneNode),
    };
  }

  function snapshot(description = "") {
    history.push({
      pos,
      tree: cloneNode(tree),
      callStack: [...callStack],
      error,
      description,
    });
  }

  function parseExpr() {
    callStack.push("parseExpr");
    snapshot("Start parseExpr");
    tree = createNode("Expr", null, []);
    parseTerm();
    snapshot("Completed first Term in Expr");

    function parseRest() {
      while (pos < tokens.length && (tokens[pos] === "+" || tokens[pos] === "-")) {
        const op = tokens[pos];
        tree.children.push(createNode("Operator", op));
        pos++;
        snapshot(`Consumed operator '${op}' in Expr`);
        parseTerm();
        snapshot("Completed Term after operator");
      }
    }
    parseRest();
    callStack.pop();
    snapshot("Finished parseExpr");
  }

  function parseTerm() {
    callStack.push("parseTerm");
    snapshot("Start parseTerm");
    const termNode = createNode("Term", null, []);
    tree.children.push(termNode);

    function parseFactor() {
      callStack.push("parseFactor");
      snapshot("Start parseFactor");

      if (pos < tokens.length && tokens[pos] === "(") {
        pos++;
        snapshot("Consumed '('");
        parseExpr();
        if (pos >= tokens.length || tokens[pos] !== ")") {
          error = `Expected ')' but found '${tokens[pos] ?? "end"}'`;
          snapshot("Error: Missing ')'");
        } else {
          pos++;
          snapshot("Consumed ')'");
          error = null;
        }
      } else if (pos < tokens.length && /^\d+$/.test(tokens[pos])) {
        termNode.children.push(createNode("Number", tokens[pos]));
        pos++;
        snapshot("Parsed Number");
        error = null;
      } else {
        error = `Unexpected token '${tokens[pos] ?? "end"}' in Factor`;
        snapshot("Error: Unexpected token");
      }
      callStack.pop();
      snapshot("End parseFactor");
    }

    parseFactor();

    while (pos < tokens.length && (tokens[pos] === "*" || tokens[pos] === "/")) {
      const op = tokens[pos];
      termNode.children.push(createNode("Operator", op));
      pos++;
      snapshot(`Consumed operator '${op}' in Term`);
      parseFactor();
    }

    callStack.pop();
    snapshot("Finished parseTerm");
  }

  parseExpr();

  return {
    getHistory: () => history,
    getTokens: () => tokens,
  };
}

// Colors for parse tree nodes
const nodeColors = {
  Expr: "#4B6CB7",
  Term: "#67C8FF",
  Factor: "#10B981",
  Number: "#F59E0B",
  Operator: "#EF4444",
  default: "#1F2937",
};

function RenderTree({ node }) {
  if (!node) return null;
  const bgColor = nodeColors[node.type] || nodeColors.default;
  const hasChildren = node.children && node.children.length > 0;
  return (
    <ul
      style={{
        listStyle: "none",
        paddingLeft: 20,
        margin: 0,
        borderLeft: "2px solid #ccc",
      }}
    >
      <li
        style={{
          backgroundColor: bgColor,
          color: "white",
          padding: "6px 12px",
          margin: "6px 0",
          borderRadius: 8,
          fontFamily: "monospace",
          cursor: "default",
          boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
          userSelect: "none",
          transition: "background-color 0.3s",
        }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = "#2563EB"}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = bgColor}
        title={node.value !== null ? `Value: ${node.value}` : node.type}
      >
        <b>{node.type}</b>
        {node.value !== null && (
          <span style={{ marginLeft: 8, fontWeight: "normal", color: "#FBBF24" }}>
            {node.value}
          </span>
        )}
      </li>
      {hasChildren &&
        node.children.map((child, i) => (
          <RenderTree key={i} node={child} />
        ))}
    </ul>
  );
}

export default function EnhancedParser() {
  const [input, setInput] = useState("2 + 3 * (4 - 1)");
  const [history, setHistory] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const playRef = useRef(null);

  // Parse only on input change
  useEffect(() => {
    const toks = tokenize(input);
    const parser = createParser(toks);
    setTokens(toks);
    setHistory(parser.getHistory());
    setStep(0);
    setPlaying(false);
  }, [input]);

  // Auto play
  useEffect(() => {
    if (!playing) return;
    playRef.current = setInterval(() => {
      setStep((s) => {
        if (s >= history.length - 1) {
          clearInterval(playRef.current);
          setPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, 700);
    return () => clearInterval(playRef.current);
  }, [playing, history.length]);

  const current = history[step] || {
    pos: 0,
    tree: null,
    callStack: [],
    error: null,
    description: "",
  };
  const activeTokenIndex = current.pos;

  // Cyber grid full-page background
  return (
    <div
      className="bg-cyber-grid animate-cyber-grid animate-cyber-grid-pulse"
      style={{
        minHeight: "100vh",
        width: "100vw",
        margin: 0,
        padding: 0,
        position: "relative",
      }}
    >
      <div
        style={{
          padding: 28,
          fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif",
          maxWidth: 850,
          margin: "40px auto",
          borderRadius: 18,
          boxSizing: "border-box",
          background: "rgba(12, 17, 35, 0.95)",
          minHeight: 480,
          color: "#E0E7FF",
          userSelect: "text",
          boxShadow: "0 0 42px 0 rgba(70,117,255,0.19)",
        }}
      >
        {/* Foreground panel */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            borderRadius: 16,
            padding: 36,
            color: "#B0CBF7",
            minHeight: 340,
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <label
            htmlFor="exprInput"
            style={{ fontWeight: "bold", color: "#67C8FF", fontSize: 18 }}
          >
            Enter arithmetic expression:
          </label>
          <input
            id="exprInput"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={playing}
            style={{
              width: "100%",
              fontSize: 19,
              padding: 12,
              borderRadius: 8,
              border: "1px solid #4B6CB7",
              marginBottom: 4,
              fontFamily: "monospace",
              backgroundColor: "#15203f",
              color: "white",
              boxShadow: "0 0 8px rgba(66, 142, 255, 0.3)",
              outlineOffset: 2,
              outlineColor: "#45a7ff",
              letterSpacing: "0.5px",
            }}
          />

          <div style={{ marginBottom: 14 }}>
            <strong style={{ color: "#67C8FF" }}>Tokens:</strong>{" "}
            {tokens.map((t, i) => (
              <span
                key={i}
                style={{
                  padding: "7px 12px",
                  marginRight: 7,
                  backgroundColor: i === activeTokenIndex ? "#FBBF24" : "#334155",
                  color: i === activeTokenIndex ? "#334155" : "#B0CBF7",
                  borderRadius: 8,
                  fontWeight: "bold",
                  userSelect: "none",
                  fontSize: 18,
                  border: i === activeTokenIndex ? "2px solid #F59E0B" : "none",
                  boxShadow: i === activeTokenIndex ? "0 0 12px #FBBF24" : "none",
                  transition: "all 0.2s",
                }}
              >
                {t}
              </span>
            ))}
          </div>

          <div>
            <strong style={{ color: "#67C8FF" }}>Parse Tree:</strong>
            {current.tree ? (
              <RenderTree node={current.tree} />
            ) : (
              <i style={{ color: "#ddd" }}>Parsing...</i>
            )}
          </div>

          <div
            style={{
              marginTop: 18,
              padding: 14,
              backgroundColor: current.error ? "#F59E0B33" : "#15203f",
              borderRadius: 10,
              fontStyle: "italic",
              minHeight: 64,
              color: current.error ? "#b91c1c" : "#E0E7EB",
              fontWeight: current.error ? "bold" : "normal",
              border: current.error ? "2px solid #EF4444" : "1px solid #334155",
              letterSpacing: "0.5px",
              boxShadow: current.error ? "0 0 12px #EF4444" : "none",
            }}
            title={current.description}
          >
            {current.error ? (
              <>
                ⚠️ <strong>Error:</strong> {current.error}
              </>
            ) : (
              current.description
            )}
          </div>

          <div
            style={{
              marginTop: 8,
              padding: 10,
              backgroundColor: "#334155",
              borderRadius: 10,
              fontFamily: "monospace",
              minHeight: 38,
              color: "#dbeafe",
            }}
          >
            <strong>Call Stack:</strong>{" "}
            {current.callStack.length > 0
              ? current.callStack.join(" → ")
              : "(empty)"}
          </div>

          <div
            style={{
              marginTop: 16,
              display: "flex",
              gap: 13,
              justifyContent: "center",
            }}
          >
            <button
              onClick={() => setStep((s) => Math.max(s - 1, 0))}
              disabled={step === 0}
              style={{
                padding: "10px 24px",
                fontSize: 16,
                cursor: step === 0 ? "not-allowed" : "pointer",
                background: step === 0 ? "#223366" : "linear-gradient(90deg,#4B6CB7,#67C8FF)",
                color: "#e0e7eb",
                border: "none",
                borderRadius: 8,
                fontWeight: 700,
                opacity: step === 0 ? 0.6 : 1,
                boxShadow: step === 0 ? "none" : "0 0 10px #67C8FF88",
                transition: "opacity 0.18s",
              }}
            >
              ◀ Step Back
            </button>
            <button
              onClick={() => setPlaying(!playing)}
              style={{
                padding: "10px 24px",
                fontSize: 16,
                cursor: "pointer",
                backgroundColor: playing ? "#4B6CB7" : "white",
                color: playing ? "white" : "#4B6CB7",
                border: "1px solid #4B6CB7",
                borderRadius: 8,
                fontWeight: "bold",
                boxShadow: playing ? "0 0 14px #4B6CB7" : "none",
                transition: "background-color 0.2s, color 0.2s"
              }}
            >
              {playing ? "Pause" : "Play"}
            </button>
            <button
              onClick={() => setStep((s) => (s < history.length - 1 ? s + 1 : s))}
              disabled={step >= history.length - 1}
              style={{
                padding: "10px 24px",
                fontSize: 16,
                cursor: step >= history.length - 1 ? "not-allowed" : "pointer",
                background: step >= history.length - 1
                  ? "#223366"
                  : "linear-gradient(90deg,#4B6CB7,#67C8FF)",
                color: "#e0e7eb",
                border: "none",
                borderRadius: 8,
                fontWeight: 700,
                opacity: step >= history.length - 1 ? 0.6 : 1,
                boxShadow: step >= history.length - 1 ? "none" : "0 0 10px #67C8FF88",
                transition: "opacity 0.18s",
              }}
            >
              Step Forward ▶
            </button>
          </div>

          <div style={{
            marginTop: 8,
            textAlign: "center",
            color: "#8beee9",
            fontSize: 15,
            fontWeight: 500,
            fontStyle: "italic",
            textShadow: "0 0 5px #192748"
          }}>
            Step: {step + 1} / {history.length}
          </div>
        </div>
      </div>
    </div>
  );
}

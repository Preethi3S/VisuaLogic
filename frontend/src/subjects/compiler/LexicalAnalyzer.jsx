import React, { useState, useEffect } from "react";

// Lexical analysis (returns tokens with types)
function lexicalAnalyze(input) {
  const tokenSpecs = [
    { type: "keyword", regex: /^(int|if|while|return|else)\b/ },
    { type: "identifier", regex: /^[a-zA-Z_]\w*/ },
    { type: "number", regex: /^\d+/ },
    { type: "operator", regex: /^[+\-\*/=]/ },
    { type: "separator", regex: /^[();]/ },
    { type: "whitespace", regex: /^\s+/ },
  ];

  let tokens = [];
  let str = input;

  while (str.length > 0) {
    let matched = false;
    for (const spec of tokenSpecs) {
      const match = str.match(spec.regex);
      if (match) {
        tokens.push({ type: spec.type, value: match[0] });
        str = str.slice(match[0].length);
        matched = true;
        break;
      }
    }
    if (!matched) {
      tokens.push({ type: "error", value: str[0] });
      str = str.slice(1);
    }
  }
  return tokens;
}

const tokenColors = {
  keyword: "#4B6CB7",
  identifier: "#67C8FF",
  number: "#10B981",
  operator: "#F59E0B",
  separator: "#1F2937",
  whitespace: "#E5E7EB",
  error: "#EF4444",
};

const tokenDescriptions = {
  keyword: "Reserved words that have special meaning in the language (e.g., int, if, while).",
  identifier: "Names given to variables, functions, or other user-defined elements.",
  number: "Numeric literals (e.g., 10, 20).",
  operator: "Symbols that perform operations (e.g., +, -, =).",
  separator: "Characters that separate expressions or statements (e.g., ;, ()).",
  whitespace: "A space or tab character, ignored by the compiler.",
  error: "Unknown or invalid character.",
};

export default function LexicalAnalyzer2D() {
  const [input, setInput] = useState("int sum = 10 + 20;");
  const tokens = lexicalAnalyze(input);

  // Expand tokens into characters array with token types assigned per char
  const chars = [];
  tokens.forEach(({ type, value }) => {
    for (let c of value) {
      chars.push({ char: c, type });
    }
  });

  // Array of indices for NON-whitespace chars to scan over
  const scanIndices = chars
    .map((c, i) => (c.type !== "whitespace" ? i : null))
    .filter((i) => i !== null);

  const [scanIndex, setScanIndex] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setScanIndex((pos) => (pos < scanIndices.length - 1 ? pos + 1 : 0));
    }, 500);
    return () => clearInterval(id);
  }, [playing, scanIndices.length]);

  // Map scanIndex to char index
  const activeCharIndex = scanIndices[scanIndex] ?? -1;
  const activeChar = chars[activeCharIndex] || { type: "", char: "" };

  // Cyber grid full page wrapper here
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
          padding: 24,
          fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif",
          maxWidth: 800,
          margin: "40px auto",
          borderRadius: 16,
          boxSizing: "border-box",
          minHeight: 420,
          color: "#E0E7FF",
          userSelect: "text",
          background: "rgba(12, 17, 35, 0.95)",
          boxShadow: "0 0 38px 0 rgba(70,117,255,0.2)",
        }}
      >
        {/* Foreground panel */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            borderRadius: 16,
            padding: 28,
            minHeight: 320,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <label
            htmlFor="codeInput"
            style={{ fontWeight: "bold", color: "#67C8FF", fontSize: 18 }}
          >
            Enter code to analyze:
          </label>
          <textarea
            id="codeInput"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setScanIndex(0);
            }}
            rows={4}
            style={{
              width: "100%",
              fontFamily: "monospace",
              fontSize: 16,
              padding: 12,
              borderRadius: 8,
              border: "1px solid #4B6CB7",
              resize: "vertical",
              backgroundColor: "#15203f",
              color: "white",
              boxShadow: "0 0 8px rgba(66, 142, 255, 0.5)",
              outlineOffset: 2,
              outlineColor: "#45a7ff",
            }}
          />

          <button
            onClick={() => setPlaying(!playing)}
            style={{
              alignSelf: "flex-start",
              padding: "10px 22px",
              fontSize: 16,
              cursor: "pointer",
              borderRadius: 8,
              border: "1px solid #4B6CB7",
              backgroundColor: playing ? "#4B6CB7" : "white",
              color: playing ? "white" : "#4B6CB7",
              fontWeight: "bold",
              userSelect: "none",
              transition: "background-color 0.3s ease, color 0.3s ease",
              boxShadow: playing ? "0 0 18px #4B6CB7" : "none",
            }}
            aria-pressed={playing}
            aria-label={playing ? "Pause token highlighting" : "Play token highlighting"}
          >
            {playing ? "Pause" : "Play"}
          </button>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              userSelect: "none",
              fontSize: 26,
              fontWeight: "900",
              justifyContent: "center",
              overflowX: "auto",
              paddingBottom: 8,
            }}
            aria-live="polite"
            aria-atomic="true"
            aria-relevant="additions"
          >
            {chars.map(({ char, type }, i) => (
              <div
                key={i}
                style={{
                  width: 32,
                  height: 44,
                  lineHeight: "44px",
                  textAlign: "center",
                  borderRadius: 10,
                  backgroundColor: tokenColors[type] || "gray",
                  color: type === "whitespace" ? "#6B7280" : "white",
                  boxShadow:
                    i === activeCharIndex
                      ? "0 0 14px 5px rgba(251, 191, 36, 0.95)"
                      : "none",
                  transition: "box-shadow 0.3s ease",
                  userSelect: "text",
                  fontFamily: "monospace",
                  cursor: type !== "whitespace" ? "default" : "auto",
                }}
                title={type !== "whitespace" ? type.toUpperCase() : "Space"}
                aria-label={
                  type !== "whitespace"
                    ? `${type} token: '${char}'`
                    : "Whitespace"
                }
                role="textbox"
              >
                {char === " " ? "\u00A0" : char}
              </div>
            ))}
          </div>

          {/* Explanation panel */}
          <div
            style={{
              marginTop: 10,
              padding: 24,
              border: "1px solid #4B6CB7",
              borderRadius: 14,
              backgroundColor: "#15203f",
              fontSize: 17,
              color: "#cbd5e1",
              fontStyle: "italic",
              userSelect: "text",
              minHeight: 90,
              boxShadow: "0 0 10px 0 rgba(75,108,183,0.5)",
            }}
            aria-live="polite"
            aria-atomic="true"
          >
            <strong style={{ color: "#67C8FF" }}>
              {activeChar.type.toUpperCase() || ""}
            </strong>
            : {tokenDescriptions[activeChar.type] || "No description available."}
          </div>
        </div>
      </div>
    </div>
  );
}

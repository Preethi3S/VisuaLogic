import React, { useState, useEffect } from "react";

/**
 * Generates intermediate code from an AST in 3-address format.
 */
function generateIntermediateCode(ast) {
  let tempCount = 0;
  const code = [];
  const symbolTable = new Map();

  function newTemp() {
    tempCount++;
    return `t${tempCount}`;
  }

  function gen(node) {
    if (!node) return null;

    switch (node.type) {
      case "Program":
        node.statements.forEach(gen);
        break;

      case "VarDecl":
        if (node.init) {
          const val = gen(node.init);
          code.push(`${node.name} = ${val}`);
        } else {
          code.push(`declare ${node.name} : int`);
        }
        symbolTable.set(node.name, "int");
        break;

      case "Assignment":
        const val = gen(node.value);
        code.push(`${node.name} = ${val}`);
        break;

      case "BinaryExpr":
        const left = gen(node.left);
        const right = gen(node.right);
        const temp = newTemp();
        code.push(`${temp} = ${left} ${node.op} ${right}`);
        return temp;

      case "Variable":
        return node.name;

      case "Number":
        return node.value;

      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  }

  gen(ast);
  return code;
}

/**
 * Stepwise, animated professional code generator component.
 * Now applies full-page cyber grid background.
 */
export default function IntermediateCodeGenerator({ ast }) {
  const [code, setCode] = useState([]);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (ast) {
      const fullCode = generateIntermediateCode(ast);
      setCode(fullCode);
      setStep(0);
    }
  }, [ast]);

  // Professional: Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft" && step > 0) setStep((s) => Math.max(0, s - 1));
      if (e.key === "ArrowRight" && step < code.length - 1) setStep((s) => s + 1);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [step, code.length]);

  // Full-page cyber grid bg is set on the outermost div, filling viewport.
  return (
    <div
      className="bg-cyber-grid animate-cyber-grid animate-cyber-grid-pulse"
      style={{
        minHeight: "100vh",
        width: "100vw",
        margin: 0,
        padding: 0,
        position: "relative",
        overflow: "auto",
      }}
    >
      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 700,
          margin: "48px auto",
          fontFamily: "monospace",
          padding: 28,
          borderRadius: 18,
          minHeight: 400,
          boxSizing: "border-box",
          color: "#E0E7FF",
          userSelect: "text",
          backgroundColor: "rgba(12,17,35,0.92)",
          boxShadow: "0 0 38px 0 rgba(70,180,255,0.18)",
        }}
      >
        <h2
          style={{
            background: "linear-gradient(90deg, #8beee9 10%, #45aeff 80%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontWeight: 800,
            letterSpacing: 1,
            marginBottom: 18,
            textAlign: "center",
          }}
        >
          Intermediate Code Generator
        </h2>

        {!ast ? (
          <div style={{ color: "#b0b0b0", fontStyle: "italic" }}>No AST to generate code from.</div>
        ) : (
          <>
            <div style={{ marginBottom: 10, textAlign: "center" }}>
              <span style={{
                background: "linear-gradient(90deg,#4B6CB7 30%, #67C8FF 70%)",
                borderRadius: 6,
                padding: "3px 12px",
                color: "white",
                fontWeight: 700,
                fontSize: 17,
                letterSpacing: 1,
                boxShadow: "0 0 8px 0 #67C8FF"
              }}>
                Step {step + 1} / {code.length}
              </span>
            </div>
            <pre
              style={{
                background: "rgba(20,28,44,0.93)",
                padding: 18,
                borderRadius: 8,
                minHeight: 150,
                fontSize: 17,
                lineHeight: 1.5,
                overflowX: "auto",
                color: "#84e1ff",
                boxShadow: "0 0 12px rgba(16,185,129,0.09)",
              }}
            >
              {code.slice(0, step + 1).map((line, i) => (
                <div key={i} style={{ color: i === step ? "#10B981" : "#67C8FF" }}>
                  {line}
                </div>
              ))}
            </pre>
            <div
              style={{
                marginTop: 15,
                display: "flex",
                justifyContent: "center",
                gap: 18,
              }}
            >
              <button
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
                style={{
                  padding: "10px 24px",
                  fontSize: 16,
                  cursor: step === 0 ? "not-allowed" : "pointer",
                  background: step === 0 ? "#223366" : "linear-gradient(90deg,#62e3e3,#47aeff)",
                  color: step === 0 ? "#b0b0b0" : "white",
                  border: "none",
                  borderRadius: 7,
                  fontWeight: 700,
                  transition: "opacity 0.2s",
                  opacity: step === 0 ? 0.5 : 1,
                  boxShadow: step === 0 ? "none" : "0 0 10px #47aeff88",
                }}
                aria-label="Step Back"
              >
                ◀ Step Back
              </button>
              <button
                onClick={() => setStep((s) => Math.min(code.length - 1, s + 1))}
                disabled={step === code.length - 1}
                style={{
                  padding: "10px 24px",
                  fontSize: 16,
                  cursor: step === code.length - 1 ? "not-allowed" : "pointer",
                  background:
                    step === code.length - 1
                      ? "#223366"
                      : "linear-gradient(90deg,#62e3e3,#47aeff)",
                  color: step === code.length - 1 ? "#b0b0b0" : "white",
                  border: "none",
                  borderRadius: 7,
                  fontWeight: 700,
                  transition: "opacity 0.2s",
                  opacity: step === code.length - 1 ? 0.5 : 1,
                  boxShadow:
                    step === code.length - 1 ? "none" : "0 0 10px #47aeff88",
                }}
                aria-label="Step Forward"
              >
                Step Forward ▶
              </button>
            </div>
            <div
              style={{
                marginTop: 20,
                fontSize: 13,
                color: "#8beee9",
                textAlign: "center",
                fontWeight: 500,
                letterSpacing: 1,
                textShadow: "0 0 6px #192748",
                fontStyle: "italic",
              }}
            >
              Use arrow keys for navigation. Three-address intermediate code (TAC) shown in sequence.
            </div>
          </>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// --- Lexer ---
function tokenize(input) {
  const regex = /\s*([A-Za-z_]\w*|\d+|==|!=|<=|>=|[=+\-\*/();])\s*/g;
  let tokens = [];
  let m;
  while ((m = regex.exec(input)) !== null) {
    tokens.push(m[1]);
  }
  return tokens;
}

// --- Parser ---
function createParser(tokens) {
  let pos = 0;
  let history = [];
  let error = null;

  function snapshot(desc = "") {
    history.push({
      pos,
      error,
      description: desc,
      symbolTable: new Map(symbolTable),
      currentNode: currentNode,
    });
  }

  let symbolTable = new Map();
  let currentNode = null;

  function peek() {
    return tokens[pos];
  }
  function consume(t) {
    if (peek() === t) {
      pos++;
      return true;
    }
    return false;
  }
  function expect(t) {
    if (peek() === t) {
      pos++;
      return true;
    }
    error = `Expected '${t}' but found '${peek() ?? "end"}'`;
    snapshot(error);
    return false;
  }

  // AST node creators
  function Program(statements) {
    return { type: "Program", statements };
  }
  function VarDecl(name, init = null) {
    return { type: "VarDecl", name, init };
  }
  function Assignment(name, value) {
    return { type: "Assignment", name, value };
  }
  function BinaryExpr(op, left, right) {
    return { type: "BinaryExpr", op, left, right };
  }
  function Variable(name) {
    return { type: "Variable", name };
  }
  function NumberLiteral(value) {
    return { type: "Number", value };
  }

  // Parsing functions
  function parseProgram() {
    let stmts = [];
    while (pos < tokens.length && !error) {
      let stmt = parseStatement();
      if (stmt) stmts.push(stmt);
      else break;
    }
    return Program(stmts);
  }

  function parseStatement() {
    snapshot("Parsing Statement");
    if (peek() === "int") return parseVarDecl();
    return parseAssignment();
  }

  function parseVarDecl() {
    snapshot("Parsing Variable Declaration");
    expect("int");
    if (!/^[A-Za-z_]\w*$/.test(peek())) {
      error = `Invalid identifier '${peek()}'`;
      snapshot(error);
      return null;
    }
    const name = tokens[pos++];
    let init = null;
    if (consume("=")) {
      init = parseExpression();
    }
    expect(";");
    if (symbolTable.has(name)) {
      error = `Variable "${name}" redeclared`;
    } else {
      symbolTable.set(name, "int");
    }
    snapshot(`Declared variable "${name}"`);
    return VarDecl(name, init);
  }

  function parseAssignment() {
    snapshot("Parsing Assignment");
    if (!/^[A-Za-z_]\w*$/.test(peek())) {
      error = `Invalid identifier '${peek()}'`;
      snapshot(error);
      return null;
    }
    const name = tokens[pos++];
    if (!symbolTable.has(name)) {
      error = `Variable "${name}" used before declaration`;
      snapshot(error);
    }
    expect("=");
    const value = parseExpression();
    expect(";");
    snapshot(`Assigned variable "${name}"`);
    return Assignment(name, value);
  }

  function parseExpression() {
    snapshot("Parsing Expression");
    let left = parseTerm();
    while (!error && (peek() === "+" || peek() === "-")) {
      const op = tokens[pos++];
      const right = parseTerm();
      left = BinaryExpr(op, left, right);
      snapshot(`Parsed binary operator '${op}'`);
    }
    return left;
  }
  function parseTerm() {
    let left = parseFactor();
    while (!error && (peek() === "*" || peek() === "/")) {
      const op = tokens[pos++];
      const right = parseFactor();
      left = BinaryExpr(op, left, right);
      snapshot(`Parsed binary operator '${op}'`);
    }
    return left;
  }
  function parseFactor() {
    if (peek() === "(") {
      consume("(");
      const expr = parseExpression();
      expect(")");
      return expr;
    }
    if (/^\d+$/.test(peek())) {
      const val = tokens[pos++];
      return NumberLiteral(Number(val));
    }
    if (/^[A-Za-z_]\w*$/.test(peek())) {
      const name = tokens[pos++];
      if (!symbolTable.has(name)) {
        error = `Variable "${name}" used before declaration`;
        snapshot(error);
      }
      return Variable(name);
    }
    error = `Unexpected token '${peek()}'`;
    snapshot(error);
    return null;
  }

  const ast = parseProgram();

  return {
    getHistory: () => history,
    getAST: () => ast,
    getError: () => error,
    getSymbolTable: () => symbolTable,
    getTokens: () => tokens,
  };
}

// --- Semantic Analyzer ---
function semanticAnalyze(ast) {
  const errors = [];
  const symbols = new Map();

  function visit(node) {
    if (!node) return;

    switch (node.type) {
      case "Program":
        node.statements.forEach(visit);
        break;
      case "VarDecl":
        if (symbols.has(node.name)) {
          errors.push(`Variable "${node.name}" redeclared.`);
        } else {
          symbols.set(node.name, "int");
        }
        if (node.init) visit(node.init);
        break;
      case "Assignment":
        if (!symbols.has(node.name)) {
          errors.push(`Variable "${node.name}" used before declaration.`);
        }
        visit(node.value);
        break;
      case "BinaryExpr":
        visit(node.left);
        visit(node.right);
        break;
      case "Variable":
        if (!symbols.has(node.name)) {
          errors.push(`Variable "${node.name}" used before declaration.`);
        }
        break;
      case "Number":
        break;
      default:
        errors.push(`Unknown node type: ${node.type}`);
    }
  }

  visit(ast);
  return errors;
}

// --- Animated Parse Tree (simplified for semantic analyzer) ---

const nodeColors = {
  Program: "#4B6CB7",
  VarDecl: "#67C8FF",
  Assignment: "#10B981",
  BinaryExpr: "#F59E0B",
  Variable: "#EF4444",
  Number: "#1F2937",
  default: "#999",
};

function RenderTree({ node }) {
  if (!node) return null;
  const bgColor = nodeColors[node.type] || nodeColors.default;

  // Collect children nodes differently per type
  let children = [];
  if (node.type === "Program") children = node.statements;
  else if (node.type === "VarDecl") children = node.init ? [node.init] : [];
  else if (node.type === "Assignment") children = [node.value];
  else if (node.type === "BinaryExpr") children = [node.left, node.right];
  else if (node.type === "Variable" || node.type === "Number") children = [];

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
          userSelect: "none",
        }}
        title={
          node.type +
          (node.name ? `: ${node.name}` : "") +
          (node.value !== undefined ? `: ${node.value}` : "")
        }
      >
        <b>{node.type}</b>{" "}
        {node.name && <span style={{ fontWeight: "normal" }}>{node.name}</span>}
        {typeof node.value === "number" && (
          <span style={{ marginLeft: 8, fontWeight: "normal" }}>{node.value}</span>
        )}
        {node.op && (
          <span style={{ marginLeft: 8, fontWeight: "normal" }}>{node.op}</span>
        )}
      </li>
      {children.length > 0 &&
        children.map((child, i) => <RenderTree key={i} node={child} />)}
    </ul>
  );
}

// --- Main Component ---
export default function SemanticAnalyzer() {
  const [input, setInput] = useState(
    `int a = 5;
int b = a + 3;
int c;
c = b * (2 + 1);`
  );

  const [parserHistory, setParserHistory] = useState([]);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [semanticErrors, setSemanticErrors] = useState([]);

  const playRef = useRef(null);

  useEffect(() => {
    const tokens = tokenize(input);
    const parser = createParser(tokens);
    setParserHistory(parser.getHistory());
    setStep(0);
    setPlaying(false);
    setSemanticErrors([]);
  }, [input]);

  useEffect(() => {
    if (!playing) return;
    playRef.current = setInterval(() => {
      setStep((s) => {
        if (s >= parserHistory.length - 1) {
          clearInterval(playRef.current);
          setPlaying(false);

          if (parserHistory.length > 0) {
            const ast = parserHistory[parserHistory.length - 1].currentNode || null;
            if (ast) {
              setSemanticErrors(semanticAnalyze(ast));
            }
          }
          return s;
        }
        return s + 1;
      });
    }, 700);
    return () => clearInterval(playRef.current);
  }, [playing, parserHistory]);

  const current = parserHistory[step] || {
    pos: 0,
    error: null,
    description: "",
    symbolTable: new Map(),
    currentNode: null,
  };

  // Outer cyber grid background fills page
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
          position: "relative",
          maxWidth: 900,
          margin: "40px auto",
          padding: 20,
          fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif",
          borderRadius: 16,
          boxSizing: "border-box",
          background: "rgba(12, 17, 35, 0.85)",
          color: "#E0E7FF",
          userSelect: "text",
          boxShadow: "0 0 32px 0 #45aeff55",
        }}
      >
        {/* Foreground layer for UI */}
        <label
          htmlFor="codeInput"
          style={{ fontWeight: "bold", marginBottom: 6, display: "block", color: "#8beee9" }}
        >
          Enter code (variable declarations and assignments):
        </label>
        <textarea
          id="codeInput"
          rows={8}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={playing}
          style={{
            width: "100%",
            fontSize: 16,
            padding: 8,
            borderRadius: 6,
            border: "1px solid #4B6CB7",
            marginBottom: 20,
            fontFamily: "monospace",
            resize: "vertical",
            backgroundColor: "#15203f",
            color: "white",
          }}
        />

        <div style={{ marginBottom: 20 }}>
          <strong style={{ color: "#67C8FF" }}>
            Parsing Step {step + 1} / {parserHistory.length}
          </strong>
          <div
            style={{
              marginTop: 6,
              padding: 10,
              backgroundColor: "#334155",
              borderRadius: 6,
              fontFamily: "monospace",
              minHeight: 60,
              whiteSpace: "pre-wrap",
              color: "#d0d7ff",
            }}
          >
            {current.description || "(waiting...)"}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <strong style={{ color: "#67C8FF" }}>Symbol Table:</strong>
          <ul>
            {[...current.symbolTable.entries()].map(([k, v]) => (
              <li key={k} style={{ color: "#a0c4ff" }}>
                {k} : {v}
              </li>
            ))}
          </ul>
        </div>

        <div style={{ marginBottom: 20 }}>
          <strong style={{ color: "#67C8FF" }}>Parse Tree:</strong>
          <div
            style={{
              maxHeight: 400,
              overflowY: "auto",
              border: "1px solid #4B6CB7",
              borderRadius: 8,
              padding: 10,
              fontSize: 14,
              backgroundColor: "#15203f",
              color: "#cbd5e1",
            }}
          >
            <RenderTree node={current.currentNode} />
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <strong style={{ color: "#67C8FF" }}>Semantic Errors:</strong>
          {semanticErrors.length === 0 ? (
            <div style={{ color: "#10B981" }}>No semantic errors detected.</div>
          ) : (
            <ul style={{ color: "#EF4444" }}>
              {semanticErrors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
          }}
        >
          <button
            onClick={() => setStep((s) => Math.max(s - 1, 0))}
            disabled={step === 0 || playing}
            style={{
              padding: "10px 20px",
              fontSize: 16,
              cursor: step === 0 || playing ? "not-allowed" : "pointer",
              backgroundColor: "#223366",
              color: "#8beee9",
              border: "none",
              borderRadius: 6,
              fontWeight: "bold",
              userSelect: "none",
              transition: "opacity 0.2s",
              opacity: step === 0 || playing ? 0.5 : 1,
            }}
          >
            ◀ Step Back
          </button>
          <button
            onClick={() => setPlaying(!playing)}
            style={{
              padding: "10px 20px",
              fontSize: 16,
              cursor: "pointer",
              backgroundColor: playing ? "#4B6CB7" : "white",
              color: playing ? "white" : "#4B6CB7",
              border: "1px solid #4B6CB7",
              borderRadius: 6,
              fontWeight: "bold",
              userSelect: "none",
              transition: "background-color 0.3s, color 0.3s",
            }}
          >
            {playing ? "Pause" : "Play"}
          </button>
          <button
            onClick={() =>
              setStep((s) => (s < parserHistory.length - 1 ? s + 1 : s))
            }
            disabled={step >= parserHistory.length - 1 || playing}
            style={{
              padding: "10px 20px",
              fontSize: 16,
              cursor:
                step >= parserHistory.length - 1 || playing
                  ? "not-allowed"
                  : "pointer",
              backgroundColor: "#223366",
              color: "#8beee9",
              border: "none",
              borderRadius: 6,
              fontWeight: "bold",
              userSelect: "none",
              transition: "opacity 0.2s",
              opacity: step >= parserHistory.length - 1 || playing ? 0.5 : 1,
            }}
          >
            Step Forward ▶
          </button>
        </div>
      </div>
    </div>
  );
}

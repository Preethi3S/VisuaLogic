// MultiLangVisualizer.jsx (animated, cyber grid)
import React, { useEffect, useRef, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ... Judge0 constants and code unchanged ...

const JUDGE0_HOST = "https://judge0-ce.p.rapidapi.com";
const JUDGE0_API_KEY = "06bda0c19bmsh569ecdfbf1a2a69p13a2e1jsn5adcc6bb0760";
const JUDGE0_API_HOST_HEADER = "judge0-ce.p.rapidapi.com";

const LANGS = [
  { id: 71, name: "Python (3.x)", key: "python" },
  { id: 62, name: "Java (OpenJDK)", key: "java" },
  { id: 50, name: "C (gcc)", key: "c" },
  { id: 54, name: "C++ (g++)", key: "cpp" },
];

const DEFAULT_CODE = {
  python: `# Python demo
sum = 0
for i in range(4):
    sum = sum + i
    print(sum)
`,
  java: `// Java demo
public class Main {
  public static void main(String[] args) {
    int sum = 0;
    for (int i = 0; i < 4; i = i + 1) {
      sum = sum + i;
      System.out.println(sum);
    }
  }
}
`,
  c: `// C demo
#include <stdio.h>
int main() {
  int sum = 0;
  for (int i = 0; i < 4; i = i + 1) {
    sum = sum + i;
    printf("%d\\n", sum);
  }
  return 0;
}
`,
  cpp: `// C++ demo
#include <iostream>
using namespace std;
int main() {
  int sum = 0;
  for (int i = 0; i < 4; i = i + 1) {
    sum = sum + i;
    cout << sum << endl;
  }
  return 0;
}
`,
};

function detectPrintLines(lines, langKey) {
  const printIdx = [];
  const patterns = {
    python: /\bprint\s*\(/,
    java: /\bSystem\.out\.println\s*\(/,
    c: /\bprintf\s*\(/,
    cpp: /\bcout\b|std::cout\b/,
  };
  const re = patterns[langKey] || /\bprint\s*\(/;
  lines.forEach((ln, idx) => {
    if (re.test(ln)) printIdx.push(idx);
  });
  return printIdx;
}

async function judge0CreateSubmission({ source_code, language_id, stdin = "" }) {
  const url = `${JUDGE0_HOST}/submissions?base64_encoded=false&wait=false`;
  const headers = { "Content-Type": "application/json" };
  if (JUDGE0_API_KEY) headers["X-RapidAPI-Key"] = JUDGE0_API_KEY;
  if (JUDGE0_API_HOST_HEADER) headers["X-RapidAPI-Host"] = JUDGE0_API_HOST_HEADER;
  const body = JSON.stringify({ source_code, language_id, stdin });
  const res = await fetch(url, { method: "POST", headers, body });
  if (!res.ok) throw new Error(`Judge0 create failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function judge0GetSubmission(token) {
  const url = `${JUDGE0_HOST}/submissions/${encodeURIComponent(token)}?base64_encoded=false`;
  const headers = {};
  if (JUDGE0_API_KEY) headers["X-RapidAPI-Key"] = JUDGE0_API_KEY;
  if (JUDGE0_API_HOST_HEADER) headers["X-RapidAPI-Host"] = JUDGE0_API_HOST_HEADER;
  const res = await fetch(url, { method: "GET", headers });
  if (!res.ok) throw new Error(`Judge0 poll failed: ${res.status} ${await res.text()}`);
  return res.json();
}

export default function CodeVisual() {
  const [langKey, setLangKey] = useState("python");
  const [code, setCode] = useState(DEFAULT_CODE.python);
  const [stdin, setStdin] = useState("");
  const [running, setRunning] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [stdout, setStdout] = useState("");
  const [stderr, setStderr] = useState("");
  const [token, setToken] = useState(null);
  const [lines, setLines] = useState([]);
  const [currentLine, setCurrentLine] = useState(null);
  const [simIndex, setSimIndex] = useState(0);
  const [simSpeed] = useState(600);
  const simRef = useRef(null);
  const printIndicesRef = useRef([]);
  const pendingOutputsRef = useRef([]);
  const [consoleLines, setConsoleLines] = useState([]);

  // --- Cyber grid background ---
  useEffect(() => {
    document.body.classList.add("bg-cyber-grid");
    document.body.classList.remove("animate-cyber-grid", "animate-cyber-grid-pulse");
    return () => {
      document.body.classList.remove("bg-cyber-grid");
    };
  }, []);

  useEffect(() => { setLines(code.split("\n")); }, [code]);

  useEffect(() => {
    setCode(DEFAULT_CODE[langKey]);
    setStdout("");
    setStderr("");
    setToken(null);
    setConsoleLines([]);
    setCurrentLine(null);
    setSimIndex(0);
  }, [langKey]);

  useEffect(() => () => { if (simRef.current) clearInterval(simRef.current); }, []);

  const nonEmptyIndicesMemo = useMemo(() => {
    return lines.map((ln, idx) => ({ ln: ln.trim(), idx }))
      .filter((x) => x.ln !== "").map((x) => x.idx);
  }, [lines]);

  const run = async () => {
    setRunning(true);
    setStatusText("Submitting to Judge0...");
    setStdout("");
    setStderr("");
    setToken(null);
    setConsoleLines([]);
    setCurrentLine(null);
    setSimIndex(0);

    const lang = LANGS.find((l) => l.key === langKey);
    if (!lang) return setStatusText("Invalid language chosen"), setRunning(false);

    try {
      const create = await judge0CreateSubmission({ source_code: code, language_id: lang.id, stdin });
      const subToken = create.token;
      setToken(subToken);
      setStatusText(`Submitted. Polling...`);

      let finished = false, result = null;
      while (!finished) {
        await new Promise((res) => setTimeout(res, 700));
        result = await judge0GetSubmission(subToken);
        const sid = result.status?.id || 0;
        setStatusText(result.status?.description || `Status ${sid}`);
        if (sid > 2) finished = true;
      }

      const out = result.stdout ?? "";
      const err = result.stderr ?? "";
      setStdout(out);
      setStderr(err);
      setStatusText(`Finished: ${result.status?.description || "Done"}`);

      const sourceLines = code.split("\n");
      const printIndices = detectPrintLines(sourceLines, langKey);
      printIndicesRef.current = printIndices;

      pendingOutputsRef.current = (out || "").split(/\r?\n/);

      beginSimulatedRun(sourceLines);
    } catch (e) {
      setStatusText(`Error: ${e.message}`);
      setStderr((s) => s + "\n" + String(e.message));
      setRunning(false);
    }
  };

  function beginSimulatedRun(sourceLines) {
    if (simRef.current) clearInterval(simRef.current);
    setLines(sourceLines);
    setSimIndex(0);
    setConsoleLines([]);
    setCurrentLine(null);

    const nonEmptyIndices = sourceLines.map((ln, idx) => ({ ln: ln.trim(), idx }))
      .filter((x) => x.ln !== "").map((x) => x.idx);

    if (!nonEmptyIndices.length) return setRunning(false);

    const speed = Math.max(120, simSpeed - Math.min(400, nonEmptyIndices.length * 10));
    let i = 0;

    simRef.current = setInterval(() => {
      if (i >= nonEmptyIndices.length) {
        clearInterval(simRef.current);
        setCurrentLine(null);
        setSimIndex(nonEmptyIndices.length - 1);
        setRunning(false);
        setStatusText((s) => s + " — Simulation complete");
        return;
      }
      const idx = nonEmptyIndices[i];
      setCurrentLine(idx);
      setSimIndex(i);

      if (printIndicesRef.current.includes(idx)) {
        const nextOut = pendingOutputsRef.current.shift();
        if (nextOut !== undefined) setConsoleLines((c) => [...c, String(nextOut)]);
      }
      i++;
    }, speed);
  }

  const pauseSim = () => { if (simRef.current) clearInterval(simRef.current); simRef.current = null; setRunning(false); setStatusText((s) => s + " — paused"); };

  const stepSim = () => {
    if (simRef.current) { clearInterval(simRef.current); simRef.current = null; }
    const nonEmptyIndices = lines.map((ln, idx) => ({ ln: ln.trim(), idx }))
      .filter((x) => x.ln !== "").map((x) => x.idx);
    const nextPos = Math.min(nonEmptyIndices.length - 1, simIndex + 1);
    const idx = nonEmptyIndices[nextPos];
    setCurrentLine(idx);
    setSimIndex(nextPos);
    if (printIndicesRef.current.includes(idx)) {
      const nextOut = pendingOutputsRef.current.shift();
      if (nextOut !== undefined) setConsoleLines((c) => [...c, String(nextOut)]);
    }
  };

  const resetSim = () => {
    if (simRef.current) clearInterval(simRef.current);
    simRef.current = null;
    setRunning(false);
    setStatusText("Reset");
    setStdout("");
    setStderr("");
    setToken(null);
    setConsoleLines([]);
    setCurrentLine(null);
    setSimIndex(0);
    pendingOutputsRef.current = [];
    printIndicesRef.current = [];
  };

  const progress = useMemo(() => {
    const total = nonEmptyIndicesMemo.length || 1;
    return Math.min(1, (simIndex) / (total - 1 || 1));
  }, [simIndex, nonEmptyIndicesMemo]);

  return (
    <div className="relative min-h-screen w-full font-sans">
      {/* Static Cyber Grid */}
      <div className="absolute inset-0 bg-cyber-grid bg-fixed z-0" />
      <div className="relative z-10" style={{ fontFamily: "Inter, sans-serif", padding: 28, maxWidth: 1400, margin: "0 auto" }}>
        <h3 style={{
          margin: 0,
          background: "linear-gradient(90deg, #4B6CB7, #67C8FF)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          fontWeight: 800
        }}>
          Multi-language Code Runner & Visual Flow (Judge0)
        </h3>
        <p style={{ color: "#374151", marginTop: 6 }}>Run code in multiple languages on Judge0, with simulated execution playback.</p>
        <div style={{ display: "flex", gap: 18, marginTop: 16, alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <label>
                Language
                <select value={langKey} onChange={e => setLangKey(e.target.value)} style={{ marginLeft: 8 }}>
                  {LANGS.map(l => <option key={l.key} value={l.key}>{l.name}</option>)}
                </select>
              </label>
              <label style={{ marginLeft: 12 }}>
                Input
                <input value={stdin} onChange={e => setStdin(e.target.value)} style={{ marginLeft: 8 }} />
              </label>
              <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} onClick={run} disabled={running} style={{ ...buttonStyle, opacity: running ? 0.7 : 1 }}>
                  {running ? "Running..." : "Run"}
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={pauseSim} style={buttonStyleSecondary}>Pause</motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={stepSim} style={buttonStyleSecondary}>Step</motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={resetSim} style={buttonStyleSecondary}>Reset</motion.button>
              </div>
            </div>
            <textarea value={code} onChange={e => setCode(e.target.value)} style={{
              width: "100%", marginTop: 12, height: 300, fontFamily: "monospace",
              fontSize: 13, padding: 10, borderRadius: 8, border: "1px solid #ddd"
            }} />
          </div>
          <div style={{ width: 440, display: "flex", flexDirection: "column", gap: 15 }}>
            <motion.div animate={running ? { boxShadow: "0 20px 50px rgba(75,108,183,0.13)" } : {}} transition={{ duration: 0.35 }} style={cardStyle}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <strong>Status</strong>
                  <div style={{ marginTop: 8, color: "#4b5563" }}>{statusText || "Idle"}</div>
                  <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>
                    Token: {token ?? "—"} | Output lines: {stdout ? stdout.split(/\r?\n/).length : 0}
                  </div>
                </div>
                <motion.div animate={running ? { scale: [1, 1.08, 1] } : {}} transition={{ repeat: running ? Infinity : 0, duration: 1.2 }} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 99, background: running ? "#10B981" : "#9ca3af" }} />
                  <div style={{ fontSize: 12, color: "#374151" }}>{running ? "Executing" : "Idle"}</div>
                </motion.div>
              </div>
              <div style={{ marginTop: 10 }}>
                <div style={{ height: 8, background: "#eef2ff", borderRadius: 8, overflow: "hidden" }}>
                  <motion.div style={{ height: 8, borderRadius: 8, background: "linear-gradient(90deg,#4B6CB7,#67C8FF)" }} animate={{ width: `${Math.round(progress * 100)}%` }} transition={{ duration: 0.35 }} />
                </div>
              </div>
            </motion.div>
            <div style={cardStyle}>
              <strong>Visualizer</strong>
              <div style={{ marginTop: 8, maxHeight: 260, overflowY: "auto", borderRadius: 6, padding: 8, background: "#f8fafc" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {lines.map((ln, idx) => {
                    const isCurrent = idx === currentLine;
                    const opacity = isCurrent ? 1 : 0.9;
                    return (
                      <motion.div key={idx} initial={{ opacity: 0, y: 6 }} animate={{ opacity, y: isCurrent ? 0 : 2 }} transition={{ duration: 0.18 }} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "6px 8px", borderRadius: 7, position: "relative", background: isCurrent ? "rgba(60,180,255,0.16)" : "transparent" }}>
                        <div style={{ width: 36, textAlign: "right", color: "#9ca3af", fontFamily: "monospace", userSelect: "none" }}>{String(idx + 1).padStart(2, " ")}</div>
                        {/* Execution indicator dot (animated) */}
                        <motion.div layoutId={isCurrent ? `exec-${idx}` : undefined} animate={{ scale: isCurrent ? 1 : 0.7, opacity: isCurrent ? 1 : 0.35 }} transition={{ duration: 0.18 }} style={{ width: 8, minWidth: 8, height: 8, borderRadius: 99, background: isCurrent ? "#4B6CB7" : "transparent", border: isCurrent ? "none" : "2px solid #e6eefc" }} />
                        <pre style={{ margin: 0, fontFamily: "monospace", whiteSpace: "pre-wrap", flex: 1 }}>{ln}</pre>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div style={cardStyle}>
              <strong>Console</strong>
              <div style={{ marginTop: 8, minHeight: 80, background: "#ffffff", padding: 10, borderRadius: 6 }}>
                <div style={{ fontSize: 13, color: "#111827", fontFamily: "monospace" }}>
                  <AnimatePresence>
                    {consoleLines.length === 0
                      ? <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ color: "#9ca3af" }}>No output yet...</motion.div>
                      : consoleLines.map((l, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.08 }}>
                          » {l}
                        </motion.div>
                      ))}
                  </AnimatePresence>
                </div>
              </div>
              <div style={{ marginTop: 8 }}>
                <strong>Raw stdout</strong>
                <pre style={{ background: "#071", color: "#fff", padding: 8, borderRadius: 6, whiteSpace: "pre-wrap", fontFamily: "monospace", maxHeight: 120, overflowY: "auto" }}>{stdout || "—"}</pre>
                <strong style={{ marginTop: 6 }}>Raw stderr</strong>
                <pre style={{ background: "#fff0f0", color: "#991b1b", padding: 8, borderRadius: 6, whiteSpace: "pre-wrap", fontFamily: "monospace", maxHeight: 120, overflowY: "auto" }}>{stderr || "—"}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Styles */
const cardStyle = {
  background: "rgba(255,255,255,0.94)",
  backdropFilter: "blur(9px)",
  borderRadius: 14,
  padding: 18,
  boxShadow: "0 10px 24px rgba(103,200,255,0.10)",
  transition: "transform 0.25s ease, box-shadow 0.25s ease"
};

const buttonStyle = {
  background: "linear-gradient(90deg, #4B6CB7, #67C8FF)",
  color: "white",
  padding: "8px 15px",
  border: "none",
  borderRadius: 9,
  cursor: "pointer",
  fontWeight: "600",
  fontSize: 15,
  transition: "transform 0.18s, box-shadow 0.18s"
};

const buttonStyleSecondary = {
  background: "#eef2ff",
  color: "#111827",
  padding: "8px 15px",
  border: "none",
  borderRadius: 9,
  cursor: "pointer",
  fontWeight: "500",
  fontSize: 15,
  transition: "transform 0.18s, background 0.18s"
};

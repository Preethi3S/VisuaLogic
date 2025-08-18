import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

/**
 * RedBlackTreeVisualizer.jsx — Cyber Grid Theme
 * Red-Black Tree visualizer: insert/delete/update + animations & step-by-step.
 * Full-page cyber grid theme.
 */

const RED = "#e11d48";
const BLACK = "#0f172a";
const NODE_RADIUS = 24;
const VERTICAL_GAP = 90;
const HORIZONTAL_GAP = 32;
const MIN_CANVAS_WIDTH = 700;

let GLOBAL_UID = 1;
function uid() {
  return `rb-${Date.now()}-${GLOBAL_UID++}`;
}

class RBNode {
  constructor(value, color = "RED") {
    this.value = value;
    this.color = color; // "RED" | "BLACK"
    this.left = null;
    this.right = null;
    this.parent = null;
    this.id = uid();
    // layout coords for visualization
    this.x = 0;
    this.y = 0;
    this.visible = true;
  }
}

// clone tree and preserve ids/visibility
function cloneTree(node) {
  if (!node) return null;
  const n = new RBNode(node.value, node.color);
  n.id = node.id;
  n.visible = node.visible ?? true;
  n.left = cloneTree(node.left);
  n.right = cloneTree(node.right);
  if (n.left) n.left.parent = n;
  if (n.right) n.right.parent = n;
  n.x = node.x;
  n.y = node.y;
  return n;
}

// inorder traversal to list keys
function inorderValues(node, out = []) {
  if (!node) return out;
  inorderValues(node.left, out);
  out.push(node.value);
  inorderValues(node.right, out);
  return out;
}

// layout for draw
function layoutTree(root) {
  let order = 0;
  function dfs(n, depth) {
    if (!n) return;
    dfs(n.left, depth + 1);
    n.x = order * (NODE_RADIUS * 2 + HORIZONTAL_GAP) + NODE_RADIUS + 32;
    n.y = depth * VERTICAL_GAP + NODE_RADIUS + 20;
    order++;
    dfs(n.right, depth + 1);
  }
  dfs(root, 0);
  const width = Math.max(MIN_CANVAS_WIDTH, order * (NODE_RADIUS * 2 + HORIZONTAL_GAP) + 80);
  return width;
}

// Recorder
class Recorder {
  constructor() {
    this.steps = [];
  }
  push(rootSnapshot, highlight = [], explanation = "") {
    const snap = rootSnapshot ? cloneTree(rootSnapshot) : null;
    if (snap) layoutTree(snap);
    this.steps.push({ snapshot: snap, highlight: Array.isArray(highlight) ? highlight.slice() : [highlight], explanation });
  }
  getSteps() {
    return this.steps.slice();
  }
}

// Rotations
function rotateLeft(x) {
  const y = x.right;
  if (!y) return x;
  const beta = y.left;
  y.left = x;
  x.right = beta;
  if (beta) beta.parent = x;
  return y;
}
function rotateRight(y) {
  const x = y.left;
  if (!x) return y;
  const beta = x.right;
  x.right = y;
  y.left = beta;
  if (beta) beta.parent = y;
  return x;
}

function recordInsert(snapRoot, value) {
  const recorder = new Recorder();

  if (!snapRoot) {
    const n = new RBNode(value, "BLACK");
    recorder.push(n, [n.id], `Inserted ${value} as root (black).`);
    return recorder;
  }

  // BST insert (new node red)
  let cur = snapRoot;
  let parent = null;
  while (cur) {
    parent = cur;
    if (value < cur.value) cur = cur.left;
    else if (value > cur.value) cur = cur.right;
    else {
      recorder.push(snapRoot, [parent.id], `Value ${value} already exists — no insertion.`);
      return recorder;
    }
  }
  const newNode = new RBNode(value, "RED");
  newNode.parent = parent;
  if (value < parent.value) parent.left = newNode;
  else parent.right = newNode;
  recorder.push(snapRoot, [newNode.id], `Inserted ${value} as red leaf.`);

  // Fixup
  let z = newNode;
  while (z.parent && z.parent.color === "RED") {
    const p = z.parent;
    const gp = p.parent;
    if (!gp) break;
    if (p === gp.left) {
      const y = gp.right;
      if (y && y.color === "RED") {
        p.color = "BLACK";
        y.color = "BLACK";
        gp.color = "RED";
        recorder.push(snapRoot, [p.id, y.id, gp.id], `Recolor: parent ${p.value} black, uncle ${y.value} black, grandparent ${gp.value} red.`);
        z = gp;
        continue;
      } else {
        if (z === p.right) {
          recorder.push(snapRoot, [p.id, z.id], `Left-rotate at ${p.value} (LR preparation).`);
          const newPSub = rotateLeft(p);
          if (!gp) {
            snapRoot = newPSub;
            newPSub.parent = null;
          } else {
            if (gp.left && gp.left.id === p.id) gp.left = newPSub;
            else gp.right = newPSub;
            newPSub.parent = gp;
          }
          recorder.push(snapRoot, [newPSub.id], `Rotation complete.`);
          z = newPSub.left;
        }
        recorder.push(snapRoot, [gp.id, p.id], `Right-rotate at ${gp.value} to fix LL case.`);
        const newGpSub = rotateRight(gp);
        const gpp = gp.parent;
        if (!gpp) {
          snapRoot = newGpSub;
          newGpSub.parent = null;
        } else {
          if (gpp.left && gpp.left.id === gp.id) gpp.left = newGpSub;
          else gpp.right = newGpSub;
          newGpSub.parent = gpp;
        }
        newGpSub.color = "BLACK";
        if (newGpSub.left) newGpSub.left.color = "RED";
        if (newGpSub.right) newGpSub.right.color = "RED";
        recorder.push(snapRoot, [newGpSub.id], `Rotation + recolor: ${newGpSub.value} black, children red.`);
        break;
      }
    } else {
      const y = gp.left;
      if (y && y.color === "RED") {
        p.color = "BLACK";
        y.color = "BLACK";
        gp.color = "RED";
        recorder.push(snapRoot, [p.id, y.id, gp.id], `Recolor: parent ${p.value} black, uncle ${y.value} black, grandparent ${gp.value} red.`);
        z = gp;
        continue;
      } else {
        if (z === p.left) {
          recorder.push(snapRoot, [p.id, z.id], `Right-rotate at ${p.value} (RL preparation).`);
          const newPSub = rotateRight(p);
          if (!gp) {
            snapRoot = newPSub;
            newPSub.parent = null;
          } else {
            if (gp.left && gp.left.id === p.id) gp.left = newPSub;
            else gp.right = newPSub;
            newPSub.parent = gp;
          }
          recorder.push(snapRoot, [newPSub.id], `Rotation complete.`);
          z = newPSub.right;
        }
        recorder.push(snapRoot, [gp.id, p.id], `Left-rotate at ${gp.value} to fix RR case.`);
        const newGpSub = rotateLeft(gp);
        const gpp = gp.parent;
        if (!gpp) {
          snapRoot = newGpSub;
          newGpSub.parent = null;
        } else {
          if (gpp.left && gpp.left.id === gp.id) gpp.left = newGpSub;
          else gpp.right = newGpSub;
          newGpSub.parent = gpp;
        }
        newGpSub.color = "BLACK";
        if (newGpSub.left) newGpSub.left.color = "RED";
        if (newGpSub.right) newGpSub.right.color = "RED";
        recorder.push(snapRoot, [newGpSub.id], `Rotation + recolor: ${newGpSub.value} black, children red.`);
        break;
      }
    }
  }

  // ensure root black
  if (snapRoot) {
    let r = snapRoot;
    while (r.parent) r = r.parent;
    r.color = "BLACK";
    recorder.push(r, [r.id], `Ensure root ${r.value} is black.`);
    snapRoot = r;
  }
  recorder.push(snapRoot, [], `Insertion of ${value} complete.`);
  return recorder;
}

// Helper: actual insert executed directly (no recorder): used by rebuild
function actualInsertNoRecord(root, value) {
  if (!root) {
    const n = new RBNode(value, "BLACK");
    return n;
  }
  let cur = root;
  let parent = null;
  while (cur) {
    parent = cur;
    if (value < cur.value) cur = cur.left;
    else cur = cur.right;
  }
  const z = new RBNode(value, "RED");
  z.parent = parent;
  if (value < parent.value) parent.left = z;
  else parent.right = z;

  // fixup as in recordInsert
  let node = z;
  while (node.parent && node.parent.color === "RED") {
    let p = node.parent;
    const gp = p.parent;
    if (!gp) break;
    if (p === gp.left) {
      const y = gp.right;
      if (y && y.color === "RED") {
        p.color = "BLACK";
        y.color = "BLACK";
        gp.color = "RED";
        node = gp;
      } else {
        if (node === p.right) {
          const newP = rotateLeft(p);
          if (!gp) {
            root = newP;
            newP.parent = null;
          } else {
            if (gp.left && gp.left.id === p.id) gp.left = newP;
            else gp.right = newP;
            newP.parent = gp;
          }
          node = newP.left;
        }
        const newGp = rotateRight(gp);
        const gpp = gp.parent;
        if (!gpp) {
          root = newGp;
          newGp.parent = null;
        } else {
          if (gpp.left && gpp.left.id === gp.id) gpp.left = newGp;
          else gpp.right = newGp;
          newGp.parent = gpp;
        }
        newGp.color = "BLACK";
        if (newGp.left) newGp.left.color = "RED";
        if (newGp.right) newGp.right.color = "RED";
        break;
      }
    } else {
      const y = gp.left;
      if (y && y.color === "RED") {
        p.color = "BLACK";
        y.color = "BLACK";
        gp.color = "RED";
        node = gp;
      } else {
        if (node === p.left) {
          const newP = rotateRight(p);
          if (!gp) {
            root = newP;
            newP.parent = null;
          } else {
            if (gp.left && gp.left.id === p.id) gp.left = newP;
            else gp.right = newP;
            newP.parent = gp;
          }
          node = newP.right;
        }
        const newGp = rotateLeft(gp);
        const gpp = gp.parent;
        if (!gpp) {
          root = newGp;
          newGp.parent = null;
        } else {
          if (gpp.left && gpp.left.id === gp.id) gpp.left = newGp;
          else gpp.right = newGp;
          newGp.parent = gpp;
        }
        newGp.color = "BLACK";
        if (newGp.left) newGp.left.color = "RED";
        if (newGp.right) newGp.right.color = "RED";
        break;
      }
    }
  }
  let r = root;
  while (r.parent) r = r.parent;
  r.color = "BLACK";
  return r;
}

// "Delete" is done by removing and rebuilding for animation clarity
function recordBuildFromArray(values) {
  const recorder = new Recorder();
  let curRoot = null;
  recorder.push(curRoot, [], `Start building with ${values.length} values.`);
  for (const v of values) {
    const rec = recordInsert(curRoot, v);
    const recSteps = rec.getSteps();
    for (const s of recSteps) {
      recorder.push(s.snapshot, s.highlight, s.explanation);
    }
    const lastSnap = recSteps.length ? recSteps[recSteps.length - 1].snapshot : curRoot;
    curRoot = lastSnap ? cloneTree(lastSnap) : null;
  }
  recorder.push(curRoot, [], `Build complete.`);
  return recorder;
}

async function playSteps(steps, speed, controllerRef, applySnapshot) {
  controllerRef.current.playing = true;
  controllerRef.current.stop = false;
  for (let i = 0; i < steps.length; i++) {
    if (controllerRef.current.stop) break;
    applySnapshot(steps[i], i);
    await new Promise((r) => setTimeout(r, speed));
  }
  controllerRef.current.playing = false;
  controllerRef.current.stop = false;
}

/* ----------- Cyber Grid Buttons ---------- */
const btnPrimary = {
  padding: "10px 16px",
  borderRadius: 10,
  border: "none",
  background: "linear-gradient(90deg,#8beee9,#4B6CB7)",
  color: "#fff",
  fontWeight: 900,
  fontSize: 16,
  cursor: "pointer",
  boxShadow: "0 0 13px #67C8FF99",
  marginRight: 6,
};
const btnAlt = {
  ...btnPrimary,
  background: "linear-gradient(90deg,#64748b,#94a3b8)",
  color: "#fff",
  boxShadow: "0 0 7px #64748b99",
  marginRight: 6,
};
const btnWarn = {
  ...btnPrimary,
  background: "linear-gradient(90deg,#ef4444,#f97316)",
  color: "#fff",
  boxShadow: "0 0 9px #ef4444aa",
  marginRight: 6,
};

export default function RedBlackTreeVisualizer() {
  const [root, setRoot] = useState(() => {
    const start = new RBNode(20, "BLACK");
    const n1 = new RBNode(10, "RED");
    const n2 = new RBNode(30, "RED");
    start.left = n1;
    start.right = n2;
    n1.parent = start;
    n2.parent = start;
    layoutTree(start);
    return cloneTree(start);
  });

  const [steps, setSteps] = useState([]);
  const [stepIndex, setStepIndex] = useState(-1);
  const [explanation, setExplanation] = useState("Ready — insert values or use example.");
  const [input, setInput] = useState("");
  const [speed, setSpeed] = useState(600);
  const controllerRef = useRef({ playing: false, stop: false });
  const [canvasWidth, setCanvasWidth] = useState(900);
  const containerRef = useRef(null);
  const [lastOpNote, setLastOpNote] = useState("");

  useEffect(() => {
    if (!root) {
      setCanvasWidth(MIN_CANVAS_WIDTH);
      return;
    }
    const w = layoutTree(root);
    setCanvasWidth(w);
  }, [root]);

  function applyStep(stepObj, idx) {
    const snap = stepObj.snapshot ? cloneTree(stepObj.snapshot) : null;
    setRoot(snap);
    setStepIndex(idx);
    setExplanation(stepObj.explanation || "");
    requestAnimationFrame(() => {
      if (containerRef.current) {
        const el = containerRef.current;
        el.scrollLeft = Math.max(0, (canvasWidth - el.clientWidth) / 2);
      }
    });
    setLastOpNote(`Step ${idx + 1}/${steps.length}`);
  }

  async function handleBuildAnimate() {
    if (controllerRef.current.playing) return;
    const vals = input
      .split(/[\s,]+/)
      .map((s) => Number(s.trim()))
      .filter((n) => !Number.isNaN(n));
    if (vals.length === 0) {
      setExplanation("Enter numbers separated by space/comma to build.");
      return;
    }
    const rec = recordBuildFromArray(vals);
    const s = rec.getSteps();
    setSteps(s);
    setStepIndex(-1);
    controllerRef.current.stop = false;
    await playSteps(s, speed, controllerRef, applyStep);
    if (s.length) {
      const last = s[s.length - 1];
      const snap = last.snapshot ? cloneTree(last.snapshot) : null;
      setRoot(snap);
      setExplanation("Build finished.");
    }
  }

  function handleBuildInstant() {
    const vals = input
      .split(/[\s,]+/)
      .map((s) => Number(s.trim()))
      .filter((n) => !Number.isNaN(n));
    if (vals.length === 0) {
      setExplanation("Enter numbers separated by space/comma to build.");
      return;
    }
    let cur = null;
    for (const v of vals) cur = actualInsertNoRecord(cur, v);
    if (cur) {
      layoutTree(cur);
      setRoot(cloneTree(cur));
      setExplanation("Loaded tree (instant).");
    } else {
      setRoot(null);
      setExplanation("Loaded empty tree.");
    }
    setSteps([]);
    setStepIndex(-1);
  }

  async function handleInsert() {
    if (controllerRef.current.playing) return;
    const v = Number(input);
    if (Number.isNaN(v)) {
      setExplanation("Enter a single integer to insert (in the input field).");
      return;
    }
    const workingRoot = root ? cloneTree(root) : null;
    const rec = recordInsert(workingRoot, v);
    const s = rec.getSteps();
    setSteps(s);
    setStepIndex(-1);
    controllerRef.current.stop = false;
    await playSteps(s, speed, controllerRef, applyStep);
    if (s.length) {
      const last = s[s.length - 1];
      setRoot(last.snapshot ? cloneTree(last.snapshot) : null);
      setExplanation(`Insert ${v} completed.`);
    }
  }

  async function handleDelete() {
    if (controllerRef.current.playing) return;
    const v = Number(input);
    if (Number.isNaN(v)) {
      setExplanation("Enter the integer to delete (in the input field).");
      return;
    }
    if (!root) {
      setExplanation("Tree is empty.");
      return;
    }
    const existing = inorderValues(root);
    if (!existing.includes(v)) {
      setExplanation(`${v} not found in the tree.`);
      return;
    }
    const recorder = new Recorder();
    recorder.push(root, [], `Removing ${v} and rebuilding to keep RB properties (visual simplification).`);
    const remaining = existing.filter((x) => x !== v);
    recorder.push(root, [], `Removed ${v} logically.`);
    let cur = null;
    for (const key of remaining) {
      const recIns = recordInsert(cur, key);
      const stepsIns = recIns.getSteps();
      for (const s of stepsIns) recorder.push(s.snapshot, s.highlight, s.explanation);
      const finalSnap = stepsIns.length ? stepsIns[stepsIns.length - 1].snapshot : cur;
      cur = finalSnap ? cloneTree(finalSnap) : null;
    }
    recorder.push(cur, [], `Rebuild complete after deleting ${v}.`);
    const s = recorder.getSteps();
    setSteps(s);
    setStepIndex(-1);
    controllerRef.current.stop = false;
    await playSteps(s, speed, controllerRef, applyStep);
    const last = s[s.length - 1];
    setRoot(last.snapshot ? cloneTree(last.snapshot) : null);
    setExplanation(`Delete ${v} visualized (rebuild).`);
  }

  async function handleUpdate() {
    if (controllerRef.current.playing) return;
    const parts = input.split(/[\s,]+/).map((s) => Number(s.trim())).filter((n) => !Number.isNaN(n));
    if (parts.length < 2) {
      setExplanation("Enter two numbers: oldValue newValue (in the input field).");
      return;
    }
    const [oldV, newV] = parts;
    setExplanation(`Update: delete ${oldV} then insert ${newV} (visualized).`);
    const existing = root ? inorderValues(root) : [];
    if (!existing.includes(oldV)) {
      setExplanation(`${oldV} not found.`);
      return;
    }
    await handleDelete();
    setInput(String(newV));
    await handleInsert();
    setExplanation(`Update ${oldV} → ${newV} completed.`);
  }

  function play() {
    if (controllerRef.current.playing) return;
    if (!steps || steps.length === 0) {
      setExplanation("No recorded steps. Perform an operation (insert/build/delete) first.");
      return;
    }
    controllerRef.current.stop = false;
    playSteps(steps, speed, controllerRef, applyStep);
  }
  function pause() {
    controllerRef.current.stop = true;
  }
  function nextStep() {
    if (!steps || steps.length === 0) return;
    const idx = Math.min(steps.length - 1, stepIndex + 1);
    applyStep(steps[idx], idx);
  }
  function prevStep() {
    if (!steps || steps.length === 0) return;
    const idx = Math.max(0, stepIndex - 1);
    applyStep(steps[idx], idx);
  }
  function stopPlayback() {
    controllerRef.current.stop = true;
    controllerRef.current.playing = false;
    setSteps([]);
    setStepIndex(-1);
    setExplanation("Stopped.");
  }

  function renderEdges(node) {
    if (!node) return null;
    const els = [];
    if (node.left) {
      els.push(
        <line
          key={`${node.id}-L`}
          x1={node.x}
          y1={node.y + NODE_RADIUS}
          x2={node.left.x}
          y2={node.left.y - NODE_RADIUS}
          stroke="#67C8FF"
          strokeWidth="3"
        />
      );
      els.push(...renderEdges(node.left));
    }
    if (node.right) {
      els.push(
        <line
          key={`${node.id}-R`}
          x1={node.x}
          y1={node.y + NODE_RADIUS}
          x2={node.right.x}
          y2={node.right.y - NODE_RADIUS}
          stroke="#67C8FF"
          strokeWidth="3"
        />
      );
      els.push(...renderEdges(node.right));
    }
    return els;
  }

  function renderNodes(node) {
    if (!node) return null;
    const els = [];
    const fill = node.color === "RED" ? RED : BLACK;
    const textColor = node.color === "RED" ? "#E0E7FF" : "#A7FFED";
    els.push(
      <motion.g
        key={node.id}
        initial={{ x: node.x, y: node.y, opacity: 1, scale: 0.93 }}
        animate={{ x: node.x, y: node.y, opacity: node.visible === false ? 0 : 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <circle cx={0} cy={0} r={NODE_RADIUS} fill={fill} stroke="#67C8FF" strokeWidth="3" />
        <text x={0} y={6} textAnchor="middle" fontSize="15" fontWeight="800" fill={textColor}>
          {node.value}
        </text>
      </motion.g>
    );
    if (node.left) els.push(...renderNodes(node.left));
    if (node.right) els.push(...renderNodes(node.right));
    return els;
  }

  const currentValues = root ? inorderValues(root) : [];

  return (
    <div
      className="bg-cyber-grid animate-cyber-grid animate-cyber-grid-pulse"
      style={{
        minHeight: "100vh",
        width: "100vw",
        padding: 0,
        margin: 0,
        boxSizing: "border-box",
        fontFamily: "Segoe UI, Roboto, system-ui, -apple-system, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          maxWidth: 1220,
          margin: "42px auto",
          padding: "32px 32px",
          borderRadius: 24,
          background: "rgba(12,17,35,0.96)",
          boxShadow: "0 0 40px #67C8FF44",
          color: "#E0E7FF",
          width: "calc(100vw - 40px)",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            marginBottom: 12,
            background: "linear-gradient(90deg,#8beee9 15%,#4B6CB7 85%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontWeight: 900,
            fontSize: 29,
            letterSpacing: 1,
          }}
        >
          Red-Black Tree — Visualizer (Cyber Grid Theme)
        </h2>

        <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "center", flexWrap: "wrap", marginBottom: 16 }}>
          <input
            placeholder="Input: single value (insert/delete) or 'old new' for update or list to build"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{
              minWidth: 430,
              padding: "10px 14px",
              borderRadius: 8,
              border: "1.5px solid #4B6CB7",
              background: "#15203f",
              color: "#E0E7FF",
              fontFamily: "monospace",
              fontSize: 17,
              outlineColor: "#67C8FF",
              marginRight: 6,
            }}
          />
          <button onClick={handleInsert} style={btnPrimary}>Insert</button>
          <button onClick={handleDelete} style={btnWarn}>Delete (rebuild)</button>
          <button onClick={handleUpdate} style={btnPrimary}>Update (old new)</button>
          <button onClick={handleBuildAnimate} style={btnPrimary}>Build (animate list)</button>
          <button onClick={handleBuildInstant} style={btnAlt}>Load (instant)</button>
        </div>

        <div style={{ display: "flex", gap: 14, alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ fontWeight: 700 }}>{explanation}</div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <label style={{ fontWeight: 700, color: "#67C8FF" }}>Speed</label>
            <input type="range" min="80" max="1400" step="20" value={speed} onChange={(e) => setSpeed(Number(e.target.value))} />
            <div style={{ minWidth: 68, textAlign: "right", fontWeight: 900, color: "#67C8FF" }}>{speed} ms</div>
            <button onClick={play} style={btnPrimary}>Play</button>
            <button onClick={pause} style={btnAlt}>Pause</button>
            <button onClick={prevStep} style={btnAlt}>Prev</button>
            <button onClick={nextStep} style={btnAlt}>Next</button>
            <button onClick={stopPlayback} style={btnWarn}>Stop</button>
          </div>
        </div>

        <div ref={containerRef} style={{ overflowX: "auto", padding: 12, background: "#0b1220", borderRadius: 10, border: "2px solid #67C8FF22" }}>
          <svg width={canvasWidth} height={425} style={{ background: "#0A0F1F", borderRadius: 9 }}>
            {root && renderEdges(root)}
            <g transform="translate(0,0)">{root && renderNodes(root)}</g>
          </svg>
        </div>

        <div style={{ display: "flex", gap: 20, marginTop: 18, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ minWidth: 330 }}>
            <div style={{ fontWeight: 800, marginBottom: 8, color: "#67C8FF" }}>In-order keys</div>
            <div style={{ background: "#15203f", padding: 13, borderRadius: 10, border: "1.5px solid #67C8FF", color: "#E0E7FF", letterSpacing: 1 }}>
              {`[ ${currentValues.join(", ")} ]`}
            </div>
            <div style={{ color: "#7dd3fc", marginTop: 12, fontSize: 14, fontStyle: "italic" }}>
              Note: Delete is visualized by removing the key and rebuilding the tree by reinserting the remaining keys.<br />
              This keeps animations clear and ensures the result is a valid Red-Black Tree.
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 900, color: "#67C8FF" }}>Definition</div>
            <div style={{ marginTop: 6, color: "#B0CBF7" }}>
              A Red-Black Tree is a self-balancing BST with these invariants: root is black, red nodes have black children, and every path from a node to null has the same number of black nodes. Insert uses recoloring and rotations to restore invariants.
            </div>
            <pre style={{ marginTop: 12, background: "#0b1220", color: "#E0E7FF", padding: 13, borderRadius: 8 }}>
{`# Insert (conceptual)
insert(node):
  BST insert new node colored RED
  while parent is RED:
    if uncle RED: recolor parent & uncle -> BLACK, grandparent -> RED, move up
    else if triangle case: rotate at parent
    else: rotate at grandparent and recolor
  root -> BLACK
`}
            </pre>
            <div style={{ marginTop: 12, color: "#FBBF24", fontWeight: 800 }}>{lastOpNote}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

/*
AVLVisualizer.jsx
Cyber grid theme applied for full background.
*/
const NODE_R = 22;
const V_GAP = 90;
const H_GAP = 36;
let UID = 1;
function nextId() {
  return `avl-${Date.now()}-${UID++}`;
}
/* Tree node */
class Node {
  constructor(val) {
    this.val = val;
    this.left = null;
    this.right = null;
    this.height = 1;
    this.id = nextId();
    this.x = 0;
    this.y = 0;
    this.visible = true;
  }
}
/* Helpers */
const height = (n) => (n ? n.height : 0);
const updateHeight = (n) => {
  if (!n) return 0;
  n.height = 1 + Math.max(height(n.left), height(n.right));
  return n.height;
};
const balanceFactor = (n) => (n ? height(n.left) - height(n.right) : 0);
/* rotate right */
function rotateRight(y) {
  const x = y.left;
  const T2 = x.right;
  x.right = y;
  y.left = T2;
  updateHeight(y);
  updateHeight(x);
  return x;
}
/* rotate left */
function rotateLeft(x) {
  const y = x.right;
  const T2 = y.left;
  y.left = x;
  x.right = T2;
  updateHeight(x);
  updateHeight(y);
  return y;
}
/* clone tree but preserve ids and visible flags (for motion stability) */
function clonePreserve(node) {
  if (!node) return null;
  const n = new Node(node.val);
  n.id = node.id;
  n.visible = node.visible ?? true;
  n.height = node.height;
  n.left = clonePreserve(node.left);
  n.right = clonePreserve(node.right);
  n.x = node.x;
  n.y = node.y;
  return n;
}
/* layout using inorder spacing */
function layout(root) {
  let order = 0;
  function dfs(n, depth) {
    if (!n) return;
    dfs(n.left, depth + 1);
    n.x = order * (NODE_R * 2 + H_GAP) + NODE_R + 16;
    n.y = depth * V_GAP + NODE_R + 14;
    order++;
    dfs(n.right, depth + 1);
  }
  dfs(root, 0);
  const width = Math.max(700, order * (NODE_R * 2 + H_GAP) + 80);
  return width;
}
/* Recorder: collects snapshots {rootClone, highlightIds, explanation} */
function Recorder() {
  this.steps = [];
}
Recorder.prototype.push = function (root, highlight = [], explanation = "") {
  this.steps.push({
    snapshot: clonePreserve(root),
    highlight: Array.isArray(highlight) ? highlight.slice() : [highlight],
    explanation,
  });
};
Recorder.prototype.get = function () {
  return this.steps.slice();
};
/* AVL insert that records steps into recorder */
function avlInsertRec(node, val, recorder) {
  if (!node) {
    const newNode = new Node(val);
    recorder.push(newNode, [newNode.id], `Insert ${val} as leaf`);
    return newNode;
  }
  recorder.push(clonePreserve(node), [node.id], `At node ${node.val}: compare ${val} with ${node.val}`);
  if (val < node.val) {
    node.left = avlInsertRec(node.left, val, recorder);
  } else if (val > node.val) {
    node.right = avlInsertRec(node.right, val, recorder);
  } else {
    recorder.push(clonePreserve(node), [node.id], `Value ${val} already exists — no insert`);
    return node;
  }
  updateHeight(node);
  const bf = balanceFactor(node);
  if (bf > 1 && val < node.left.val) {
    recorder.push(clonePreserve(node), [node.id, node.left.id], `LL case at ${node.val} — rotate right`);
    const res = rotateRight(node);
    recorder.push(clonePreserve(res), [res.id], `After right rotation at ${node.val}`);
    return res;
  }
  if (bf < -1 && val > node.right.val) {
    recorder.push(clonePreserve(node), [node.id, node.right.id], `RR case at ${node.val} — rotate left`);
    const res = rotateLeft(node);
    recorder.push(clonePreserve(res), [res.id], `After left rotation at ${node.val}`);
    return res;
  }
  if (bf > 1 && val > node.left.val) {
    recorder.push(clonePreserve(node), [node.id, node.left.id], `LR case at ${node.val} — rotate left at ${node.left.val}`);
    node.left = rotateLeft(node.left);
    recorder.push(clonePreserve(node), [node.id, node.left.id], `Then rotate right at ${node.val}`);
    const res = rotateRight(node);
    recorder.push(clonePreserve(res), [res.id], `After LR rotations`);
    return res;
  }
  if (bf < -1 && val < node.right.val) {
    recorder.push(clonePreserve(node), [node.id, node.right.id], `RL case at ${node.val} — rotate right at ${node.right.val}`);
    node.right = rotateRight(node.right);
    recorder.push(clonePreserve(node), [node.id, node.right.id], `Then rotate left at ${node.val}`);
    const res = rotateLeft(node);
    recorder.push(clonePreserve(res), [res.id], `After RL rotations`);
    return res;
  }
  recorder.push(clonePreserve(node), [node.id], `Rebalanced at ${node.val}, height ${node.height}`);
  return node;
}
/* AVL delete with recorder (standard BST delete + rebalancing) */
function avlDeleteRec(node, val, recorder) {
  if (!node) {
    recorder.push(null, [], `Value ${val} not found`);
    return null;
  }
  recorder.push(clonePreserve(node), [node.id], `At node ${node.val}: compare ${val} with ${node.val}`);
  if (val < node.val) {
    node.left = avlDeleteRec(node.left, val, recorder);
  } else if (val > node.val) {
    node.right = avlDeleteRec(node.right, val, recorder);
  } else {
    recorder.push(clonePreserve(node), [node.id], `Found ${val} — deleting`);
    if (!node.left || !node.right) {
      const tmp = node.left ? node.left : node.right;
      if (!tmp) {
        recorder.push(null, [], `Node ${val} was leaf — remove`);
        return null;
      } else {
        recorder.push(clonePreserve(tmp), [tmp.id], `Replace ${node.val} with child ${tmp.val}`);
        return tmp;
      }
    } else {
      let succParent = node;
      let succ = node.right;
      while (succ.left) {
        succParent = succ;
        succ = succ.left;
      }
      recorder.push(clonePreserve(succ), [succ.id], `Inorder successor is ${succ.val}`);
      node.val = succ.val;
      node.right = avlDeleteRec(node.right, succ.val, recorder);
    }
  }
  updateHeight(node);
  const bf = balanceFactor(node);
  if (bf > 1 && balanceFactor(node.left) >= 0) {
    recorder.push(clonePreserve(node), [node.id, node.left.id], `LL rebalance at ${node.val} — rotate right`);
    const res = rotateRight(node);
    recorder.push(clonePreserve(res), [res.id], `After right rotation`);
    return res;
  }
  if (bf > 1 && balanceFactor(node.left) < 0) {
    recorder.push(clonePreserve(node), [node.id, node.left.id], `LR rebalance at ${node.val} — left rotate at ${node.left.val}`);
    node.left = rotateLeft(node.left);
    recorder.push(clonePreserve(node), [node.id], `Then right rotate at ${node.val}`);
    const res = rotateRight(node);
    recorder.push(clonePreserve(res), [res.id], `After LR rotations`);
    return res;
  }
  if (bf < -1 && balanceFactor(node.right) <= 0) {
    recorder.push(clonePreserve(node), [node.id, node.right.id], `RR rebalance at ${node.val} — rotate left`);
    const res = rotateLeft(node);
    recorder.push(clonePreserve(res), [res.id], `After left rotation`);
    return res;
  }
  if (bf < -1 && balanceFactor(node.right) > 0) {
    recorder.push(clonePreserve(node), [node.id, node.right.id], `RL rebalance at ${node.val} — right rotate at ${node.right.val}`);
    node.right = rotateRight(node.right);
    recorder.push(clonePreserve(node), [node.id], `Then left rotate at ${node.val}`);
    const res = rotateLeft(node);
    recorder.push(clonePreserve(res), [res.id], `After RL rotations`);
    return res;
  }
  recorder.push(clonePreserve(node), [node.id], `Rebalanced at ${node.val}, height ${node.height}`);
  return node;
}
/* utility to insert many values sequentially recording steps */
function recordBulkInsert(values) {
  const recorder = new Recorder();
  let root = null;
  for (let v of values) {
    recorder.push(root ? clonePreserve(root) : null, [], `Start insert ${v}`);
    root = avlInsertRec(root, v, recorder);
    updateHeight(root);
    recorder.push(clonePreserve(root), [], `Tree after inserting ${v}`);
  }
  return { recorder, root };
}
/* compute layout of nodes and attach x,y to nodes */
function applyLayout(root) {
  if (!root) return 800;
  const w = layout(root);
  return w;
}
/* Animate runner: plays recorder.steps sequentially */
async function playSteps(steps, setRootState, setExplanation, setHighlight, speed, runnerRef) {
  if (!steps || steps.length === 0) return;
  runnerRef.current.playing = true;
  for (const step of steps) {
    if (runnerRef.current.stop) break;
    const snap = step.snapshot ? clonePreserve(step.snapshot) : null;
    if (snap) applyLayout(snap);
    setRootState(snap);
    setHighlight(step.highlight || []);
    setExplanation(step.explanation || "");
    await new Promise((r) => setTimeout(r, speed));
  }
  runnerRef.current.playing = false;
  runnerRef.current.stop = false;
}
/* Cyber grid button styles */
const btn = {
  padding: "10px 14px",
  borderRadius: 9,
  border: "none",
  background: "linear-gradient(90deg,#4B6CB7,#67C8FF)",
  color: "#fff",
  fontWeight: 800,
  cursor: "pointer",
  fontSize: 16,
  boxShadow: "0 0 7px #67C8FF77",
  marginRight: 5,
};
const btnAlt = {
  ...btn,
  background: "linear-gradient(90deg,#64748b,#94a3b8)",
  color: "#fff",
  boxShadow: "0 0 7px #64748b55",
};
const btnRed = {
  ...btn,
  background: "linear-gradient(90deg,#ef4444,#f97316)",
  color: "#fff",
  boxShadow: "0 0 7px #ef4444aa",
};

export default function AVLVisualizer() {
  const [input, setInput] = useState("30,20,40,10,25,35,50,5");
  const [rootState, setRootState] = useState(() => {
    const vals = [30, 20, 40, 10, 25, 35, 50, 5];
    const { recorder, root } = recordBulkInsert(vals);
    applyLayout(root);
    return clonePreserve(root);
  });
  const [explanation, setExplanation] = useState("Load or edit the tree, then choose an operation.");
  const [highlight, setHighlight] = useState([]);
  const [speed, setSpeed] = useState(650);
  const [insertVal, setInsertVal] = useState("");
  const [deleteVal, setDeleteVal] = useState("");
  const [updateOld, setUpdateOld] = useState("");
  const [updateNew, setUpdateNew] = useState("");
  const runnerRef = useRef({ stop: false, playing: false });
  const containerRef = useRef(null);
  const [svgW, setSvgW] = useState(900);
  useEffect(() => {
    if (rootState) {
      const w = applyLayout(rootState);
      setSvgW(w);
    }
  }, [rootState]);
  function stopRunner() {
    runnerRef.current.stop = true;
    runnerRef.current.playing = false;
  }
  async function handleBuild() {
    if (runnerRef.current.playing) return;
    const vals = input
      .split(/[\s,]+/)
      .map((s) => Number(s.trim()))
      .filter((n) => !Number.isNaN(n));
    if (vals.length === 0) {
      setExplanation("Enter numbers to build the AVL tree.");
      return;
    }
    const { recorder, root } = recordBulkInsert(vals);
    applyLayout(root);
    const steps = recorder.get();
    runnerRef.current.stop = false;
    await playSteps(steps, setRootState, setExplanation, setHighlight, speed, runnerRef);
    setRootState(clonePreserve(root));
    setExplanation("Build finished.");
    setHighlight([]);
  }
  async function handleInsert() {
    if (runnerRef.current.playing) return;
    const v = Number(insertVal);
    if (Number.isNaN(v)) {
      setExplanation("Enter a valid integer to insert.");
      return;
    }
    const recorder = new Recorder();
    const current = rootState ? clonePreserve(rootState) : null;
    recorder.push(current, [], `Start insert ${v}`);
    const newRoot = avlInsertRec(current, v, recorder);
    updateHeight(newRoot);
    applyLayout(newRoot);
    recorder.push(clonePreserve(newRoot), [], `Inserted ${v} — final`);
    const steps = recorder.get();
    runnerRef.current.stop = false;
    await playSteps(steps, setRootState, setExplanation, setHighlight, speed, runnerRef);
    setRootState(clonePreserve(newRoot));
    setExplanation(`Inserted ${v}.`);
    setHighlight([]);
  }
  async function handleDelete() {
    if (runnerRef.current.playing) return;
    const v = Number(deleteVal);
    if (Number.isNaN(v)) {
      setExplanation("Enter a valid integer to delete.");
      return;
    }
    const recorder = new Recorder();
    const current = rootState ? clonePreserve(rootState) : null;
    recorder.push(current, [], `Start delete ${v}`);
    const newRoot = avlDeleteRec(current, v, recorder);
    if (newRoot) updateHeight(newRoot);
    if (newRoot) applyLayout(newRoot);
    recorder.push(clonePreserve(newRoot), [], `Delete ${v} complete`);
    const steps = recorder.get();
    runnerRef.current.stop = false;
    await playSteps(steps, setRootState, setExplanation, setHighlight, speed, runnerRef);
    setRootState(clonePreserve(newRoot));
    setExplanation(`Delete ${v} finished.`);
    setHighlight([]);
  }
  async function handleUpdate() {
    if (runnerRef.current.playing) return;
    const a = Number(updateOld);
    const b = Number(updateNew);
    if (Number.isNaN(a) || Number.isNaN(b)) {
      setExplanation("Enter valid integers for update.");
      return;
    }
    setExplanation(`Updating ${a} → ${b} (delete then insert)`);
    await handleDeleteValue(a);
    await handleInsertValue(b);
    setExplanation(`Update ${a} → ${b} complete.`);
  }
  async function handleDeleteValue(v) {
    const recorder = new Recorder();
    const current = rootState ? clonePreserve(rootState) : null;
    recorder.push(current, [], `Start delete ${v}`);
    const newRoot = avlDeleteRec(current, v, recorder);
    if (newRoot) updateHeight(newRoot);
    if (newRoot) applyLayout(newRoot);
    recorder.push(clonePreserve(newRoot), [], `Delete ${v} complete`);
    runnerRef.current.stop = false;
    await playSteps(recorder.get(), setRootState, setExplanation, setHighlight, speed, runnerRef);
    setRootState(clonePreserve(newRoot));
  }
  async function handleInsertValue(v) {
    const recorder = new Recorder();
    const current = rootState ? clonePreserve(rootState) : null;
    recorder.push(current, [], `Start insert ${v}`);
    const newRoot = avlInsertRec(current, v, recorder);
    updateHeight(newRoot);
    applyLayout(newRoot);
    recorder.push(clonePreserve(newRoot), [], `Insert ${v} complete`);
    runnerRef.current.stop = false;
    await playSteps(recorder.get(), setRootState, setExplanation, setHighlight, speed, runnerRef);
    setRootState(clonePreserve(newRoot));
  }
  function renderEdges(node) {
    if (!node) return null;
    const els = [];
    if (node.left) {
      els.push(
        <line
          key={`${node.id}-L`}
          x1={node.x}
          y1={node.y + NODE_R}
          x2={node.left.x}
          y2={node.left.y - NODE_R}
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
          y1={node.y + NODE_R}
          x2={node.right.x}
          y2={node.right.y - NODE_R}
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
    const isHighlighted = highlight.includes(node.id);
    const fill = isHighlighted ? "#FBBF24" : "#4B6CB7";
    const textFill = "#E0E7FF";
    els.push(
      <motion.g
        key={node.id}
        initial={{ x: node.x, y: node.y, opacity: 1 }}
        animate={{ x: node.x, y: node.y, opacity: node.visible === false ? 0 : 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
      >
        <circle cx={0} cy={0} r={NODE_R} fill={fill} stroke="#67C8FF" strokeWidth="3" />
        <text x={0} y={6} textAnchor="middle" fontSize="14" fontWeight="800" fill={textFill}>
          {node.val}
        </text>
        <text x={0} y={28} textAnchor="middle" fontSize="11" fill={isHighlighted ? "#EF4444" : "#67C8FF"}>
          {`h:${node.height}`}
        </text>
      </motion.g>
    );
    if (node.left) els.push(...renderNodes(node.left));
    if (node.right) els.push(...renderNodes(node.right));
    return els;
  }
  const svgH = 440;
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
          fontFamily: "Segoe UI, Roboto, system-ui, -apple-system, sans-serif",
          maxWidth: 1150,
          margin: "30px auto",
          padding: "34px 28px",
          borderRadius: 20,
          boxShadow: "0 0 42px #4B6CB744",
          background: "rgba(12,17,35,0.95)",
          color: "#E0E7FF",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            fontWeight: "900",
            fontSize: 28,
            lineHeight: 1.1,
            background: "linear-gradient(90deg,#8beee9 10%,#4B6CB7 80%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: 1,
            marginBottom: 18,
          }}
        >
          AVL Tree Visualizer — Insert / Delete / Update
        </h2>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={runnerRef.current.playing}
            style={{
              minWidth: 320,
              padding: "10px 12px",
              borderRadius: 8,
              border: "1.5px solid #4B6CB7",
              fontSize: 16,
              background: "#15203F",
              color: "#E0E7FF",
              fontFamily: "monospace",
              outlineColor: "#67C8FF",
            }}
          />
          <button onClick={handleBuild} disabled={runnerRef.current.playing} style={btn}>
            Build (animate)
          </button>
          <button
            onClick={() => {
              if (runnerRef.current.playing) return;
              const vals = input
                .split(/[\s,]+/)
                .map((s) => Number(s.trim()))
                .filter((n) => !Number.isNaN(n));
              const { recorder, root } = recordBulkInsert(vals);
              applyLayout(root);
              setRootState(clonePreserve(root));
              setExplanation("Loaded tree (instant).");
              setHighlight([]);
            }}
            disabled={runnerRef.current.playing}
            style={btnAlt}
          >
            Load (instant)
          </button>
          <button onClick={() => { stopRunner(); setHighlight([]); setExplanation("Stopped"); }} style={btnRed} disabled={!runnerRef.current.playing}>
            Stop
          </button>
        </div>
        {/* Operation controls */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginBottom: 12 }}>
          <input value={insertVal} onChange={(e) => setInsertVal(e.target.value)} disabled={runnerRef.current.playing} placeholder="Insert" style={{ width: 100, borderRadius: 8, padding: 8, border: "1.5px solid #67C8FF", background: "#223366", color: "#fff" }} />
          <button onClick={handleInsert} disabled={runnerRef.current.playing} style={btn}>
            Insert
          </button>
          <input value={deleteVal} onChange={(e) => setDeleteVal(e.target.value)} disabled={runnerRef.current.playing} placeholder="Delete" style={{ width: 100, borderRadius: 8, padding: 8, border: "1.5px solid #67C8FF", background: "#223366", color: "#fff" }} />
          <button onClick={handleDelete} disabled={runnerRef.current.playing} style={btn}>
            Delete
          </button>
          <input value={updateOld} onChange={(e) => setUpdateOld(e.target.value)} disabled={runnerRef.current.playing} placeholder="Old" style={{ width: 80, borderRadius: 8, padding: 8, border: "1.5px solid #67C8FF", background: "#223366", color: "#fff" }} />
          <input value={updateNew} onChange={(e) => setUpdateNew(e.target.value)} disabled={runnerRef.current.playing} placeholder="New" style={{ width: 80, borderRadius: 8, padding: 8, border: "1.5px solid #67C8FF", background: "#223366", color: "#fff" }} />
          <button onClick={handleUpdate} disabled={runnerRef.current.playing} style={btn}>
            Update
          </button>
          <div style={{ marginLeft: 18, display: "flex", gap: 8, alignItems: "center" }}>
            <label style={{ fontWeight: 700, color: "#8BEED9" }}>Speed</label>
            <input type="range" min="80" max="1400" step="50" value={speed} onChange={(e) => setSpeed(Number(e.target.value))} disabled={runnerRef.current.playing} />
            <div style={{ minWidth: 56, textAlign: "right", fontWeight: 700, color: "#8BEED9" }}>{speed} ms</div>
          </div>
        </div>
        {/* SVG */}
        <div ref={containerRef} style={{ overflowX: "auto", padding: 10, background: "#0B1220", borderRadius: 10, border: "2px solid #334155", marginBottom: 8 }}>
          <svg width={svgW} height={svgH} style={{ background: "#0A0F1F", borderRadius: 7 }}>
            {rootState && renderEdges(rootState)}
            {rootState && renderNodes(rootState)}
          </svg>
        </div>
        {/* Explanation */}
        <div style={{ marginTop: 12, fontWeight: 800, minHeight: 44, padding: "10px 14px", borderRadius: 8, background: "#15203f", color: "#E0E7FF", fontSize: 18, boxShadow: "0 0 8px #67C8FF33" }}>
          {explanation}
        </div>
        {/* Definition & code */}
        <div style={{ marginTop: 18, padding: 18, background: "#1E2A59", color: "#B0CBF7", borderRadius: 12 }}>
          <div style={{ fontWeight: 900, color: "#67C8FF" }}>AVL Tree — Definition</div>
          <div style={{ marginTop: 8 }}>
            AVL tree is a self-balancing binary search tree where the heights of two child subtrees of any node differ by at most one. Rotations (single & double) are used to rebalance after insert/delete.
          </div>
          <pre style={{ marginTop: 10, background: "#071028", padding: 16, borderRadius: 8, color: "#fff" }}>
{`# Insert (concept)
insert(node, val):
  if not node: return new Node(val)
  if val < node.val: node.left = insert(node.left, val)
  else node.right = insert(node.right, val)
  update height
  balance = height(left) - height(right)
  if balance > 1 and val < node.left.val: right rotate
  if balance < -1 and val > node.right.val: left rotate
  if balance > 1 and val > node.left.val: left rotate at left then right rotate
  if balance < -1 and val < node.right.val: right rotate at right then left rotate
  return node
`}
          </pre>
        </div>
      </div>
    </div>
  );
}

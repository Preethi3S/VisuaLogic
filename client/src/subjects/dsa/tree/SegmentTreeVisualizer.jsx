import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

/**
 * SegmentTreeVisualizer.jsx
 * Full-page Cyber Grid Theme, fixed for universal cyber grid background.
 */

const NODE_RADIUS = 26;
const LEVEL_VGAP = 110;
const CANVAS_MIN_WIDTH = 720;

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

function buildEmptyTree(n) {
  let size = 1;
  while (size < n) size <<= 1;
  const tree = new Array(size * 2).fill(null);
  return { tree, baseSize: size };
}

function buildSegmentTreeSteps(arr) {
  return (async function* () {
    const n = arr.length;
    const { tree, baseSize } = buildEmptyTree(n);
    for (let i = 0; i < baseSize; i++) {
      const idx = baseSize + i;
      const val = i < n ? arr[i] : 0;
      tree[idx] = { l: i, r: i, sum: val, idx };
      yield {
        tree: tree.slice(),
        highlight: [idx],
        explanation: `Create leaf node [${i},${i}] = ${val}`,
      };
    }
    for (let idx = baseSize - 1; idx >= 1; idx--) {
      const left = tree[2 * idx];
      const right = tree[2 * idx + 1];
      const l = left ? left.l : null;
      const r = right ? right.r : null;
      const sum = (left ? left.sum : 0) + (right ? right.sum : 0);
      tree[idx] = { l, r, sum, idx };
      yield {
        tree: tree.slice(),
        highlight: [idx, 2 * idx, 2 * idx + 1].filter(Boolean),
        explanation: `Internal node [${l},${r}] = ${sum} (sum of children)`,
      };
    }
    yield { tree: tree.slice(), highlight: [], explanation: "Build complete." };
  })();
}

function queryRangeSteps(treeArr, baseSize, ql, qr) {
  return (async function* () {
    const tree = treeArr.slice();
    let result = 0;
    async function* visit(idx) {
      if (!tree[idx]) return;
      const node = tree[idx];
      if (node.r < ql || node.l > qr) {
        yield { tree: tree.slice(), highlight: [idx], explanation: `Node [${node.l},${node.r}] - no overlap` };
        return;
      }
      if (ql <= node.l && node.r <= qr) {
        result += node.sum;
        yield {
          tree: tree.slice(),
          highlight: [idx],
          explanation: `Node [${node.l},${node.r}] fully inside → add ${node.sum} (partial result ${result})`,
          partial: result,
        };
        return;
      }
      yield { tree: tree.slice(), highlight: [idx], explanation: `Node [${node.l},${node.r}] partial overlap, go deeper` };
      if (2 * idx < tree.length) {
        yield* visit(2 * idx);
      }
      if (2 * idx + 1 < tree.length) {
        yield* visit(2 * idx + 1);
      }
    }
    yield { tree: tree.slice(), highlight: [], explanation: `Querying range [${ql},${qr}] — start` };
    yield* visit(1);
    yield { tree: tree.slice(), highlight: [], explanation: `Query finished. Result = ${result}`, partial: result };
  })();
}

function updatePointSteps(treeArr, baseSize, pos, newVal) {
  return (async function* () {
    const tree = treeArr.slice();
    const leafIdx = baseSize + pos;
    if (!tree[leafIdx]) {
      yield { tree, highlight: [], explanation: `Index ${pos} out of range` };
      return;
    }
    yield { tree: tree.slice(), highlight: [leafIdx], explanation: `Go to leaf [${pos},${pos}] (old ${tree[leafIdx].sum})` };
    tree[leafIdx] = { ...tree[leafIdx], sum: newVal };
    yield { tree: tree.slice(), highlight: [leafIdx], explanation: `Update leaf to ${newVal}` };
    let idx = Math.floor(leafIdx / 2);
    while (idx >= 1) {
      const left = tree[2 * idx];
      const right = tree[2 * idx + 1];
      const newSum = (left ? left.sum : 0) + (right ? right.sum : 0);
      tree[idx] = { ...tree[idx], sum: newSum };
      yield {
        tree: tree.slice(),
        highlight: [idx, 2 * idx, 2 * idx + 1].filter(Boolean),
        explanation: `Update parent [${tree[idx].l},${tree[idx].r}] to ${newSum}`,
      };
      idx = Math.floor(idx / 2);
    }
    yield { tree: tree.slice(), highlight: [], explanation: `Update complete` };
  })();
}

/* ============================================================
   Visual component starts here
   ============================================================ */

export default function SegmentTreeVisualizer() {
  const [input, setInput] = useState("2,1,5,3,4");
  const [arr, setArr] = useState([2, 1, 5, 3, 4]);
  const [treeState, setTreeState] = useState({ tree: null, baseSize: 0 });
  const [explanation, setExplanation] = useState("Build the segment tree to begin.");
  const [highlight, setHighlight] = useState([]);
  const [partialResult, setPartialResult] = useState(null);

  const [speed, setSpeed] = useState(500);
  const [isRunning, setIsRunning] = useState(false);
  const runnerRef = useRef({ stop: false });

  const [canvasWidth, setCanvasWidth] = useState(Math.max(CANVAS_MIN_WIDTH, 900));
  const paddingX = 32;

  useEffect(() => {
    buildFromArray(arr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function parseInputToArray(text) {
    const parsed = text
      .split(/[\s,]+/)
      .map((s) => Number(s.trim()))
      .filter((v) => !Number.isNaN(v));
    return parsed;
  }

  async function buildFromArray(a) {
    stopRunner();
    setArr(a.slice());
    setPartialResult(null);
    setExplanation("Building segment tree...");
    const gen = buildSegmentTreeSteps(a);
    setIsRunning(true);
    runnerRef.current.stop = false;
    for await (const step of gen) {
      if (runnerRef.current.stop) break;
      setTreeState({ tree: step.tree, baseSize: computeBase(step.tree) });
      setHighlight(step.highlight || []);
      setExplanation(step.explanation || "");
      setPartialResult(step.partial ?? null);
      await sleep(speed);
    }
    setIsRunning(false);
    runnerRef.current.stop = false;
    adjustCanvasSizeFromTree();
  }

  function computeBase(treeArr) {
    if (!treeArr) return 0;
    let base = 0;
    for (let i = 1; i < treeArr.length; i++) {
      const n = treeArr[i];
      if (n && n.l === n.r) base = Math.max(base, i);
    }
    let size = 1;
    while (size * 2 <= base) size *= 2;
    if (size === 0) size = 1;
    return size;
  }

  function adjustCanvasSizeFromTree() {
    const { tree } = treeState;
    if (!tree) return;
    let maxLeafIdx = 0;
    for (let i = 1; i < tree.length; i++) {
      if (tree[i] && tree[i].l === tree[i].r) maxLeafIdx = Math.max(maxLeafIdx, tree[i].l);
    }
    const leafCount = maxLeafIdx + 1 || 1;
    const est = Math.max(CANVAS_MIN_WIDTH, leafCount * (NODE_RADIUS * 2 + 28));
    setCanvasWidth(est + paddingX * 2);
  }

  function stopRunner() {
    runnerRef.current.stop = true;
    setIsRunning(false);
  }

  async function runQuery(ql, qr) {
    if (!treeState.tree) {
      setExplanation("Build the tree first.");
      return;
    }
    stopRunner();
    setPartialResult(null);
    setIsRunning(true);
    runnerRef.current.stop = false;
    const gen = queryRangeSteps(treeState.tree, treeState.baseSize, ql, qr);
    for await (const step of gen) {
      if (runnerRef.current.stop) break;
      setTreeState((s) => ({ ...s, tree: step.tree }));
      setHighlight(step.highlight || []);
      setExplanation(step.explanation || "");
      setPartialResult(step.partial ?? null);
      await sleep(speed);
    }
    if (!runnerRef.current.stop) {
      setExplanation((prev) => `Query finished. Result = ${partialResult ?? "—"} `);
    }
    setIsRunning(false);
    runnerRef.current.stop = false;
  }

  async function runUpdate(pos, val) {
    if (!treeState.tree) {
      setExplanation("Build the tree first.");
      return;
    }
    if (pos < 0 || pos >= arr.length) {
      setExplanation("Index out of range.");
      return;
    }
    stopRunner();
    setIsRunning(true);
    runnerRef.current.stop = false;
    const gen = updatePointSteps(treeState.tree, treeState.baseSize, pos, val);
    for await (const step of gen) {
      if (runnerRef.current.stop) break;
      setTreeState((s) => ({ ...s, tree: step.tree }));
      setHighlight(step.highlight || []);
      setExplanation(step.explanation || "");
      await sleep(speed);
    }
    const copy = arr.slice();
    copy[pos] = val;
    setArr(copy);
    setIsRunning(false);
    runnerRef.current.stop = false;
  }

  function computeLayout(tree) {
    if (!tree) return [];
    const nodes = [];
    let maxIdx = 1;
    for (let i = 1; i < tree.length; i++) if (tree[i]) maxIdx = Math.max(maxIdx, i);
    const maxDepth = Math.floor(Math.log2(maxIdx)) + 1;
    const width = canvasWidth - paddingX * 2;
    for (let i = 1; i < tree.length; i++) {
      const node = tree[i];
      if (!node) continue;
      const depth = Math.floor(Math.log2(i));
      const levelStart = 1 << depth;
      const posInLevel = i - levelStart;
      const nodesAtLevel = levelStart;
      const x = paddingX + ((posInLevel + 0.5) * width) / nodesAtLevel;
      const y = 38 + depth * LEVEL_VGAP;
      nodes.push({ ...node, x, y, depth });
    }
    return nodes;
  }

  function renderEdges(tree) {
    if (!tree) return null;
    const nodesMap = {};
    const layout = computeLayout(tree);
    layout.forEach((n) => (nodesMap[n.idx] = n));
    const edges = [];
    for (const n of layout) {
      const leftIdx = 2 * n.idx;
      const rightIdx = 2 * n.idx + 1;
      if (nodesMap[leftIdx]) {
        edges.push(
          <line
            key={`e-${n.idx}-${leftIdx}`}
            x1={n.x}
            y1={n.y + NODE_RADIUS}
            x2={nodesMap[leftIdx].x}
            y2={nodesMap[leftIdx].y - NODE_RADIUS}
            stroke="#67C8FF"
            strokeWidth={3}
          />
        );
      }
      if (nodesMap[rightIdx]) {
        edges.push(
          <line
            key={`e-${n.idx}-${rightIdx}`}
            x1={n.x}
            y1={n.y + NODE_RADIUS}
            x2={nodesMap[rightIdx].x}
            y2={nodesMap[rightIdx].y - NODE_RADIUS}
            stroke="#67C8FF"
            strokeWidth={3}
          />
        );
      }
    }
    return edges;
  }

  function renderNodes(tree) {
    if (!tree) return null;
    const layout = computeLayout(tree);
    return layout.map((n) => {
      const isHighlighted = highlight.includes(n.idx);
      const fill = isHighlighted ? "#FBBF24" : "#4B6CB7";
      return (
        <g key={`n-${n.idx}`} transform={`translate(${n.x},${n.y})`}>
          <motion.circle
            initial={{ r: NODE_RADIUS }}
            animate={{ r: NODE_RADIUS }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            cx={0}
            cy={0}
            r={NODE_RADIUS}
            fill={fill}
            stroke="#67C8FF"
            strokeWidth={3}
          />
          <text x={0} y={4} textAnchor="middle" fontWeight="700" fontSize={13} fill="#0A0F1F">
            {`${n.l}-${n.r}`}
          </text>
          <text x={0} y={24} textAnchor="middle" fontSize={13} fill="#0A0F1F">
            {n.sum}
          </text>
        </g>
      );
    });
  }

  async function handleBuildClick() {
    const parsed = parseInputToArray(input);
    if (parsed.length === 0) {
      setExplanation("Please enter at least one number.");
      return;
    }
    await buildFromArray(parsed);
  }

  function handleLoadInputNow() {
    const parsed = parseInputToArray(input);
    if (parsed.length === 0) {
      setExplanation("Please enter numbers first.");
      return;
    }
    const n = parsed.length;
    const { tree } = (() => {
      const { tree } = buildEmptyTree(n);
      let baseSize = 1;
      while (baseSize < n) baseSize <<= 1;
      for (let i = 0; i < baseSize; i++) {
        const idx = baseSize + i;
        const val = i < n ? parsed[i] : 0;
        tree[idx] = { l: i, r: i, sum: val, idx };
      }
      for (let idx = baseSize - 1; idx >= 1; idx--) {
        const left = tree[2 * idx];
        const right = tree[2 * idx + 1];
        const l = left ? left.l : null;
        const r = right ? right.r : null;
        const sum = (left ? left.sum : 0) + (right ? right.sum : 0);
        tree[idx] = { l, r, sum, idx };
      }
      return { tree, baseSize };
    })();
    const baseSize = computeBase(tree);
    setArr(parsed);
    setTreeState({ tree, baseSize });
    setPartialResult(null);
    adjustCanvasSizeFromTree();
    setExplanation("Tree loaded (instant). Use query/update to animate operations.");
  }

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
          fontFamily: "Segoe UI, Roboto, sans-serif",
          maxWidth: 1200,
          margin: "30px auto",
          padding: "36px 32px",
          background: "rgba(12,17,35,0.96)",
          borderRadius: 22,
          color: "#E0E7FF",
          boxShadow: "0 0 44px #4B6CB744",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 18,
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: 240 }}>
            <h2
              style={{
                margin: 0,
                background: "linear-gradient(90deg,#8beee9 18%,#4B6CB7 80%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontWeight: 890,
                fontSize: 27,
                letterSpacing: 1,
              }}
            >
              Segment Tree Visualizer — Range Sum
            </h2>
            <div style={{ color: "#B0CBF7", marginTop: 6 }}>
              Enter an array (comma or space separated), build the tree, then run queries or updates.
            </div>
          </div>
          <div style={{ minWidth: 340, display: "flex", gap: 7 }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isRunning}
              placeholder="e.g. 2,1,5,3,4"
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: 8,
                border: "1.5px solid #4B6CB7",
                fontSize: 16,
                background: "#15203f",
                color: "#E0E7FF",
                fontFamily: "monospace",
                outlineColor: "#67C8FF",
              }}
            />
            <button onClick={handleBuildClick} disabled={isRunning} style={buttonStyle}>
              Build (animate)
            </button>
            <button onClick={handleLoadInputNow} disabled={isRunning} style={buttonStyleAlt}>
              Load (instant)
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 14, marginBottom: 14, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
            <input
              type="number"
              placeholder="ql"
              id="ql"
              style={smallInputStyle}
              disabled={isRunning}
              onChange={(e) => (document.getElementById("qlVal").value = e.target.value)}
            />
            <input
              type="number"
              placeholder="qr"
              id="qr"
              style={smallInputStyle}
              disabled={isRunning}
              onChange={(e) => (document.getElementById("qrVal").value = e.target.value)}
            />
            <button
              onClick={() => {
                const ql = Number((document.getElementById("qlVal") || { value: "" }).value);
                const qr = Number((document.getElementById("qrVal") || { value: "" }).value);
                if (Number.isNaN(ql) || Number.isNaN(qr)) {
                  setExplanation("Enter valid ql and qr indices (0-based).");
                  return;
                }
                runQuery(ql, qr);
              }}
              disabled={isRunning}
              style={buttonStyle}
            >
              Query range
            </button>
            <input id="qlVal" type="hidden" />
            <input id="qrVal" type="hidden" />
          </div>
          <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
            <input id="updIdx" type="number" placeholder="pos" style={smallInputStyle} disabled={isRunning} />
            <input id="updVal" type="number" placeholder="new value" style={smallInputStyle} disabled={isRunning} />
            <button
              onClick={() => {
                const pos = Number((document.getElementById("updIdx") || { value: "" }).value);
                const val = Number((document.getElementById("updVal") || { value: "" }).value);
                if (Number.isNaN(pos) || Number.isNaN(val)) {
                  setExplanation("Enter valid index and value for update.");
                  return;
                }
                runUpdate(pos, val);
              }}
              disabled={isRunning}
              style={buttonStyle}
            >
              Point update
            </button>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 7, alignItems: "center" }}>
            <label style={{ fontWeight: 700, color: "#8beee9" }}>Speed</label>
            <input
              type="range"
              min="80"
              max="1200"
              step="20"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              disabled={isRunning}
            />
            <div style={{ minWidth: 56, textAlign: "right", fontWeight: 700, color: "#67C8FF" }}>{speed} ms</div>
            <button onClick={() => stopRunner()} style={buttonStyle} disabled={!isRunning}>
              Stop
            </button>
            <button
              onClick={() => {
                setHighlight([]);
                setPartialResult(null);
                setExplanation("Cleared highlights.");
              }}
              style={buttonStyleAlt}
            >
              Clear
            </button>
          </div>
        </div>

        <div style={{ overflowX: "auto", padding: 12, background: "#0b1220", borderRadius: 12, border: "2px solid #334155", marginBottom: 10 }}>
          <svg width={canvasWidth} height={LEVEL_VGAP * 5} style={{ background: "#0A0F1F", borderRadius: 8 }}>
            {treeState.tree && renderEdges(treeState.tree)}
            {treeState.tree && renderNodes(treeState.tree)}
          </svg>
        </div>

        <div style={{ marginTop: 10, display: "flex", gap: 13, alignItems: "center" }}>
          <div style={{ flex: 1, fontWeight: 800, fontSize: 18, color: "#FBBF24" }}>{explanation}</div>
          <div style={{ minWidth: 160, textAlign: "right" }}>
            <div style={{ fontSize: 14, color: "#67C8FF" }}>Underlying array: [{arr.join(", ")}]</div>
            <div style={{ fontSize: 16, fontWeight: 900, marginTop: 6, color: "#10B981" }}>
              {partialResult !== null ? `Partial result: ${partialResult}` : ""}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 20, padding: 18, background: "#15203f", color: "#E0E7FF", borderRadius: 12 }}>
          <div style={{ fontWeight: 900, fontSize: 18, color: "#67C8FF" }}>Segment Tree — Definition</div>
          <div style={{ marginTop: 7, color: "#B0CBF7" }}>
            Segment tree is a binary tree used for storing information about intervals, here storing range sums. It allows queries (range sums) and point updates in O(log n).
          </div>
          <pre style={{ marginTop: 10, background: "#0b1220", padding: 13, borderRadius: 8, color: "#fff" }}>
{`# build (conceptual)
build(node, l, r):
  if l == r: tree[node] = arr[l]
  else:
    mid = (l+r)//2
    build(node*2, l, mid)
    build(node*2+1, mid+1, r)
    tree[node] = tree[node*2] + tree[node*2+1]

# query (conceptual)
query(node, l, r, ql, qr):
  if ql > r or qr < l: return 0
  if ql <= l and r <= qr: return tree[node]
  mid = (l+r)//2
  return query(node*2, l, mid, ql, qr) + query(node*2+1, mid+1, r, ql, qr)
`}
          </pre>
        </div>
      </div>
    </div>
  );
}

const buttonStyle = {
  padding: "9px 12px",
  borderRadius: 8,
  border: "none",
  background: "linear-gradient(90deg,#4B6CB7,#67C8FF)",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 800,
  fontSize: 15,
  boxShadow: "0 0 7px #67C8FF88",
};
const buttonStyleAlt = {
  ...buttonStyle,
  background: "linear-gradient(90deg,#64748b,#94a3b8)",
  color: "#fff",
  boxShadow: "0 0 7px #64748b55",
};
const smallInputStyle = {
  width: 80,
  padding: "8px 10px",
  borderRadius: 7,
  border: "1.5px solid #67C8FF",
  background: "#223366",
  color: "#fff",
  fontWeight: 700,
  fontSize: 16,
  fontFamily: "monospace",
};

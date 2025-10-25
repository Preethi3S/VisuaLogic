// TreeVisualizerWithAnimations.jsx
import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

/* Constants */
const NODE_RADIUS = 22;
const VERTICAL_GAP = 90;
const HORIZONTAL_GAP = 40;

/* UID generator */
let UID = 1;
function nextId() {
  return `n-${Date.now()}-${UID++}`;
}

/* Tree node */
class TreeNode {
  constructor(val) {
    this.val = val;
    this.left = null;
    this.right = null;
    this.id = nextId();
    this.x = 0;
    this.y = 0;
    this.visible = true;
  }
}

/* Build tree from level-order array (null = missing) */
function buildTreeFromLevelOrder(arr) {
  if (!arr || arr.length === 0) return null;
  const nodes = arr.map((v) => (v === null ? null : new TreeNode(v)));
  const root = nodes[0];
  const q = [];
  let idx = 1;
  if (!root) return null;
  q.push(root);
  while (q.length && idx < nodes.length) {
    const cur = q.shift();
    if (idx < nodes.length) {
      cur.left = nodes[idx++] ?? null;
      if (cur.left) q.push(cur.left);
    }
    if (idx < nodes.length) {
      cur.right = nodes[idx++] ?? null;
      if (cur.right) q.push(cur.right);
    }
  }
  return root;
}

function cloneTree(node) {
  if (!node) return null;
  const n = new TreeNode(node.val);
  n.id = node.id;
  n.visible = node.visible ?? true;
  n.left = cloneTree(node.left);
  n.right = cloneTree(node.right);
  n.x = node.x;
  n.y = node.y;
  return n;
}

/* Layout tree with inorder-based x spacing. Returns computed width. */
function layoutTree(root) {
  let order = 0;
  function dfs(node, depth) {
    if (!node) return;
    dfs(node.left, depth + 1);
    node.x = order * (NODE_RADIUS * 2 + HORIZONTAL_GAP) + NODE_RADIUS + 20;
    node.y = depth * VERTICAL_GAP + NODE_RADIUS + 10;
    order++;
    dfs(node.right, depth + 1);
  }
  dfs(root, 0);
  const totalWidth = Math.max(800, order * (NODE_RADIUS * 2 + HORIZONTAL_GAP) + 60);
  return totalWidth;
}

function findMinAndParent(node) {
  let parent = null;
  let cur = node;
  while (cur && cur.left) {
    parent = cur;
    cur = cur.left;
  }
  return { minNode: cur, parent };
}

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

export default function TreeVisualizerWithAnimations() {
  const [input, setInput] = useState("20,10,30,5,15,25,40");
  const [root, setRoot] = useState(() => {
    const r = buildTreeFromLevelOrder([20, 10, 30, 5, 15, 25, 40]);
    layoutTree(r);
    return r;
  });
  const [svgWidth, setSvgWidth] = useState(900);

  const [traversalMode, setTraversalMode] = useState("Inorder");
  const [explanation, setExplanation] = useState("Load or edit the tree, then choose an action.");
  const [visitedIds, setVisitedIds] = useState(new Set());
  const [highlightId, setHighlightId] = useState(null);

  const [insertValue, setInsertValue] = useState("");
  const [deleteValue, setDeleteValue] = useState("");
  const [updateOldValue, setUpdateOldValue] = useState("");
  const [updateNewValue, setUpdateNewValue] = useState("");
  const [speed, setSpeed] = useState(600);

  const animRef = useRef(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!root) {
      setSvgWidth(900);
      return;
    }
    const w = layoutTree(root);
    setSvgWidth(w);
  }, [root]);

  function publishTree(updatedRoot, note = "") {
    if (updatedRoot) {
      layoutTree(updatedRoot);
      setRoot(cloneTree(updatedRoot));
      setExplanation(note || "Tree updated.");
      requestAnimationFrame(() => {
        if (containerRef.current) {
          containerRef.current.scrollLeft = Math.max(0, (svgWidth - containerRef.current.clientWidth) / 2);
        }
      });
    } else {
      setRoot(null);
      setExplanation(note || "Tree updated (now empty).");
    }
  }

  function handleLoad() {
    if (animRef.current) return;
    const arr = input
      .split(/[\s,]+/)
      .map((s) => (s.trim().toLowerCase() === "null" ? null : Number(s.trim())))
      .filter((v) => v === null || !Number.isNaN(v));
    const newRoot = buildTreeFromLevelOrder(arr);
    if (newRoot) {
      const w = layoutTree(newRoot);
      setSvgWidth(w);
      setRoot(cloneTree(newRoot));
      setVisitedIds(new Set());
      setHighlightId(null);
      setExplanation("Tree loaded.");
      requestAnimationFrame(() => {
        if (containerRef.current) containerRef.current.scrollLeft = 0;
      });
    } else {
      setRoot(null);
      setExplanation("Loaded an empty tree.");
    }
  }

  function handleReset() {
    if (animRef.current) return;
    const defaultArr = [20, 10, 30, 5, 15, 25, 40];
    const newRoot = buildTreeFromLevelOrder(defaultArr);
    const w = layoutTree(newRoot);
    setSvgWidth(w);
    setRoot(cloneTree(newRoot));
    setInput(defaultArr.join(","));
    setVisitedIds(new Set());
    setHighlightId(null);
    setExplanation("Reset to default tree.");
  }

  function traversalSequence(rootNode, mode) {
    if (!rootNode) return [];
    const seq = [];
    function pre(n) {
      if (!n) return;
      seq.push(n);
      pre(n.left);
      pre(n.right);
    }
    function inord(n) {
      if (!n) return;
      inord(n.left);
      seq.push(n);
      inord(n.right);
    }
    function post(n) {
      if (!n) return;
      post(n.left);
      post(n.right);
      seq.push(n);
    }
    function level(n) {
      const q = [n];
      while (q.length) {
        const c = q.shift();
        seq.push(c);
        if (c.left) q.push(c.left);
        if (c.right) q.push(c.right);
      }
    }
    switch (mode) {
      case "Preorder":
        pre(rootNode);
        break;
      case "Inorder":
        inord(rootNode);
        break;
      case "Postorder":
        post(rootNode);
        break;
      case "Level Order":
        level(rootNode);
        break;
      default:
        inord(rootNode);
    }
    return seq;
  }

  async function animateTraversal(mode) {
    if (!root) {
      setExplanation("No tree loaded.");
      return;
    }
    if (animRef.current) return;
    animRef.current = true;
    setVisitedIds(new Set());
    setHighlightId(null);
    setExplanation(`${mode} traversal started.`);
    const seq = traversalSequence(root, mode);
    for (let node of seq) {
      if (!animRef.current) break;
      setHighlightId(node.id);
      setExplanation(`Visiting node ${node.val}`);
      await sleep(speed);
      setVisitedIds((prev) => new Set(prev).add(node.id));
      setHighlightId(null);
      await sleep(Math.max(80, speed / 3));
    }
    if (animRef.current) setExplanation(`${mode} traversal finished.`);
    animRef.current = false;
  }

  async function animateInsert(value) {
    if (animRef.current) return;
    if (!Number.isInteger(value)) {
      setExplanation("Insert: enter an integer value.");
      return;
    }
    animRef.current = true;
    setVisitedIds(new Set());
    setHighlightId(null);

    if (!root) {
      const n = new TreeNode(value);
      layoutTree(n);
      publishTree(n, `Inserted ${value} as root.`);
      animRef.current = false;
      return;
    }

    setExplanation(`Insert ${value}: start at root.`);
    let cur = root;
    let parent = null;
    while (cur && animRef.current) {
      setHighlightId(cur.id);
      setExplanation(`Compare with ${cur.val}`);
      await sleep(speed);
      parent = cur;
      if (value < cur.val) cur = cur.left;
      else cur = cur.right;
    }
    if (!animRef.current) {
      setExplanation("Insert cancelled.");
      animRef.current = false;
      return;
    }
    const newNode = new TreeNode(value);
    newNode.visible = false;
    if (value < parent.val) parent.left = newNode;
    else parent.right = newNode;
    layoutTree(root);
    publishTree(root, `Inserted ${value}, fading in...`);
    await sleep(150);
    newNode.visible = true;
    layoutTree(root);
    publishTree(root, `Insertion of ${value} complete.`);
    setHighlightId(newNode.id);
    await sleep(speed);
    setVisitedIds((prev) => new Set(prev).add(newNode.id));
    setHighlightId(null);
    animRef.current = false;
  }

  async function animateDelete(value) {
    if (animRef.current) return;
    if (!root) {
      setExplanation("No tree.");
      return;
    }
    animRef.current = true;
    setVisitedIds(new Set());
    setHighlightId(null);
    setExplanation(`Delete ${value}: start at root.`);

    let parent = null;
    let cur = root;
    while (cur && cur.val !== value && animRef.current) {
      setHighlightId(cur.id);
      setExplanation(`Compare ${value} with ${cur.val}`);
      await sleep(speed);
      parent = cur;
      cur = value < cur.val ? cur.left : cur.right;
    }
    if (!animRef.current) {
      setExplanation("Delete cancelled.");
      animRef.current = false;
      return;
    }
    if (!cur) {
      setExplanation(`${value} not found.`);
      animRef.current = false;
      return;
    }

    setHighlightId(cur.id);
    setExplanation(`Found ${cur.val}, preparing to delete.`);
    await sleep(speed);

    async function deleteNode(parentNode, nodeToDelete) {
      if (!nodeToDelete.left && !nodeToDelete.right) {
        setExplanation(`Node ${nodeToDelete.val} is a leaf. Removing.`);
        nodeToDelete.visible = false;
        publishTree(root, `Removing leaf ${nodeToDelete.val}...`);
        await sleep(Math.max(180, speed / 2));
        if (!parentNode) {
          setRoot(null);
        } else {
          if (parentNode.left && parentNode.left.id === nodeToDelete.id) parentNode.left = null;
          else if (parentNode.right && parentNode.right.id === nodeToDelete.id) parentNode.right = null;
          layoutTree(root);
          publishTree(root, `Deleted leaf ${nodeToDelete.val}.`);
        }
        return;
      }
      if (!nodeToDelete.left || !nodeToDelete.right) {
        const child = nodeToDelete.left ?? nodeToDelete.right;
        setExplanation(`Node has one child. Replacing ${nodeToDelete.val} with ${child.val}.`);
        await sleep(Math.max(180, speed / 2));
        if (!parentNode) {
          publishTree(child, `Deleted root ${nodeToDelete.val}, replaced with ${child.val}.`);
          return;
        } else {
          if (parentNode.left && parentNode.left.id === nodeToDelete.id) parentNode.left = child;
          else if (parentNode.right && parentNode.right.id === nodeToDelete.id) parentNode.right = child;
          layoutTree(root);
          publishTree(root, `Deleted ${nodeToDelete.val}, replaced by ${child.val}.`);
          return;
        }
      }
      setExplanation(`Node has two children. Finding inorder successor in right subtree.`);
      await sleep(speed);
      const { minNode, parent: minParent } = findMinAndParent(nodeToDelete.right);
      setHighlightId(minNode.id);
      setExplanation(`Inorder successor is ${minNode.val}. Copying value to ${nodeToDelete.val}.`);
      await sleep(speed);
      nodeToDelete.val = minNode.val;
      await deleteNode(minParent ?? nodeToDelete, minNode);
      layoutTree(root);
      publishTree(root, `Replaced value and removed successor ${minNode.val}.`);
      return;
    }

    await deleteNode(parent, cur);
    if (root) {
      layoutTree(root);
      setRoot(cloneTree(root));
    }
    setHighlightId(null);
    animRef.current = false;
  }

  async function animateUpdate(oldVal, newVal) {
    if (animRef.current) return;
    if (!Number.isInteger(oldVal) || !Number.isInteger(newVal)) {
      setExplanation("Update: enter valid integers.");
      return;
    }
    setExplanation(`Updating: delete ${oldVal} then insert ${newVal}.`);
    await animateDelete(oldVal);
    await sleep(180);
    await animateInsert(newVal);
    setExplanation(`Update complete: ${oldVal} -> ${newVal}`);
  }

  async function startTraversal() {
    if (animRef.current) return;
    await animateTraversal(traversalMode);
  }
  async function doInsert() {
    if (animRef.current) return;
    const v = Number(insertValue);
    await animateInsert(v);
  }
  async function doDelete() {
    if (animRef.current) return;
    const v = Number(deleteValue);
    await animateDelete(v);
  }
  async function doUpdate() {
    if (animRef.current) return;
    const a = Number(updateOldValue);
    const b = Number(updateNewValue);
    await animateUpdate(a, b);
  }
  function stopAll() {
    animRef.current = false;
    setExplanation("Stopped.");
  }

  function renderEdges(node) {
    if (!node) return null;
    const edges = [];
    if (node.left) {
      edges.push(
        <line
          key={`${node.id}-L`}
          x1={node.x}
          y1={node.y}
          x2={node.left.x}
          y2={node.left.y}
          stroke="#67C8FF"
          strokeWidth="3"
        />
      );
      edges.push(...renderEdges(node.left));
    }
    if (node.right) {
      edges.push(
        <line
          key={`${node.id}-R`}
          x1={node.x}
          y1={node.y}
          x2={node.right.x}
          y2={node.right.y}
          stroke="#67C8FF"
          strokeWidth="3"
        />
      );
      edges.push(...renderEdges(node.right));
    }
    return edges;
  }

  function renderNodes(node) {
    if (!node) return null;
    const nodes = [];
    const isVisited = visitedIds.has(node.id);
    const isHighlighted = highlightId === node.id;
    const fill = isHighlighted ? "#FBBF24" : isVisited ? "#10B981" : "#4B6CB7";
    const textColor = "#E0E7FF";
    const opacity = node.visible === false ? 0 : 1;

    nodes.push(
      <motion.g
        key={node.id}
        initial={{ x: node.x, y: node.y, opacity }}
        animate={{ x: node.x, y: node.y, opacity }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
      >
        <circle cx={0} cy={0} r={NODE_RADIUS} fill={fill} stroke="#67C8FF" strokeWidth="3" />
        <text x={0} y={6} textAnchor="middle" fontWeight="700" fontSize="15" fill={textColor}>
          {node.val}
        </text>
      </motion.g>
    );

    if (node.left) nodes.push(...renderNodes(node.left));
    if (node.right) nodes.push(...renderNodes(node.right));
    return nodes;
  }

  const svgHeight = 420;

  // --- Cyber grid full background applied here ---
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
          maxWidth: 1150,
          margin: "36px auto",
          padding: 28,
          fontFamily: "Segoe UI, system-ui, -apple-system, sans-serif",
          background: "rgba(12,17,35,0.97)",
          color: "#E0E7FF",
          borderRadius: 16,
          boxShadow: "0 0 44px #67C8FF44",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            background: "linear-gradient(90deg,#8beee9 18%,#4B6CB7 86%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontWeight: 900,
            fontSize: 27,
            letterSpacing: 1,
          }}
        >
          BST Visualizer — Traversal & Operations
        </h2>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", alignItems: "center", flexWrap: "wrap", marginBottom: 6 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={animRef.current}
            style={{
              minWidth: 340,
              padding: "9px 13px",
              borderRadius: 8,
              border: "1.5px solid #4B6CB7",
              background: "#15203f",
              color: "#E0E7FF",
              fontFamily: "monospace",
              fontSize: 16,
              marginRight: 7,
            }}
          />
          <button onClick={handleLoad} disabled={animRef.current} style={btn}>
            Load
          </button>
          <button onClick={handleReset} disabled={animRef.current} style={btn}>
            Reset
          </button>
          <button onClick={stopAll} disabled={!animRef.current} style={{ ...btn, opacity: animRef.current ? 1 : 0.5 }}>
            Stop
          </button>
        </div>
        <div style={{ marginTop: 8, display: "flex", gap: 9, flexWrap: "wrap", justifyContent: "center", alignItems: "center" }}>
          <select value={traversalMode} onChange={(e) => setTraversalMode(e.target.value)} disabled={animRef.current} style={selectStyle}>
            <option>Inorder</option>
            <option>Preorder</option>
            <option>Postorder</option>
            <option>Level Order</option>
          </select>
          <button onClick={startTraversal} disabled={animRef.current} style={btn}>
            Start Traversal
          </button>
          <input
            placeholder="Insert"
            value={insertValue}
            onChange={(e) => setInsertValue(e.target.value)}
            disabled={animRef.current}
            style={inputSmall}
          />
          <button onClick={doInsert} disabled={animRef.current} style={btn}>
            Insert
          </button>
          <input
            placeholder="Delete"
            value={deleteValue}
            onChange={(e) => setDeleteValue(e.target.value)}
            disabled={animRef.current}
            style={inputSmall}
          />
          <button onClick={doDelete} disabled={animRef.current} style={btn}>
            Delete
          </button>
          <input
            placeholder="Old"
            value={updateOldValue}
            onChange={(e) => setUpdateOldValue(e.target.value)}
            disabled={animRef.current}
            style={inputSmaller}
          />
          <input
            placeholder="New"
            value={updateNewValue}
            onChange={(e) => setUpdateNewValue(e.target.value)}
            disabled={animRef.current}
            style={inputSmaller}
          />
          <button onClick={doUpdate} disabled={animRef.current} style={btn}>
            Update
          </button>
        </div>
        <div
          ref={containerRef}
          style={{
            marginTop: 16,
            overflowX: "auto",
            padding: 14,
            background: "#0b1220",
            borderRadius: 11,
            border: "2px solid #67C8FF22",
          }}
        >
          <svg width={svgWidth} height={svgHeight} style={{ background: "#0A0F1F", borderRadius: 8 }}>
            {root && renderEdges(root)}
            <g transform={`translate(0,0)`}>{root && renderNodes(root)}</g>
            {!root && <text x={svgWidth / 2} y={svgHeight / 2} textAnchor="middle" fill="#67C8FF">Tree is empty</text>}
          </svg>
        </div>
        <div style={{ marginTop: 13, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ minHeight: 38, fontWeight: 800, letterSpacing: 0.3 }}>{explanation}</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <label style={{ fontWeight: 700, color: "#67C8FF" }}>Speed</label>
            <input
              type="range"
              min="100"
              max="1400"
              step="50"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              disabled={animRef.current}
            />
            <span style={{ width: 55, textAlign: "right", fontWeight: 750, color: "#67C8FF" }}>{speed}ms</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const btn = {
  padding: "10px 14px",
  borderRadius: 9,
  border: "none",
  background: "linear-gradient(90deg,#4B6CB7,#67C8FF)",
  color: "#fff",
  fontWeight: 900,
  fontSize: 15,
  cursor: "pointer",
  boxShadow: "0 0 7px #67C8FF77"
};
const selectStyle = {
  padding: "8px 11px",
  borderRadius: 8,
  border: "1.5px solid #4B6CB7",
  background: "#15203f",
  color: "#E0E7FF",
  fontWeight: 800,
  fontSize: 15,
  outlineColor: "#67C8FF",
};
const inputSmall = {
  width: 95,
  padding: "8px 10px",
  borderRadius: 8,
  border: "1.5px solid #67C8FF",
  background: "#223366",
  color: "#fff",
  fontWeight: 700,
  fontSize: 15,
  fontFamily: "monospace",
};
const inputSmaller = {
  width: 72,
  padding: "8px 10px",
  borderRadius: 8,
  border: "1.5px solid #67C8FF",
  background: "#223366",
  color: "#fff",
  fontWeight: 700,
  fontSize: 15,
  fontFamily: "monospace",
};

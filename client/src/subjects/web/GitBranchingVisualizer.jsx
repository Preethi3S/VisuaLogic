// src/scenes/GitBranchingVisualizer.jsx
import React, { useMemo, useRef, useState } from "react";

export default function GitBranchingVisualizer() {
  // --- state and logic as before ---
  const [repoName, setRepoName] = useState("my-repo");
  const [tempRepoName, setTempRepoName] = useState("my-repo");

  const [commits, setCommits] = useState(() => {
    const root = {
      id: "c0",
      parents: [],
      message: "Initial commit",
      ts: 0,
      lane: 0,
    };
    return [root];
  });
  const [branches, setBranches] = useState({ main: "c0" });
  const [currentBranch, setCurrentBranch] = useState("main");
  const [selectedCommit, setSelectedCommit] = useState("c0");
  const idCounter = useRef(1);

  const [comments, setComments] = useState({});
  const [newRootComment, setNewRootComment] = useState("");
  const [log, setLog] = useState(["repo init → main@c0"]);

  const pushLog = (line) => setLog((prev) => [line, ...prev]);
  const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const countComments = (list) => (list ? list.reduce((acc, c) => acc + 1 + countComments(c.replies), 0) : 0);
  const updateCommentTree = (list, commentId, updater) =>
    (list || []).map((c) => (c.id === commentId ? updater(c) : { ...c, replies: updateCommentTree(c.replies || [], commentId, updater) }));
  const removeFromTree = (list, commentId) =>
    (list || []).filter((c) => c.id !== commentId).map((c) => ({ ...c, replies: removeFromTree(c.replies || [], commentId) }));
  const addRootComment = (commitId, text) => {
    const entry = { id: uid(), text: text.trim(), author: "you", createdAt: new Date().toISOString(), replies: [] };
    setComments((prev) => ({ ...prev, [commitId]: [...(prev[commitId] || []), entry] }));
    pushLog(`comment added on ${commitId}`);
  };
  const addReply = (commitId, parentId, text) => {
    const reply = { id: uid(), text: text.trim(), author: "you", createdAt: new Date().toISOString(), replies: [] };
    setComments((prev) => ({
      ...prev,
      [commitId]: updateCommentTree(prev[commitId] || [], parentId, (c) => ({
        ...c,
        replies: [...(c.replies || []), reply],
      })),
    }));
    pushLog(`reply added on ${commitId}`);
  };
  const editComment = (commitId, commentId, newText) => {
    setComments((prev) => ({
      ...prev,
      [commitId]: updateCommentTree(prev[commitId] || [], commentId, (c) => ({ ...c, text: newText })),
    }));
    pushLog(`comment edited on ${commitId}`);
  };
  const deleteComment = (commitId, commentId) => {
    setComments((prev) => ({
      ...prev,
      [commitId]: removeFromTree(prev[commitId] || [], commentId),
    }));
    pushLog(`comment deleted on ${commitId}`);
  };

  const tipOf = (branch) => branches[branch];
  const getCommit = (id) => commits.find((c) => c.id === id);

  const makeCommit = (parentId, message) => {
    const id = `c${idCounter.current++}`;
    const parent = getCommit(parentId);
    const lane = parent ? parent.lane : 0;
    const next = { id, parents: parentId ? [parentId] : [], message, ts: idCounter.current, lane };
    setCommits((prev) => [...prev, next]);
    setBranches((prev) => ({ ...prev, [currentBranch]: id }));
    setSelectedCommit(id);
    pushLog(`${currentBranch}: commit ${id} — ${message}`);
  };
  const createCommit = () => makeCommit(tipOf(currentBranch), `work on ${currentBranch}`);
  const createBranch = () => {
    const base = selectedCommit || tipOf(currentBranch);
    const name = prompt("New branch name:", "feature");
    if (!name) return;
    if (branches[name]) return alert("Branch already exists");
    setBranches((prev) => ({ ...prev, [name]: base }));
    pushLog(`branch ${name} created at ${base}`);
  };
  const checkoutBranch = () => {
    const name = prompt("Checkout branch:", currentBranch);
    if (!name) return;
    if (!branches[name]) return alert("Branch not found");
    setCurrentBranch(name);
    setSelectedCommit(branches[name]);
    pushLog(`checkout ${name}`);
  };
  const ancestorsOf = (id) => {
    const seen = new Set();
    const stack = [id];
    while (stack.length) {
      const cur = stack.pop();
      if (!cur || seen.has(cur)) continue;
      seen.add(cur);
      const c = getCommit(cur);
      if (!c) continue;
      c.parents.forEach((p) => stack.push(p));
    }
    return seen;
  };
  const isAncestor = (a, b) => ancestorsOf(b).has(a);
  const mergeIntoCurrent = () => {
    const source = prompt(
      "Merge which branch into current?",
      Object.keys(branches).find((b) => b !== currentBranch) || ""
    );
    if (!source || !branches[source]) return;
    const targetTip = tipOf(currentBranch);
    const sourceTip = tipOf(source);
    if (isAncestor(targetTip, sourceTip)) {
      setBranches((prev) => ({ ...prev, [currentBranch]: sourceTip }));
      setSelectedCommit(sourceTip);
      pushLog(`fast-forward: ${currentBranch} → ${sourceTip}`);
      return;
    }
    const id = `c${idCounter.current++}`;
    const mergeCommit = {
      id,
      parents: [targetTip, sourceTip],
      message: `merge ${source} into ${currentBranch}`,
      ts: idCounter.current,
      lane: getCommit(targetTip)?.lane || 0,
    };
    setCommits((prev) => [...prev, mergeCommit]);
    setBranches((prev) => ({ ...prev, [currentBranch]: id }));
    setSelectedCommit(id);
    pushLog(`merge-commit ${id}: ${source} ▶ ${currentBranch}`);
  };

  const layout = useMemo(() => {
    const laneWidth = 150;
    const rowHeight = 90;
    const ordered = [...commits].sort((a, b) => a.ts - b.ts);
    const pos = new Map();

    ordered.forEach((c) => {
      if (c.parents.length > 1) {
        const p1 = commits.find((x) => x.id === c.parents[1]);
        if (p1 && p1.lane === commits.find((x) => x.id === c.parents)?.lane) {
          p1.lane = (p1.lane || 0) + 1;
        }
      }
    });

    ordered.forEach((c, i) => {
      const x = 120 + (c.lane || 0) * laneWidth;
      const y = 80 + i * rowHeight;
      pos.set(c.id, { x, y });
    });

    return { pos, laneWidth, rowHeight };
  }, [commits]);

  const edgePath = (fromId, toId) => {
    const a = layout.pos.get(fromId);
    const b = layout.pos.get(toId);
    if (!a || !b) return "";
    const dx = (b.x - a.x) * 0.5;
    return `M ${a.x} ${a.y} C ${a.x + dx} ${a.y}, ${b.x - dx} ${b.y}, ${b.x} ${b.y}`;
  };

  const allBranches = Object.keys(branches);
  const totalHeight = Math.max(260, commits.length * 100);

  // --- comment state and UI ---
  const [replyBoxFor, setReplyBoxFor] = useState(null);
  const [editBoxFor, setEditBoxFor] = useState(null);
  const [drafts, setDrafts] = useState({});

  function openReply(commentId) {
    setReplyBoxFor(commentId);
    setEditBoxFor(null);
    setDrafts((d) => ({ ...d, [commentId]: d[commentId] || "" }));
  }
  function openEdit(commentId, currentText) {
    setEditBoxFor(commentId);
    setReplyBoxFor(null);
    setDrafts((d) => ({ ...d, [commentId]: currentText }));
  }
  function onSubmitReply(commitId, parentId) {
    const text = (drafts[parentId] || "").trim();
    if (!text) return;
    addReply(commitId, parentId, text);
    setDrafts((d) => ({ ...d, [parentId]: "" }));
    setReplyBoxFor(null);
  }
  function onSubmitEdit(commitId, commentId) {
    const text = (drafts[commentId] || "").trim();
    if (!text) return;
    editComment(commitId, commentId, text);
    setEditBoxFor(null);
  }

  // --- RENDER ---
  return (
    <div className="relative min-h-screen font-sans">
      {/* Cyber Grid Background */}
      <div className="absolute inset-0 bg-cyber-grid animate-cyber-grid animate-cyber-grid-pulse z-0" />

      {/* Main app content (above the grid) */}
      <div className="relative p-6 space-y-6 max-w-7xl mx-auto z-10">
        <h1 className="text-2xl font-bold text-indigo-400 drop-shadow-[0_0_8px_#67C8FF] mb-2">
          Git Branching & Merging Visualizer
        </h1>
        {/* Top Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <input
              className="p-2 border rounded"
              value={tempRepoName}
              onChange={(e) => setTempRepoName(e.target.value)}
              placeholder="Repository name"
            />
            <button className="px-3 py-2 bg-indigo-600 text-white rounded" onClick={() => setRepoName(tempRepoName)}>
              Set Repo
            </button>
            <span className="text-sm text-cyan-300">Current repo: <b>{repoName}</b></span>
          </div>
          <button className="px-3 py-2 bg-green-600 text-white rounded" onClick={createCommit}>Commit on {currentBranch}</button>
          <button className="px-3 py-2 border rounded text-white" onClick={createBranch}>New Branch from selected</button>
          <button className="px-3 py-2 border rounded text-white" onClick={checkoutBranch}>Checkout…</button>
          <button className="px-3 py-2 border rounded text-white" onClick={mergeIntoCurrent}>Merge into {currentBranch}…</button>
        </div>
        {/* Status */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-cyan-200">
          <span className="px-2 py-1 rounded bg-black/30 border border-cyan-400/40">HEAD → {currentBranch}@{branches[currentBranch]}</span>
          <span className="px-2 py-1 rounded bg-black/30 border border-cyan-400/40">Selected: {selectedCommit}</span>
          <div className="flex items-center gap-2">
            {allBranches.map((b) => (
              <span key={b} className="inline-flex items-center gap-1 px-2 py-1 rounded border border-cyan-400/30">
                <span className="inline-block w-3 h-3 rounded bg-indigo-400" />
                {b}
              </span>
            ))}
          </div>
        </div>
        {/* Graph */}
        <div className="w-full overflow-auto rounded-2xl border bg-black/60 border-cyan-500/20 shadow-lg">
          <svg className="min-w-[760px]" width={900} height={totalHeight}>
            <defs>
              <marker id="arrow" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#67C8FF" />
              </marker>
            </defs>
            {commits.map((c) =>
              c.parents.map((p) => (
                <path
                  key={`${c.id}-${p}`}
                  d={edgePath(c.id, p)}
                  fill="none"
                  stroke="#67C8FF"
                  strokeWidth={2}
                  markerEnd="url(#arrow)"
                  opacity={0.85}
                />
              ))
            )}
            {commits.map((c) => {
              const pos = layout.pos.get(c.id) || { x: 0, y: 0 };
              const isSelected = c.id === selectedCommit;
              const total = countComments(comments[c.id]);
              return (
                <g key={c.id} transform={`translate(${pos.x}, ${pos.y})`}>
                  <circle
                    r={12}
                    fill={isSelected ? "#FDE68A" : "#67C8FF"}
                    stroke={isSelected ? "#CA8A04" : "#111827"}
                    strokeWidth={3}
                    onClick={() => setSelectedCommit(c.id)}
                    cursor="pointer"
                    style={{ filter: isSelected ? "drop-shadow(0 0 10px #F59E0B)" : "drop-shadow(0 0 6px #67C8FF99)" }}
                  />
                  <text x={18} y={5} fontSize={13} fill="#67C8FF">{c.id} — {c.message}</text>
                  {total > 0 && (
                    <g transform="translate(0, -22)" style={{ pointerEvents: "none" }}>
                      <rect x={-10} y={-10} width={28} height={18} rx={9} fill="#F59E0B" />
                      <text x={4} y={3} fontSize={12} textAnchor="middle" fill="#fff">{total}</text>
                    </g>
                  )}
                </g>
              );
            })}
            {(() => {
              const tip = branches[currentBranch];
              const pos = layout.pos.get(tip);
              if (!pos) return null;
              return (
                <g transform={`translate(${pos.x - 60}, ${pos.y - 28})`}>
                  <rect width={50} height={18} rx={5} fill="#67C8FF" />
                  <text x={6} y={12} fontSize={12} fill="#fff">HEAD</text>
                </g>
              );
            })()}
          </svg>
        </div>
        {/* Comments Panel & Workflow Log */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded bg-black/60 border-cyan-400/30 p-4">
            <h2 className="text-lg font-semibold text-cyan-300 mb-2">Comments on {selectedCommit}</h2>
            <div className="space-y-3">
              {(comments[selectedCommit] || []).map((c) => (
                <CommentNode
                  key={c.id}
                  commitId={selectedCommit}
                  node={c}
                  onReply={openReply}
                  onEdit={openEdit}
                  onDelete={(id) => deleteComment(selectedCommit, id)}
                  drafts={drafts}
                  setDrafts={setDrafts}
                  replyBoxFor={replyBoxFor}
                  editBoxFor={editBoxFor}
                  onSubmitReply={onSubmitReply}
                  onSubmitEdit={onSubmitEdit}
                />
              ))}
            </div>
            {/* Add root comment */}
            <div className="mt-4">
              <textarea
                className="w-full border rounded p-2 text-sm bg-black/70 text-white border-cyan-400/30"
                rows={2}
                value={newRootComment}
                placeholder="Add a new comment…"
                onChange={(e) => setNewRootComment(e.target.value)}
              />
              <button
                className="mt-2 px-3 py-2 bg-cyan-500 text-white rounded"
                onClick={() => {
                  if (!newRootComment.trim()) return;
                  addRootComment(selectedCommit, newRootComment);
                  setNewRootComment("");
                }}
              >
                Add Comment
              </button>
            </div>
          </div>
          <div className="border rounded bg-black/50 border-cyan-400/30 p-4">
            <h2 className="text-lg font-semibold text-cyan-300 mb-2">Workflow Log</h2>
            <ul className="text-sm list-disc pl-5 space-y-1 text-cyan-200">
              {log.map((l, i) => (
                <li key={i} className="font-mono">{l}</li>
              ))}
            </ul>
          </div>
        </div>
        {/* Tips */}
        <div className="text-sm text-cyan-200 mt-3">
          <p>
            Tips: Click any commit to select it. Use the controls to create commits/branches/merges. Add comments to the selected commit. Each comment supports replies, edit, and delete. Badges on nodes show the total number of comments in that commit's thread.
          </p>
        </div>
      </div>
    </div>
  );
}

function CommentNode({
  commitId,
  node,
  onReply,
  onEdit,
  onDelete,
  drafts,
  setDrafts,
  replyBoxFor,
  editBoxFor,
  onSubmitReply,
  onSubmitEdit,
}) {
  const [showChildren, setShowChildren] = useState(true);

  const startReply = () => onReply(node.id);
  const startEdit = () => onEdit(node.id, node.text);
  const submitReply = () => onSubmitReply(commitId, node.id);
  const submitEdit = () => onSubmitEdit(commitId, node.id);

  return (
    <div className="border rounded p-2 bg-black/40 border-cyan-400/30">
      <div className="flex items-start gap-2">
        <div className="w-8 h-8 rounded-full bg-cyan-900 flex items-center justify-center text-xs text-cyan-300">
          {(node.author || "Y").slice(0, 1).toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 text-xs text-cyan-200">
            <span className="font-semibold text-cyan-100">{node.author || "you"}</span>
            <span>•</span>
            <time>{new Date(node.createdAt).toLocaleString()}</time>
          </div>
          {editBoxFor === node.id ? (
            <div className="mt-1">
              <textarea
                className="w-full border rounded p-2 text-sm bg-black/70 text-white border-cyan-400/20"
                rows={2}
                value={drafts[node.id] || ""}
                onChange={(e) => setDrafts((d) => ({ ...d, [node.id]: e.target.value }))}
              />
              <div className="mt-1 flex gap-2">
                <button className="px-2 py-1 bg-cyan-500 text-white rounded text-xs" onClick={submitEdit}>
                  Save
                </button>
                <button
                  className="px-2 py-1 border rounded text-xs"
                  onClick={() => setDrafts((d) => ({ ...d, [node.id]: node.text }))}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-1 text-sm whitespace-pre-wrap">{node.text}</p>
          )}
          <div className="mt-1 flex items-center gap-3 text-xs text-cyan-300">
            <button className="hover:underline" onClick={startReply}>
              Reply
            </button>
            <button className="hover:underline" onClick={startEdit}>
              Edit
            </button>
            <button className="hover:underline text-red-400" onClick={() => onDelete(node.id)}>
              Delete
            </button>
            {node.replies && node.replies.length > 0 && (
              <button className="hover:underline text-cyan-400" onClick={() => setShowChildren((s) => !s)}>
                {showChildren ? "Hide" : "Show"} {node.replies.length} repl{node.replies.length === 1 ? "y" : "ies"}
              </button>
            )}
          </div>
          {/* Reply box */}
          {replyBoxFor === node.id && (
            <div className="mt-2">
              <textarea
                className="w-full border rounded p-2 text-sm bg-black/60 text-white border-cyan-400/20"
                rows={2}
                value={drafts[node.id] || ""}
                onChange={(e) => setDrafts((d) => ({ ...d, [node.id]: e.target.value }))}
                placeholder="Write a reply…"
              />
              <div className="mt-1 flex gap-2">
                <button className="px-2 py-1 bg-cyan-500 text-white rounded text-xs" onClick={submitReply}>
                  Reply
                </button>
                <button
                  className="px-2 py-1 border rounded text-xs"
                  onClick={() => setDrafts((d) => ({ ...d, [node.id]: "" }))}
                >
                  Clear
                </button>
              </div>
            </div>
          )}
          {/* Children */}
          {showChildren && (node.replies || []).length > 0 && (
            <div className="mt-2 pl-4 border-l-2 border-cyan-600 space-y-2">
              {node.replies.map((r) => (
                <CommentNode
                  key={r.id}
                  commitId={commitId}
                  node={r}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  drafts={drafts}
                  setDrafts={setDrafts}
                  replyBoxFor={replyBoxFor}
                  editBoxFor={editBoxFor}
                  onSubmitReply={onSubmitReply}
                  onSubmitEdit={onSubmitEdit}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

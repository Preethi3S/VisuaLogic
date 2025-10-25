import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * ClusteringFlowInteractive — Full viewport cyber grid background applied.
 */
const WIDTH = 720;
const HEIGHT = 420;

// Utility: seeded RNG for reproducibility
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function generatePoints(n = 60, seed = 42) {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, (_, i) => ({
    id: i,
    x: rnd() * (WIDTH - 40) + 20,
    y: rnd() * (HEIGHT - 40) + 20,
    cluster: null,
    visited: false,
    type: "unassigned", // for DBSCAN: 'core' | 'border' | 'noise'
  }));
}
// Distance metrics
const dist = {
  euclidean: (a, b) => Math.hypot(a.x - b.x, a.y - b.y),
  manhattan: (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y),
  cosine: (a, b) => {
    const dot = a.x * b.x + a.y * b.y;
    const na = Math.hypot(a.x, a.y) || 1e-9;
    const nb = Math.hypot(b.x, b.y) || 1e-9;
    return 1 - dot / (na * nb);
  },
};
// Helpers
const meanPoint = (pts) => ({
  x: pts.reduce((s, p) => s + p.x, 0) / pts.length,
  y: pts.reduce((s, p) => s + p.y, 0) / pts.length,
});
const medianPoint = (pts) => {
  const xs = [...pts.map((p) => p.x)].sort((a, b) => a - b);
  const ys = [...pts.map((p) => p.y)].sort((a, b) => a - b);
  const mid = Math.floor(xs.length / 2);
  return { x: xs[mid], y: ys[mid] };
};
const medoidPoint = (pts, metric) => {
  let best = pts[0];
  let bestSum = Infinity;
  for (const c of pts) {
    const s = pts.reduce((acc, p) => acc + metric(c, p), 0);
    if (s < bestSum) {
      bestSum = s;
      best = c;
    }
  }
  return { x: best.x, y: best.y };
};
const sphericalCenter = (pts) => {
  let mx = 0, my = 0;
  let avgR = 0;
  for (const p of pts) {
    mx += p.x;
    my += p.y;
    avgR += Math.hypot(p.x, p.y);
  }
  mx /= pts.length;
  my /= pts.length;
  avgR /= pts.length;
  const norm = Math.hypot(mx, my) || 1e-9;
  const ux = mx / norm;
  const uy = my / norm;
  return { x: ux * avgR, y: uy * avgR };
};
const COLORS = [
  "#4B6CB7",
  "#67C8FF",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#14B8A6",
  "#A855F7",
];
// ---------- Center-based step engines ----------
function assignPoints(points, centers, metricFn) {
  for (const p of points) {
    let best = 0;
    let bestD = Infinity;
    centers.forEach((c, i) => {
      const d = metricFn(p, c);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    p.cluster = best;
  }
}
function updateCenters(points, centers, mode, metricFn) {
  let moved = 0;
  const next = centers.map((c, i) => {
    const clusterPts = points.filter((p) => p.cluster === i);
    if (!clusterPts.length) return c;
    let updated;
    if (mode === "kmeans") updated = meanPoint(clusterPts);
    else if (mode === "kmedians") updated = medianPoint(clusterPts);
    else if (mode === "kmedoids") updated = medoidPoint(clusterPts, metricFn);
    else if (mode === "spherical") updated = sphericalCenter(clusterPts);
    else updated = c;
    moved += Math.hypot(updated.x - c.x, updated.y - c.y);
    return updated;
  });
  return { next, moved };
}
// ---------- DBSCAN step engine ----------
function createDbscanState(eps, minPts) {
  return {
    i: 0,
    clusterId: 0,
    queue: [],
    status: "scanning",
    eps,
    minPts,
  };
}
function dbscanStep(points, db, metricFn) {
  const neighborsOf = (p) => points.filter((q) => p !== q && metricFn(p, q) <= db.eps);
  if (db.status === "done") return { db, narration: "DBSCAN complete." };
  if (db.status === "scanning") {
    while (db.i < points.length && points[db.i].visited) db.i++;
    if (db.i >= points.length) {
      db.status = "done";
      return { db, narration: "DBSCAN complete." };
    }
    const p = points[db.i];
    p.visited = true;
    const neigh = neighborsOf(p);
    if (neigh.length + 1 < db.minPts) {
      p.type = "noise";
      const narration = `Point ${db.i} has ${neigh.length} neighbors < minPts, mark as noise.`;
      db.i++;
      return { db, narration };
    } else {
      const cid = db.clusterId++;
      p.cluster = cid;
      p.type = "core";
      db.queue = [...neigh];
      db.status = "expanding";
      const narration = `Point ${db.i} is core (neighbors=${neigh.length}). Start cluster C${cid} and expand.`;
      return { db, narration };
    }
  }
  if (db.status === "expanding") {
    if (db.queue.length === 0) {
      db.status = "scanning";
      return { db, narration: "Cluster expansion finished. Resume scanning." };
    }
    const n = db.queue.shift();
    if (!n.visited) {
      n.visited = true;
      const nNeigh = points.filter((q) => q !== n && metricFn(n, q) <= db.eps);
      if (nNeigh.length + 1 >= db.minPts) {
        n.type = "core";
        const set = new Set(db.queue);
        for (const q of nNeigh) if (!set.has(q)) db.queue.push(q);
      } else {
        n.type = n.type === "core" ? "core" : "border";
      }
    }
    if (n.cluster == null) n.cluster = db.clusterId - 1;
    const narration = `Expanding cluster C${db.clusterId - 1}: processed a neighbor; queue size = ${db.queue.length}.`;
    return { db, narration };
  }
  return { db, narration: "" };
}

export default function ClusteringFlowInteractive() {
  // UI state
  const [algorithm, setAlgorithm] = useState("kmeans");
  const [k, setK] = useState(3);
  const [nPoints, setNPoints] = useState(60);
  const [seed, setSeed] = useState(42);
  const [metricChoice, setMetricChoice] = useState("euclidean");
  const [eps, setEps] = useState(40);
  const [minPts, setMinPts] = useState(4);
  const [speedMs, setSpeedMs] = useState(900);
  const [clickAdd, setClickAdd] = useState(true);

  // Data + algorithm state
  const [points, setPoints] = useState(() => generatePoints(nPoints, seed));
  const [centers, setCenters] = useState(() =>
    Array.from({ length: 3 }, () => ({
      x: Math.random() * (WIDTH - 40) + 20,
      y: Math.random() * (HEIGHT - 40) + 20,
    }))
  );
  const [phase, setPhase] = useState("assign");
  const [stepCount, setStepCount] = useState(0);
  const [narration, setNarration] = useState("Pick an algorithm and press Step or Play.");
  const [autoPlay, setAutoPlay] = useState(false);
  const [dbState, setDbState] = useState(() => createDbscanState(eps, minPts));

  const metricFn = useMemo(() => {
    if (algorithm === "spherical") return dist.cosine;
    if (algorithm === "kmedians") return dist.manhattan;
    return metricChoice === "manhattan" ? dist.manhattan : dist.euclidean;
  }, [algorithm, metricChoice]);

  useEffect(() => {
    if (algorithm === "dbscan") return;
    setCenters((prev) => {
      const next = [...prev];
      while (next.length < k)
        next.push({ x: Math.random() * (WIDTH - 40) + 20, y: Math.random() * (HEIGHT - 40) + 20 });
      while (next.length > k) next.pop();
      return next;
    });
  }, [k, algorithm]);

  useEffect(() => {
    resetAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [algorithm]);

  function resetAll() {
    setAutoPlay(false);
    const pts = generatePoints(nPoints, seed).map((p) => ({ ...p }));
    setPoints(pts);
    setPhase(algorithm === "dbscan" ? "scanning" : "assign");
    setStepCount(0);
    setNarration("Algorithm reset. Press Step or Play.");
    if (algorithm === "dbscan") {
      setDbState(createDbscanState(eps, minPts));
    } else {
      const c = Array.from({ length: k }, () => ({
        x: Math.random() * (WIDTH - 40) + 20,
        y: Math.random() * (HEIGHT - 40) + 20,
      }));
      setCenters(c);
    }
  }
  function reseedAndGenerate() {
    setAutoPlay(false);
    const pts = generatePoints(nPoints, seed).map((p) => ({ ...p }));
    setPoints(pts);
    if (algorithm === "dbscan") setDbState(createDbscanState(eps, minPts));
  }
  // ---------- Step execution ----------
  function stepOnce() {
    if (algorithm === "dbscan") {
      const clone = points.map((p) => ({ ...p }));
      const nextDb = { ...dbState };
      const { db, narration: msg } = dbscanStep(clone, nextDb, dist.euclidean);
      setPoints(clone);
      setDbState({ ...db });
      setNarration(msg);
      if (db.status === "done") setPhase("done");
      setStepCount((s) => s + 1);
      return;
    }
    if (phase === "done") return;
    const pts = points.map((p) => ({ ...p }));
    const ctrs = centers.map((c) => ({ ...c }));
    if (phase === "assign") {
      assignPoints(pts, ctrs, metricFn);
      setNarration("Assignment: each point chooses the nearest center by the selected distance metric.");
      setPhase("update");
    } else if (phase === "update") {
      const { next, moved } = updateCenters(pts, ctrs, algorithm, metricFn);
      setNarration(
        `Update: recompute centers (${algorithm}). Total movement = ${moved.toFixed(2)} px.`
      );
      setCenters(next);
      setPhase("check");
    } else if (phase === "check") {
      const { next, moved } = updateCenters(pts, centers, algorithm, metricFn);
      if (moved < 1e-2 || stepCount > 200) {
        setNarration("Converged: center movement below threshold (or max steps reached). Done.");
        setPhase("done");
      } else {
        setNarration("Not yet converged: continue to next assignment.");
        setPhase("assign");
      }
    }
    setPoints(pts);
    setStepCount((s) => s + 1);
  }
  useEffect(() => {
    if (!autoPlay || phase === "done") return;
    const t = setInterval(stepOnce, speedMs);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay, phase, speedMs, points, centers, dbState, algorithm, metricFn]);
  // Click to add points
  function handleSvgClick(e) {
    if (!clickAdd) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = points.length;
    const np = { id, x, y, cluster: null, visited: false, type: "unassigned" };
    const next = [...points, np];
    setPoints(next);
  }
  // UI controls - derived flags
  const isCenterBased = algorithm !== "dbscan";
  const showMetricChoice = isCenterBased && algorithm !== "spherical";

  // --- Cyber grid full background here ---
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
      <div className="w-full flex flex-col gap-4 text-sm" style={{
        color: "#1F2937",
        maxWidth: 1100,
        margin: "36px auto",
        background: "rgba(250,252,255,0.96)",
        borderRadius: 18,
        boxShadow: "0 0 40px #67C8FF22",
        padding: 32,
      }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold" style={{ color: "#4B6CB7", textShadow: "0 4px 18px #B0CBF755" }}>Clustering – Step-by-Step Interactive</h2>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1 rounded-xl border shadow-sm"
              onClick={() => setAutoPlay((p) => !p)}
              title="Play/Pause"
              style={{ background: autoPlay ? "#67C8FF" : "#F8FAFC", fontWeight: 700, color: autoPlay ? "#fff" : "#1F2937" }}
            >
              {autoPlay ? "Pause" : "Play"}
            </button>
            <button className="px-3 py-1 rounded-xl border shadow-sm" onClick={stepOnce}>
              Step ▶
            </button>
            <button className="px-3 py-1 rounded-xl border shadow-sm" onClick={resetAll}>
              Reset
            </button>
          </div>
        </div>
        {/* Controls */}
        <div className="grid md:grid-cols-3 gap-3 p-3 rounded-2xl border bg-white shadow-sm">
          <div className="flex flex-col gap-2">
            <label className="font-medium">Algorithm</label>
            <select
              className="border rounded-lg px-2 py-1"
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
            >
              <option value="kmeans">K-Means (Euclidean)</option>
              <option value="kmedians">K-Medians (Manhattan)</option>
              <option value="spherical">Spherical K-Means (Cosine)</option>
              <option value="kmedoids">K-Medoids (Euclidean)</option>
              <option value="dbscan">DBSCAN (Euclidean)</option>
            </select>
            {showMetricChoice && (
              <>
                <label className="font-medium mt-2">Distance Metric</label>
                <select
                  className="border rounded-lg px-2 py-1"
                  value={metricChoice}
                  onChange={(e) => setMetricChoice(e.target.value)}
                >
                  <option value="euclidean">Euclidean</option>
                  <option value="manhattan">Manhattan</option>
                </select>
              </>
            )}
            {isCenterBased && (
              <>
                <label className="font-medium mt-2">K (clusters)</label>
                <input
                  type="range"
                  min={2}
                  max={6}
                  value={k}
                  onChange={(e) => setK(parseInt(e.target.value))}
                />
                <div>K = {k}</div>
              </>
            )}
            {algorithm === "dbscan" && (
              <>
                <label className="font-medium mt-2">DBSCAN ε (radius)</label>
                <input
                  type="range"
                  min={10}
                  max={120}
                  value={eps}
                  onChange={(e) => setEps(parseInt(e.target.value))}
                />
                <div>ε = {eps}px</div>
                <label className="font-medium mt-2">DBSCAN minPts</label>
                <input
                  type="range"
                  min={2}
                  max={8}
                  value={minPts}
                  onChange={(e) => setMinPts(parseInt(e.target.value))}
                />
                <div>minPts = {minPts}</div>
              </>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium">Points</label>
            <input
              type="range"
              min={10}
              max={200}
              value={nPoints}
              onChange={(e) => setNPoints(parseInt(e.target.value))}
            />
            <div>count = {nPoints}</div>
            <label className="font-medium mt-2">Seed</label>
            <input
              className="border rounded-lg px-2 py-1"
              type="number"
              value={seed}
              onChange={(e) => setSeed(parseInt(e.target.value || 0))}
            />
            <div className="flex items-center gap-2 mt-2">
              <button className="px-3 py-1 rounded-xl border shadow-sm" onClick={reseedAndGenerate}>
                Generate Data
              </button>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={clickAdd} onChange={(e) => setClickAdd(e.target.checked)} />
                Click to add points
              </label>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium">Autoplay speed</label>
            <input
              type="range"
              min={200}
              max={2000}
              step={50}
              value={speedMs}
              onChange={(e) => setSpeedMs(parseInt(e.target.value))}
            />
            <div>{speedMs} ms / step</div>
            <div className="mt-4 p-2 rounded-xl bg-gray-50 border text-xs leading-relaxed">
              <div><b>Legend</b></div>
              <div>• Circles = points; squares = centers/medoids</div>
              <div>• Colors = cluster IDs</div>
              <div>• DBSCAN: gray = noise; core/border shown in cluster color</div>
            </div>
          </div>
        </div>
        {/* Canvas + narration */}
        <div className="grid md:grid-cols-3 gap-3">
          <div className="md:col-span-2 p-3 rounded-2xl border bg-white shadow-sm">
            <svg
              width={WIDTH}
              height={HEIGHT}
              style={{ display: "block", width: "100%", height: "auto", cursor: clickAdd ? "crosshair" : "default" }}
              onClick={handleSvgClick}
            >
              {/* Points */}
              {points.map((p) => (
                <motion.circle
                  key={p.id}
                  cx={p.x}
                  cy={p.y}
                  r={6}
                  fill={
                    algorithm === "dbscan"
                      ? p.type === "noise"
                        ? "#9CA3AF"
                        : COLORS[(p.cluster ?? 0) % COLORS.length]
                      : p.cluster != null
                        ? COLORS[p.cluster % COLORS.length]
                        : "#6B7280"
                  }
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.25 }}
                />
              ))}
              {/* Centers for center-based methods */}
              {algorithm !== "dbscan" &&
                centers.map((c, i) => (
                  <motion.rect
                    key={`c-${i}`}
                    x={c.x - 8}
                    y={c.y - 8}
                    width={16}
                    height={16}
                    fill={COLORS[i % COLORS.length]}
                    stroke="#111827"
                    strokeWidth={1}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  />
                ))}
            </svg>
          </div>
          <div className="p-3 rounded-2xl border bg-white shadow-sm flex flex-col gap-2">
            <div className="text-sm opacity-70">Step #{stepCount}</div>
            <div className="font-medium">Flow</div>
            <AnimatePresence mode="popLayout">
              <motion.div
                key={narration}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="text-sm leading-relaxed"
              >
                {narration}
              </motion.div>
            </AnimatePresence>
            <div className="mt-2 text-xs text-gray-500">
              {algorithm !== "dbscan" ? (
                <>
                  {phase !== "done" ? (
                    <div>
                      <div><b>Phases</b>: Assign → Update → Check → (repeat)</div>
                      <div>
                        Metric: {algorithm === "spherical" ? "Cosine (direction)" : metricChoice === "manhattan" ? "Manhattan (L1)" : "Euclidean (L2)"}
                      </div>
                      <div>Next phase: <code>{phase}</code></div>
                    </div>
                  ) : (
                    <div>Converged. You can Reset or modify K/points.</div>
                  )}
                </>
              ) : (
                <>
                  <div><b>Phases</b>: Scanning unvisited points → Expand cluster (queue) → Repeat</div>
                  <div>ε = {eps}px, minPts = {minPts}</div>
                  <div>Status: <code>{dbState.status}</code>; C = {dbState.clusterId}; Queue = {dbState.queue.length}</div>
                </>
              )}
            </div>
          </div>
        </div>
        {/* Footer actions and tips */}
        <div className="text-xs text-gray-500 mt-5">
          Tips: Adjust K or DBSCAN parameters, regenerate data with a new seed, or click on the canvas to add points.
          For K-Medoids, Euclidean metric is used. Spherical K-Means uses cosine and updates centers to the mean direction.
        </div>
      </div>
    </div>
  );
}

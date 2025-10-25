import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const colors = {
  primary: "#4B6CB7",
  accent: "#67C8FF",
  background: "#0A0F1F", // cyber grid base color
  text: "#E0E7FF", // cyber theme text color
  boxBg: "#15203F", // cyber panel background
  error: "#F87171",
  success: "#10B981",
  warn: "#F59E0B",
  wait: "#FBBF24",
  deadlock: "#EF4444",
};

// Helper to get transaction by id
const getTxById = (transactions, id) => transactions.find((t) => t.id === id);

export default function TransactionSimulator() {
  const [transactions, setTransactions] = useState([
    { id: 1, name: "T1", committed: false, aborted: false },
  ]);
  const [currentTx, setCurrentTx] = useState(1);
  const [opType, setOpType] = useState("R");
  const [opData, setOpData] = useState("");
  const [schedule, setSchedule] = useState([]);
  const [locks, setLocks] = useState({}); // dataItem -> txId holding write lock
  const [waits, setWaits] = useState([]); // { txId, waitingForTxId, data }
  const [deadlockTxs, setDeadlockTxs] = useState(new Set());
  const [error, setError] = useState("");

  const getTx = (id) => getTxById(transactions, id);

  // Add new transaction
  const addTransaction = () => {
    const newId = transactions.length + 1;
    setTransactions([
      ...transactions,
      { id: newId, name: `T${newId}`, committed: false, aborted: false },
    ]);
    setCurrentTx(newId);
  };

  // Add operation with lock/wait logic
  const addOperation = () => {
    if (!opData.trim()) {
      setError("Please enter a data item name (e.g., x, y, z)");
      return;
    }
    setError("");

    const tx = getTx(currentTx);
    if (!tx || tx.committed || tx.aborted) {
      setError("Selected transaction is committed or aborted, select another.");
      return;
    }

    if (opType === "W") {
      if (locks[opData] && locks[opData] !== currentTx) {
        // Can't acquire lock, add to wait queue
        setWaits((prev) => [
          ...prev,
          { txId: currentTx, waitingForTxId: locks[opData], data: opData },
        ]);
        setSchedule((prev) => [
          ...prev,
          { txId: currentTx, type: opType, data: opData, status: "wait" },
        ]);
        setOpData("");
        return;
      } else {
        // Acquire lock for write
        setLocks((prev) => ({ ...prev, [opData]: currentTx }));
      }
    }

    // Reads assumed no lock needed, just add operation
    setSchedule((prev) => [
      ...prev,
      { txId: currentTx, type: opType, data: opData, status: "ok" },
    ]);
    setOpData("");
  };

  // Commit transaction releases locks and wakes waiters
  const commitTransaction = (id) => {
    setTransactions((prev) =>
      prev.map((tx) => (tx.id === id ? { ...tx, committed: true, aborted: false } : tx))
    );

    // Release locks held by this tx
    setLocks((prev) => {
      const newLocks = { ...prev };
      for (const data in newLocks) {
        if (newLocks[data] === id) delete newLocks[data];
      }
      return newLocks;
    });

    // Remove waits where waiting tx or waited tx is this tx
    setWaits((prev) => prev.filter((w) => w.txId !== id && w.waitingForTxId !== id));

    // Remove wait status from operations that were waiting for this tx
    setSchedule((prev) =>
      prev.map((op) =>
        op.status === "wait" && waits.some((w) => w.txId === op.txId && w.waitingForTxId === id)
          ? { ...op, status: "ok" }
          : op
      )
    );
  };

  // Abort transaction releases locks, clears ops and waits
  const abortTransaction = (id) => {
    setTransactions((prev) =>
      prev.map((tx) => (tx.id === id ? { ...tx, aborted: true, committed: false } : tx))
    );
    setSchedule((prev) => prev.filter((op) => op.txId !== id));

    setLocks((prev) => {
      const newLocks = { ...prev };
      for (const data in newLocks) {
        if (newLocks[data] === id) delete newLocks[data];
      }
      return newLocks;
    });

    setWaits((prev) => prev.filter((w) => w.txId !== id && w.waitingForTxId !== id));
  };

  // Build wait-for graph from waits and detect cycles (deadlocks)
  const detectDeadlocks = () => {
    const graph = {};
    waits.forEach(({ txId, waitingForTxId }) => {
      if (!graph[txId]) graph[txId] = [];
      graph[txId].push(waitingForTxId);
    });

    const visited = {};
    const recStack = {};
    const deadlocked = new Set();

    const dfs = (txId) => {
      if (!visited[txId]) {
        visited[txId] = true;
        recStack[txId] = true;
        const neighbors = graph[txId] || [];
        for (const neigh of neighbors) {
          if (!visited[neigh] && dfs(neigh)) {
            deadlocked.add(txId);
            return true;
          } else if (recStack[neigh]) {
            deadlocked.add(txId);
            return true;
          }
        }
      }
      recStack[txId] = false;
      return false;
    };

    Object.keys(graph).forEach(dfs);
    setDeadlockTxs(deadlocked);
  };

  // Recompute deadlocks when waits change
  useEffect(() => {
    detectDeadlocks();
  }, [waits]);

  // Animation variants for locks/waits
  const lockVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.3 } },
  };

  return (
    <div
      className="bg-cyber-grid animate-cyber-grid animate-cyber-grid-pulse"
      style={{
        maxWidth: 1100,
        margin: "40px auto",
        padding: 32,
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        backgroundColor: colors.background,
        color: colors.text,
        borderRadius: 20,
        boxShadow: "0 0 48px 0 rgba(70,180,255,0.25)",
        userSelect: "text",
      }}
    >
      <h1
        style={{
          color: colors.primary,
          fontSize: 28,
          fontWeight: "900",
          marginBottom: 24,
          textAlign: "center",
          letterSpacing: 1,
        }}
      >
        Transaction Simulator with Locks, Wait Queue & Deadlock Detection
      </h1>

      {/* Transaction selector */}
      <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 16 }}>
        <label style={{ fontWeight: 600, fontSize: 16 }}>
          Select Transaction:&nbsp;
          <select
            value={currentTx}
            onChange={(e) => setCurrentTx(Number(e.target.value))}
            style={{
              padding: 8,
              fontSize: 16,
              borderRadius: 8,
              border: `1.5px solid ${colors.accent}`,
              backgroundColor: colors.boxBg,
              color: colors.text,
              cursor: "pointer",
              minWidth: 140,
            }}
          >
            {transactions.map((tx) => (
              <option key={tx.id} value={tx.id}>
                {tx.name}{" "}
                {tx.committed
                  ? "(Committed)"
                  : tx.aborted
                  ? "(Aborted)"
                  : ""}
              </option>
            ))}
          </select>
        </label>
        <button
          onClick={addTransaction}
          style={{
            backgroundColor: colors.accent,
            border: "none",
            padding: "9px 18px",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 700,
            fontSize: 16,
            color: "#0a0f1f",
            boxShadow: `0 0 12px ${colors.accent}aa`,
          }}
          aria-label="Add new transaction"
        >
          Add Transaction
        </button>
      </div>

      {/* Operation input */}
      <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 16 }}>
        <label style={{ fontWeight: 600, fontSize: 16 }}>
          Operation:
          <select
            value={opType}
            onChange={(e) => setOpType(e.target.value)}
            style={{
              marginLeft: 12,
              padding: 8,
              fontSize: 16,
              borderRadius: 8,
              border: `1.5px solid ${colors.accent}`,
              backgroundColor: colors.boxBg,
              color: colors.text,
              cursor: getTx(currentTx)?.committed || getTx(currentTx)?.aborted ? "not-allowed" : "pointer",
              minWidth: 100,
            }}
            disabled={getTx(currentTx)?.committed || getTx(currentTx)?.aborted}
          >
            <option value="R">Read (R)</option>
            <option value="W">Write (W)</option>
          </select>
        </label>
        <input
          type="text"
          placeholder="Data item (e.g., x)"
          value={opData}
          onChange={(e) => setOpData(e.target.value.toLowerCase())}
          style={{
            padding: 8,
            fontSize: 16,
            width: 140,
            borderRadius: 8,
            border: `1.5px solid ${colors.accent}`,
            backgroundColor: colors.boxBg,
            color: colors.text,
            outlineColor: colors.accent,
          }}
          disabled={getTx(currentTx)?.committed || getTx(currentTx)?.aborted}
          aria-label="Data item for operation"
        />
        <button
          onClick={addOperation}
          disabled={getTx(currentTx)?.committed || getTx(currentTx)?.aborted}
          style={{
            backgroundColor: colors.primary,
            border: "none",
            padding: "9px 20px",
            borderRadius: 8,
            cursor: getTx(currentTx)?.committed || getTx(currentTx)?.aborted ? "not-allowed" : "pointer",
            fontWeight: 700,
            color: "#fff",
            boxShadow: `0 0 12px ${colors.primary}aa`,
          }}
          aria-label="Add operation"
        >
          Add Operation
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div
          role="alert"
          style={{
            backgroundColor: colors.error,
            color: "#fff",
            padding: 14,
            borderRadius: 8,
            fontWeight: 700,
            marginBottom: 24,
            textAlign: "center",
          }}
        >
          {error}
        </div>
      )}

      {/* Locks held */}
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ color: colors.accent, fontWeight: 800, marginBottom: 14 }}>Locks Held (Write Locks)</h3>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <AnimatePresence>
            {Object.entries(locks).map(([data, txId]) => (
              <motion.div
                key={data}
                variants={lockVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  backgroundColor: colors.primary,
                  color: "#fff",
                  fontWeight: 700,
                  minWidth: 68,
                  textAlign: "center",
                  boxShadow: `0 0 10px ${colors.primary}bb`,
                  userSelect: "none",
                }}
                title={`Data item "${data}" locked by T${txId}`}
              >
                {data} 🔒 T{txId}
              </motion.div>
            ))}
          </AnimatePresence>
          {Object.keys(locks).length === 0 && (
            <div style={{ fontStyle: "italic", color: colors.text }}>No locks held</div>
          )}
        </div>
      </div>

      {/* Wait queue */}
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ color: colors.accent, fontWeight: 800, marginBottom: 14 }}>Wait Queue</h3>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <AnimatePresence>
            {waits.map(({ txId, waitingForTxId, data }, idx) => (
              <motion.div
                key={idx}
                variants={lockVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  backgroundColor: colors.warn,
                  color: "#000",
                  fontWeight: 700,
                  minWidth: 160,
                  textAlign: "center",
                  boxShadow: `0 0 10px ${colors.warn}cc`,
                  userSelect: "none",
                }}
                title={`T${txId} waits for T${waitingForTxId} on data "${data}"`}
              >
                T{txId} waits for T{waitingForTxId} on {data}
              </motion.div>
            ))}
          </AnimatePresence>
          {waits.length === 0 && (
            <div style={{ fontStyle: "italic", color: colors.text }}>No waiting transactions</div>
          )}
        </div>
      </div>

      {/* Deadlock warning */}
      {deadlockTxs.size > 0 && (
        <div
          role="alert"
          style={{
            backgroundColor: colors.deadlock,
            color: "#fff",
            padding: 16,
            borderRadius: 8,
            fontWeight: 800,
            marginBottom: 32,
            textAlign: "center",
            boxShadow: `0 0 14px ${colors.deadlock}cc`,
          }}
        >
          ⚠️ Deadlock detected involving transactions:{" "}
          {[...deadlockTxs].map((txId) => `T${txId}`).join(", ")}. Please abort one to resolve.
        </div>
      )}

      {/* Schedule timeline */}
      <div
        style={{
          display: "flex",
          gap: 14,
          overflowX: "auto",
          border: `2px solid ${colors.primary}`,
          borderRadius: 12,
          padding: 16,
          backgroundColor: colors.boxBg,
          boxShadow: `0 0 20px ${colors.primary}88`,
          userSelect: "none",
        }}
        aria-label="Schedule timeline"
      >
        {schedule.length === 0 && (
          <div style={{ fontStyle: "italic", color: colors.text, padding: 12 }}>
            No operations in schedule
          </div>
        )}

        {schedule.map((op, idx) => {
          const tx = getTx(op.txId);
          if (!tx) return null;

          const opColor =
            op.status === "wait"
              ? colors.warn
              : op.type === "R"
              ? colors.accent
              : colors.primary;

          const isDeadlocked = deadlockTxs.has(tx.id);

          return (
            <div
              key={idx}
              title={`${tx.name}: ${op.type}(${op.data}) Status: ${op.status}`}
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                backgroundColor: isDeadlocked ? colors.deadlock : opColor,
                color: "#fff",
                minWidth: 78,
                textAlign: "center",
                fontWeight: 700,
                opacity: tx.committed ? 0.6 : 1,
                border: tx.id === currentTx ? `3px solid ${colors.accent}` : "3px solid transparent",
                boxShadow: isDeadlocked ? `0 0 14px ${colors.deadlock}` : `0 0 12px ${opColor}bb`,
              }}
            >
              <div style={{ fontSize: 15 }}>{tx.name}</div>
              <div style={{ fontSize: 18, letterSpacing: "0.05em" }}>{op.type}({op.data})</div>
              <div style={{ fontSize: 13, marginTop: 6 }}>
                {op.status === "wait" && "⏳ Waiting"}
                {op.status === "ok" && tx.committed && "✔️ Committed"}
                {op.status === "ok" && !tx.committed && "🕒 Pending"}
              </div>
            </div>
          );
        })}
      </div>

      {/* Transactions commit/abort controls */}
      <div style={{ marginTop: 32, display: "flex", gap: 16, flexWrap: "wrap" }}>
        {transactions.map((tx) => (
          <div
            key={tx.id}
            style={{
              flex: "1 1 280px",
              backgroundColor: colors.boxBg,
              border: `2px solid ${colors.primary}`,
              borderRadius: 14,
              padding: "16px 20px",
              boxShadow: `0 0 16px ${colors.primary}55`,
              color: colors.text,
            }}
          >
            <div
              style={{
                fontWeight: 800,
                fontSize: 20,
                color: tx.committed
                  ? colors.success
                  : tx.aborted
                  ? colors.error
                  : colors.primary,
                marginBottom: 8,
                userSelect: "none",
              }}
            >
              {tx.name} {tx.committed ? "(Committed)" : tx.aborted ? "(Aborted)" : ""}
            </div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {!tx.committed && !tx.aborted && (
                <>
                  <button
                    onClick={() => commitTransaction(tx.id)}
                    style={{
                      flex: "1 1 100px",
                      backgroundColor: colors.success,
                      border: "none",
                      padding: "10px 0",
                      borderRadius: 10,
                      cursor: "pointer",
                      color: "#0a0f1f",
                      fontWeight: 700,
                      boxShadow: `0 0 14px ${colors.success}dd`,
                    }}
                  >
                    Commit
                  </button>
                  <button
                    onClick={() => abortTransaction(tx.id)}
                    style={{
                      flex: "1 1 100px",
                      backgroundColor: colors.error,
                      border: "none",
                      padding: "10px 0",
                      borderRadius: 10,
                      cursor: "pointer",
                      color: "#fff",
                      fontWeight: 700,
                      boxShadow: `0 0 14px ${colors.error}dd`,
                    }}
                  >
                    Abort
                  </button>
                </>
              )}
              {(tx.committed || tx.aborted) && (
                <button
                  onClick={() => {
                    setTransactions((prev) =>
                      prev.map((t) =>
                        t.id === tx.id ? { ...t, committed: false, aborted: false } : t
                      )
                    );
                    setSchedule((prev) => prev.filter((op) => op.txId !== tx.id));
                    setLocks((prev) => {
                      const newLocks = { ...prev };
                      for (const data in newLocks) {
                        if (newLocks[data] === tx.id) delete newLocks[data];
                      }
                      return newLocks;
                    });
                    setWaits((prev) =>
                      prev.filter((w) => w.txId !== tx.id && w.waitingForTxId !== tx.id)
                    );
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: colors.accent,
                    border: "none",
                    padding: "10px 0",
                    borderRadius: 10,
                    cursor: "pointer",
                    color: "#0a0f1f",
                    fontWeight: 700,
                    boxShadow: `0 0 14px ${colors.accent}cc`,
                    userSelect: "none",
                  }}
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

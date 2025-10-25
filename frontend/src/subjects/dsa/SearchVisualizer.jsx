import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const BAR_WIDTH = 48;
const BAR_MARGIN = 10;
const MAX_BAR_HEIGHT = 180;
const MIN_BAR_HEIGHT = 24;

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

export default function SearchVisualizer() {
  const [array, setArray] = useState([
    { value: 3, id: "v-0" },
    { value: 6, id: "v-1" },
    { value: 8, id: "v-2" },
    { value: 12, id: "v-3" },
    { value: 14, id: "v-4" },
    { value: 17, id: "v-5" },
    { value: 25, id: "v-6" },
  ]);
  const [inputValue, setInputValue] = useState("3, 6, 8, 12, 14, 17, 25");
  const [searchType, setSearchType] = useState("Linear Search");
  const [target, setTarget] = useState("");
  const [currentIndex, setCurrentIndex] = useState(null);
  const [foundIndex, setFoundIndex] = useState(null);
  const [explanation, setExplanation] = useState("Enter array and target, then start searching.");
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef(false);
  const [speed, setSpeed] = useState(550);
  const [leftIndex, setLeftIndex] = useState(null);
  const [rightIndex, setRightIndex] = useState(null);
  const [midIndex, setMidIndex] = useState(null);

  // Static cyber grid background
  useEffect(() => {
    document.body.classList.add("bg-cyber-grid");
    document.body.classList.remove("animate-cyber-grid");
    return () => document.body.classList.remove("bg-cyber-grid");
  }, []);

  const computeBarHeight = (value) => {
    const absVals = array.length ? array.map((a) => Math.abs(a.value || 0)) : [1];
    const maxAbs = Math.max(1, ...absVals);
    const scale = (MAX_BAR_HEIGHT - 40) / maxAbs;
    const raw = Math.abs(value) * scale;
    const h = Math.max(MIN_BAR_HEIGHT, Math.min(MAX_BAR_HEIGHT, Math.round(raw)));
    return h;
  };

  const parseInputArray = (input) =>
    input
      .trim()
      .split(/[\s,]+/)
      .map((s) => parseInt(s))
      .filter((n) => !Number.isNaN(n));

  const handleArraySubmit = () => {
    if (isSearching) return;
    const parsed = parseInputArray(inputValue);
    if (parsed.length === 0) {
      alert("Please enter at least one valid integer (e.g., 10, 3, 5).");
      return;
    }
    const withIds = parsed.map((value, index) => ({ value, id: `user-${Date.now()}-${index}` }));
    setArray(withIds);
    setCurrentIndex(null);
    setFoundIndex(null);
    setLeftIndex(null);
    setRightIndex(null);
    setMidIndex(null);
    setExplanation("Array loaded. Enter target and start searching.");
  };

  const handleReset = () => {
    if (isSearching) return;
    const defaultArr = [3, 6, 8, 12, 14, 17, 25];
    setArray(defaultArr.map((v, i) => ({ value: v, id: `v-${i}` })));
    setInputValue(defaultArr.join(", "));
    setTarget("");
    setCurrentIndex(null);
    setFoundIndex(null);
    setLeftIndex(null);
    setRightIndex(null);
    setMidIndex(null);
    setIsSearching(false);
    searchRef.current = false;
    setExplanation("Enter array and target, then start searching.");
  };

  const linearSearch = async (arr, tgt) => {
    setExplanation("Linear Search: Checking each element one by one.");
    for (let i = 0; i < arr.length; i++) {
      if (!searchRef.current) break;
      setCurrentIndex(i);
      setExplanation(`Checking element at index ${i}: ${arr[i]}`);
      await sleep(speed);
      if (arr[i] === tgt) {
        setExplanation(`Target found at index ${i}!`);
        setFoundIndex(i);
        setCurrentIndex(null);
        return;
      }
    }
    setExplanation("Target not found in the array.");
    setCurrentIndex(null);
  };

  const binarySearch = async (arr, tgt) => {
    setExplanation(
      "Binary Search: Efficient search on sorted arrays by repeatedly dividing the search interval in half."
    );
    let left = 0;
    let right = arr.length - 1;
    while (left <= right && searchRef.current) {
      const mid = Math.floor((left + right) / 2);
      setLeftIndex(left);
      setRightIndex(right);
      setMidIndex(mid);
      setExplanation(
        `Current range: left = ${left}, right = ${right}. Checking middle element at index ${mid}: ${arr[mid]}`
      );
      await sleep(speed);
      if (arr[mid] === tgt) {
        setExplanation(`Target found at index ${mid}!`);
        setFoundIndex(mid);
        setCurrentIndex(null);
        setLeftIndex(null);
        setRightIndex(null);
        setMidIndex(null);
        return;
      } else if (arr[mid] < tgt) {
        setExplanation(`Target is greater than ${arr[mid]}, moving right.`);
        left = mid + 1;
      } else {
        setExplanation(`Target is less than ${arr[mid]}, moving left.`);
        right = mid - 1;
      }
      await sleep(speed);
    }
    setExplanation("Target not found in the array.");
    setCurrentIndex(null);
    setLeftIndex(null);
    setRightIndex(null);
    setMidIndex(null);
  };

  const startSearch = async () => {
    if (isSearching) return;
    const tgt = parseInt(target);
    if (Number.isNaN(tgt)) {
      alert("Please enter a valid integer target.");
      return;
    }
    searchRef.current = true;
    setIsSearching(true);
    setFoundIndex(null);
    setCurrentIndex(null);
    setLeftIndex(null);
    setRightIndex(null);
    setMidIndex(null);
    setExplanation("Starting search...");
    const values = array.map((a) => a.value);
    if (searchType === "Binary Search") {
      const sortedCheck = [...values].sort((a, b) => a - b).join(",") === values.join(",");
      if (!sortedCheck) {
        alert("Binary Search requires the array to be sorted. Please provide a sorted array.");
        setIsSearching(false);
        return;
      }
      await binarySearch(values, tgt);
    } else {
      await linearSearch(values, tgt);
    }
    setIsSearching(false);
    searchRef.current = false;
  };

  return (
    <div className="relative min-h-screen w-full font-sans">
      {/* Static Cyber Grid Background */}
      <div className="absolute inset-0 bg-cyber-grid bg-fixed z-0" />
      <div
        className="relative z-10"
        style={{
          maxWidth: 950,
          margin: "40px auto",
          padding: 32,
          borderRadius: 18,
          boxShadow: "0 18px 44px rgba(75,108,183,0.16)",
          background: "linear-gradient(120deg, #0f172a 65%, #4B6CB7 120%)",
        }}
      >
        <h1 style={{
          textAlign: "center",
          marginBottom: 22,
          fontWeight: 900,
          fontSize: 28,
          color: "#67C8FF",
          letterSpacing: "0.02em",
          textShadow: "0 2px 18px #67C8FFA0"
        }}>
          Search Algorithm Visualizer
        </h1>

        {/* Input controls */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 24,
            justifyContent: "center"
          }}
        >
          <input
            type="text"
            placeholder="Enter numbers separated by commas or spaces"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isSearching}
            style={{
              flexGrow: 1,
              minWidth: 260,
              maxWidth: 460,
              padding: "12px 16px",
              borderRadius: 16,
              border: "none",
              fontSize: 16,
              outline: "none",
              background: "#212956",
              color: "#dbeafe",
              boxShadow: "0 7px 22px rgba(67,200,255,0.12)",
            }}
          />
          <button
            onClick={handleArraySubmit}
            disabled={isSearching}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-cyan-400 text-white font-bold rounded-lg shadow"
            title="Load array"
          >
            Load Array
          </button>
        </div>

        <div style={{
          marginBottom: 24,
          display: "flex",
          justifyContent: "center",
          gap: 14,
          flexWrap: "wrap"
        }}>
          <select
            value={searchType}
            onChange={e => setSearchType(e.target.value)}
            disabled={isSearching}
            style={{
              minWidth: 180,
              padding: "10px 14px",
              borderRadius: 12,
              border: "none",
              fontSize: 16,
              cursor: isSearching ? "not-allowed" : "pointer",
              boxShadow: "0 5px 16px rgba(0,0,0,0.19)",
              background: "#212956",
              color: "#b4eaff"
            }}
            title="Select search algorithm"
          >
            <option>Linear Search</option>
            <option>Binary Search</option>
          </select>
          <input
            type="number"
            placeholder="Target value"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            disabled={isSearching}
            style={{
              minWidth: 100,
              padding: "12px 16px",
              borderRadius: 12,
              border: "none",
              fontSize: 16,
              outline: "none",
              background: "#212956",
              color: "#dbeafe",
              boxShadow: "0 7px 22px rgba(67,200,255,0.07)",
            }}
            title="Enter target value"
          />
        </div>

        {/* Bars container */}
        <div
          style={{
            height: 220,
            overflowX: "auto",
            borderRadius: 16,
            background: "linear-gradient(110deg,#171923 80%,#182848 120%)",
            marginBottom: 28,
            position: "relative",
            padding: "18px 20px",
            boxShadow: "0 0 42px rgba(67,200,255,0.10)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "flex-start",
            gap: BAR_MARGIN,
            userSelect: "none"
          }}
        >
          {/* Highlight range for Binary Search */}
          {searchType === "Binary Search" && leftIndex !== null && rightIndex !== null && (
            <motion.div
              key="highlightRange"
              layoutId="highlightRange"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.22 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                position: "absolute",
                left: 20 + (BAR_WIDTH + BAR_MARGIN) * leftIndex - 4,
                width: (BAR_WIDTH + BAR_MARGIN) * (rightIndex - leftIndex + 1) - BAR_MARGIN + 8,
                height: 220,
                borderRadius: 16,
                background: "rgba(80,210,255, 0.15)",
                pointerEvents: "none",
                zIndex: 0,
              }}
            />
          )}
          {array.map(({ value, id }, index) => {
            const isCurrent = currentIndex === index;
            const isFound = foundIndex === index;
            const isLeft = searchType === "Binary Search" && index === leftIndex;
            const isRight = searchType === "Binary Search" && index === rightIndex;
            const isMid = searchType === "Binary Search" && index === midIndex;
            const barHeight = computeBarHeight(value);
            const fontSize = Math.max(12, Math.min(20, Math.floor(barHeight / 10)));
            let background = "linear-gradient(180deg,#60a5fa,#3b82f6)";
            let boxShadow = "0 8px 20px rgba(67,200,255,0.24)";
            let color = "#e0f2fe";
            if (isFound) {
              background = "linear-gradient(180deg,#10b981,#059669)";
              boxShadow = "0 12px 32px rgba(5,230,127,0.8)";
              color = "#02111b";
            } else if (isCurrent) {
              background = "linear-gradient(180deg,#fde68a,#fbbf24)";
              boxShadow = "0 12px 28px rgba(252,211,77,0.7)";
              color = "#02111b";
            } else if (isMid) {
              background = "linear-gradient(180deg,#fca5a5,#ef4444)";
              boxShadow = "0 12px 28px rgba(239,68,68,0.7)";
              color = "#fff";
            } else if (isLeft || isRight) {
              background = "linear-gradient(180deg,#a5b4fc,#4338ca)";
              boxShadow = "0 10px 26px rgba(67,56,202,0.46)";
              color = "#dbeafe";
            }
            return (
              <motion.div
                key={id}
                layout
                layoutId={`bar-${id}`}
                transition={{ type: "spring", stiffness: 390, damping: 32 }}
                style={{
                  position: "relative",
                  height: barHeight,
                  width: BAR_WIDTH,
                  borderRadius: 13,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  paddingBottom: 8,
                  cursor: "default",
                  boxShadow,
                  background,
                  color,
                  fontWeight: 800,
                  fontSize,
                  textShadow: "0 1px 0 rgba(255,255,255,0.16)",
                  userSelect: "none"
                }}
                title={`Index ${index} — ${value}`}
              >
                <div style={{
                  padding: "3px 8px",
                  borderRadius: 8,
                  backgroundColor: "rgba(255,255,255,0.95)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.13)",
                  maxWidth: 40,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  color: "#02111b"
                }}>{value}</div>
                {/* Labels for binary search */}
                {searchType === "Binary Search" && (
                  <div style={{
                    position: "absolute",
                    top: -26,
                    fontWeight: "700",
                    fontSize: 14,
                    color: "#fff",
                    userSelect: "none",
                    width: "100%",
                    textAlign: "center",
                    pointerEvents: "none",
                    textShadow: "0 0 7px rgba(0,0,0,0.89)"
                  }}>
                    {isLeft && "Left"}
                    {isRight && "Right"}
                    {isMid && "Mid"}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Explanation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={explanation}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28 }}
            style={{
              minHeight: 52,
              marginBottom: 24,
              padding: "16px 24px",
              borderRadius: 16,
              background: "#f3f6fa",
              color: "#212956",
              fontSize: 19,
              fontWeight: 800,
              textAlign: "center",
              userSelect: "none",
              boxShadow: "0 9px 28px rgba(103,200,255,0.15)"
            }}
          >
            {explanation}
          </motion.div>
        </AnimatePresence>

        {/* Control buttons */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: 18,
          flexWrap: "wrap"
        }}>
          <button
            onClick={startSearch}
            disabled={isSearching}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold rounded-lg shadow"
            title="Start searching"
          >
            Start Search
          </button>
          <button
            onClick={() => {
              searchRef.current = false;
              setIsSearching(false);
              setCurrentIndex(null);
              setFoundIndex(null);
              setLeftIndex(null);
              setRightIndex(null);
              setMidIndex(null);
              setExplanation("Search stopped.");
            }}
            disabled={!isSearching}
            className="px-6 py-3 bg-orange-400 text-black font-bold rounded-lg shadow"
            title="Stop searching"
          >
            Stop
          </button>
          <button
            onClick={handleReset}
            disabled={isSearching}
            className="px-6 py-3 bg-gradient-to-r from-pink-600 to-amber-700 text-white font-bold rounded-lg shadow"
            title="Reset to default"
          >
            Reset
          </button>
        </div>

        {/* Speed slider */}
        <div style={{
          marginTop: 30,
          textAlign: "center",
          color: "#67C8FF",
          userSelect: "none",
        }}>
          <label htmlFor="speedRange" style={{ fontWeight: "700", marginRight: 12, fontSize: 15 }}>
            Speed (ms delay):
          </label>
          <input
            id="speedRange"
            type="range"
            min="50"
            max="1500"
            step="50"
            value={speed}
            disabled={isSearching}
            onChange={e => setSpeed(Number(e.target.value))}
            style={{ width: 320, verticalAlign: "middle", cursor: isSearching ? "not-allowed" : "pointer" }}
          />
          <span style={{ marginLeft: 14, fontWeight: "900", fontSize: 16 }}>{speed} ms</span>
        </div>
      </div>
    </div>
  );
}

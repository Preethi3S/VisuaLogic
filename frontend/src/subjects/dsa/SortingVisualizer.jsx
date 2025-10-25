import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const BAR_WIDTH = 44;
const BAR_MARGIN = 10;
const MAX_BAR_HEIGHT = 220;
const MIN_BAR_HEIGHT = 24;

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

// Definitions + simple example code snippets for each algorithm
const ALGORITHMS = {
  "Bubble Sort": {
    definition:
      "Bubble Sort repeatedly compares adjacent elements and swaps them if they are in the wrong order. Simple but inefficient (O(n²)).",
    code: `for i in 0 to n-1:
  for j in 0 to n-1-i:
    if arr[j] > arr[j+1]: swap(arr[j], arr[j+1])`,
  },
  "Selection Sort": {
    definition:
      "Selection Sort selects the smallest unsorted element and moves it to the front each pass (O(n²)).",
    code: `for i in 0 to n-1:
  min_idx = i
  for j in i+1 to n:
    if arr[j] < arr[min_idx]: min_idx = j
  swap(arr[i], arr[min_idx])`,
  },
  "Insertion Sort": {
    definition:
      "Insertion Sort builds the sorted array one element at a time by inserting each element into the correct position.",
    code: `for i in 1 to n-1:
  key = arr[i]
  j = i-1
  while j >= 0 and arr[j] > key:
    arr[j+1] = arr[j]
    j -= 1
  arr[j+1] = key`,
  },
  "Merge Sort": {
    definition:
      "Merge Sort recursively divides the array and merges sorted halves. Time complexity: O(n log n).",
    code: `mergeSort(arr):
  if len(arr) > 1:
    mid = len(arr)//2
    L = arr[:mid]
    R = arr[mid:]
    mergeSort(L)
    mergeSort(R)
    merge(L, R, arr)`,
  },
  "Quick Sort": {
    definition:
      "Quick Sort selects a pivot and partitions elements around it recursively (average O(n log n)).",
    code: `quickSort(arr, low, high):
  if low < high:
    pi = partition(arr, low, high)
    quickSort(arr, low, pi-1)
    quickSort(arr, pi+1, high)`,
  },
  "Counting Sort": {
    definition:
      "Counting Sort counts occurrences of each distinct element and builds the sorted output. Works well with integers.",
    code: `count = array of zeros
for num in arr:
  count[num] += 1
output = []
for i in range(len(count)):
  output.extend([i]*count[i])`,
  },
  "Radix Sort": {
    definition:
      "Radix Sort sorts numbers digit by digit using Counting Sort. Efficient for fixed digit sizes.",
    code: `for digit in digits:
  countingSortByDigit(arr, digit)`,
  },
};

const defaultArrayFrom = (arr) => arr.map((v, i) => ({ value: v, id: `v-${Date.now()}-${i}` }));

export default function SortingVisualizer({ defaultArray = [5, 3, 8, 4, 2, 7, 1, 6] }) {
  const [array, setArray] = useState(defaultArrayFrom(defaultArray));
  const [inputValue, setInputValue] = useState(defaultArray.join(", "));
  const [algorithm, setAlgorithm] = useState("Bubble Sort");
  const [explanation, setExplanation] = useState("Choose an algorithm and click Start Sort.");
  const [currentIndices, setCurrentIndices] = useState([]);
  const [sortedIndices, setSortedIndices] = useState(new Set());
  const [isSorting, setIsSorting] = useState(false);
  const [speed, setSpeed] = useState(450);

  const sortingRef = useRef(false);

  useEffect(() => {
    setExplanation("Choose an algorithm and click Start Sort.");
  }, [algorithm]);

  // Apply static cyber grid background
  useEffect(() => {
    document.body.classList.add("bg-cyber-grid");
    document.body.classList.remove("animate-cyber-grid");
    return () => document.body.classList.remove("bg-cyber-grid");
  }, []);

  const parseInputArray = (input) =>
    input
      .trim()
      .split(/[\s,]+/)
      .map((s) => parseFloat(s))
      .filter((n) => !Number.isNaN(n));

  const handleArraySubmit = () => {
    if (isSorting) return;
    const parsed = parseInputArray(inputValue);
    if (parsed.length === 0) {
      alert("Please enter at least one valid number (e.g. 10, 3, 5).");
      return;
    }
    const withIds = parsed.map((value, index) => ({ value, id: `user-${Date.now()}-${index}` }));
    setArray(withIds);
    setSortedIndices(new Set());
    setCurrentIndices([]);
    setExplanation("Custom array loaded. Choose an algorithm and start sorting.");
  };

  const handleReset = () => {
    if (isSorting) return;
    setArray(defaultArrayFrom(defaultArray));
    setInputValue(defaultArray.join(", "));
    setSortedIndices(new Set());
    setCurrentIndices([]);
    setIsSorting(false);
    sortingRef.current = false;
    setExplanation("Choose an algorithm and click Start Sort.");
  };

  const computeBarHeight = (value) => {
    const absVals = array.length ? array.map((a) => Math.abs(a.value || 0)) : [1];
    const maxAbs = Math.max(1, ...absVals);
    const scale = (MAX_BAR_HEIGHT - 40) / maxAbs;
    const raw = Math.abs(value) * scale;
    const h = Math.max(MIN_BAR_HEIGHT, Math.min(MAX_BAR_HEIGHT, Math.round(raw)));
    return h;
  };

  const computeFontSize = (barHeight) => {
    return Math.max(10, Math.min(16, Math.floor(barHeight / 12)));
  };

  // Bubble Sort Generator
  async function* bubbleSortGen(arr) {
    arr = [...arr];
    const n = arr.length;
    let sortedSet = new Set();

    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        yield {
          array: [...arr],
          currentIndices: [j, j + 1],
          sortedIndices: new Set(sortedSet),
          explanation: `Comparing ${arr[j]} and ${arr[j + 1]}`,
        };
        if (arr[j] > arr[j + 1]) {
          [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
          yield {
            array: [...arr],
            currentIndices: [j, j + 1],
            sortedIndices: new Set(sortedSet),
            explanation: `Swapped ${arr[j]} and ${arr[j + 1]}`,
          };
        }
      }
      sortedSet.add(n - 1 - i);
      yield {
        array: [...arr],
        currentIndices: [],
        sortedIndices: new Set(sortedSet),
        explanation: `Element ${arr[n - 1 - i]} is in correct position.`,
      };
    }
    sortedSet = new Set([...Array(n).keys()]);
    yield { array: [...arr], currentIndices: [], sortedIndices: sortedSet, explanation: "Array sorted!" };
  }

  // Selection Sort Generator
  async function* selectionSortGen(arr) {
    arr = [...arr];
    const n = arr.length;
    let sortedSet = new Set();

    for (let i = 0; i < n; i++) {
      let minIndex = i;
      yield {
        array: [...arr],
        currentIndices: [i],
        sortedIndices: new Set(sortedSet),
        explanation: `Starting selection from index ${i}`,
      };
      for (let j = i + 1; j < n; j++) {
        yield {
          array: [...arr],
          currentIndices: [minIndex, j],
          sortedIndices: new Set(sortedSet),
          explanation: `Comparing ${arr[minIndex]} and ${arr[j]}`,
        };
        if (arr[j] < arr[minIndex]) {
          minIndex = j;
          yield {
            array: [...arr],
            currentIndices: [minIndex],
            sortedIndices: new Set(sortedSet),
            explanation: `New minimum found: ${arr[minIndex]} at index ${minIndex}`,
          };
        }
      }
      if (minIndex !== i) {
        [arr[i], arr[minIndex]] = [arr[minIndex], arr[i]];
        yield {
          array: [...arr],
          currentIndices: [i, minIndex],
          sortedIndices: new Set(sortedSet),
          explanation: `Swapped ${arr[minIndex]} and ${arr[i]}`,
        };
      }
      sortedSet.add(i);
      yield {
        array: [...arr],
        currentIndices: [],
        sortedIndices: new Set(sortedSet),
        explanation: `Element ${arr[i]} is in correct position.`,
      };
    }
    sortedSet = new Set([...Array(n).keys()]);
    yield { array: [...arr], currentIndices: [], sortedIndices: sortedSet, explanation: "Array sorted!" };
  }

  // Insertion Sort Generator
  async function* insertionSortGen(arr) {
    arr = [...arr];
    const n = arr.length;
    let sortedSet = new Set();

    for (let i = 1; i < n; i++) {
      let key = arr[i];
      let j = i - 1;
      yield {
        array: [...arr],
        currentIndices: [i],
        sortedIndices: new Set(sortedSet),
        explanation: `Pick element ${key} at index ${i}`,
      };
      while (j >= 0 && arr[j] > key) {
        arr[j + 1] = arr[j];
        yield {
          array: [...arr],
          currentIndices: [j, j + 1],
          sortedIndices: new Set(sortedSet),
          explanation: `Shift ${arr[j]} from index ${j} to ${j + 1}`,
        };
        j--;
      }
      arr[j + 1] = key;
      sortedSet.add(i);
      yield {
        array: [...arr],
        currentIndices: [j + 1],
        sortedIndices: new Set(sortedSet),
        explanation: `Inserted ${key} at index ${j + 1}`,
      };
    }
    sortedSet = new Set([...Array(n).keys()]);
    yield { array: [...arr], currentIndices: [], sortedIndices: sortedSet, explanation: "Array sorted!" };
  }

  // Mapping algorithms to generators
  const sortingAlgorithms = {
    "Bubble Sort": bubbleSortGen,
    "Selection Sort": selectionSortGen,
    "Insertion Sort": insertionSortGen,
    // Add other generators here if needed
  };

  const startSort = async () => {
    if (isSorting) return;
    setIsSorting(true);
    sortingRef.current = true;
    setSortedIndices(new Set());
    setCurrentIndices([]);
    setExplanation("Sorting started...");
    try {
      const gen = sortingAlgorithms[algorithm];
      if (!gen) {
        setExplanation("Selected algorithm not implemented.");
        setIsSorting(false);
        sortingRef.current = false;
        return;
      }
      const iterator = gen(array.map((a) => a.value));
      for await (const step of iterator) {
        if (!sortingRef.current) break;
        setArray(step.array.map((v, i) => ({ value: v, id: array[i].id })));
        setCurrentIndices(step.currentIndices || []);
        setSortedIndices(step.sortedIndices || new Set());
        setExplanation(step.explanation || "");
        await sleep(speed);
      }
    } catch (e) {
      setExplanation("Error during sorting.");
      console.error(e);
    }
    setIsSorting(false);
    sortingRef.current = false;
  };

  return (
    <div className="relative min-h-screen w-full font-sans">
      {/* Static Cyber Grid Background */}
      <div className="absolute inset-0 bg-cyber-grid bg-fixed z-0" />
      <div
        className="relative z-10"
        style={{
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          maxWidth: 900,
          margin: "30px auto",
          padding: 24,
          borderRadius: 18,
          boxShadow: "0 14px 30px rgba(0,0,0,0.25)",
          color: "#f0f4f8",
          userSelect: "none",
        }}
      >
        <h1 style={{ textAlign: "center", marginBottom: 20, fontWeight: 900, fontSize: 28 }}>
          Sorting Visualizer
        </h1>

        {/* Algorithm selector & definition/code */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            marginBottom: 22,
            gap: 12,
          }}
        >
          <select
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value)}
            disabled={isSorting}
            style={{
              flexGrow: 1,
              minWidth: 220,
              padding: "10px 14px",
              borderRadius: 12,
              border: "none",
              fontSize: 16,
              cursor: isSorting ? "not-allowed" : "pointer",
              boxShadow: "0 5px 16px rgba(0,0,0,0.25)",
              background: "#212956",
              color: "#b4eaff",
            }}
          >
            {Object.keys(ALGORITHMS).map((algo) => (
              <option key={algo} value={algo}>
                {algo}
              </option>
            ))}
          </select>

          <div
            style={{
              flexGrow: 3,
              minWidth: 320,
              padding: 14,
              borderRadius: 12,
              backgroundColor: "rgba(255,255,255,0.15)",
              color: "#0f1724",
              boxShadow: "0 5px 20px rgba(0,0,0,0.12)",
              fontSize: 14,
              whiteSpace: "pre-wrap",
              lineHeight: 1.4,
              fontFamily: "monospace",
            }}
          >
            <b>Definition:</b> {ALGORITHMS[algorithm].definition}
            <br />
            <br />
            <b>Example Code:</b>
            <pre
              style={{
                backgroundColor: "#e0e7ff",
                borderRadius: 8,
                padding: 10,
                fontSize: 13,
                color: "#1e293b",
                overflowX: "auto",
                marginTop: 6,
              }}
            >
              {ALGORITHMS[algorithm].code}
            </pre>
          </div>
        </div>

        {/* User input and buttons */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 24,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <input
            type="text"
            placeholder="Enter numbers separated by commas or spaces (e.g. 10, 3, 5)"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isSorting}
            style={{
              flexGrow: 1,
              minWidth: 280,
              maxWidth: 640,
              padding: "12px 16px",
              borderRadius: 14,
              border: "none",
              fontSize: 16,
              outline: "none",
              background: "#212956",
              color: "#dbeafe",
              boxShadow: "0 6px 20px rgba(0,0,0,0.14)",
            }}
          />
          <button
            onClick={handleArraySubmit}
            disabled={isSorting}
            style={{
              padding: "12px 24px",
              borderRadius: 14,
              border: "none",
              fontWeight: 700,
              fontSize: 16,
              cursor: isSorting ? "not-allowed" : "pointer",
              background: "linear-gradient(90deg,#4338ca,#7c3aed)",
              color: "#f0f4f8",
              boxShadow: "0 8px 25px rgba(124,58,237,0.4)",
              userSelect: "none",
            }}
          >
            Load Array
          </button>
        </div>

        {/* Bars container */}
        <div
          style={{
            height: 280,
            maxHeight: 280,
            overflowX: "auto",
            borderRadius: 14,
            backgroundColor: "#1e293b",
            marginBottom: 26,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "flex-start",
            padding: "18px 20px",
            gap: BAR_MARGIN,
            boxShadow: "inset 0 0 40px rgba(103, 200, 255, 0.2)",
            userSelect: "none",
          }}
        >
          <motion.div
            layout
            style={{
              display: "flex",
              gap: BAR_MARGIN,
              alignItems: "flex-end",
              margin: "0 auto",
              flexWrap: "nowrap",
            }}
          >
            {array.map(({ value, id }, index) => {
              const isCurrent = currentIndices.includes(index);
              const isSorted = sortedIndices.has(index);
              const barHeight = computeBarHeight(value);
              const fontSize = computeFontSize(barHeight);

              let background = "linear-gradient(180deg,#60a5fa,#3b82f6)";
              let boxShadow = "0 8px 20px rgba(67,200,255,0.24)";
              let color = "#e0f2fe";
              if (isSorted) {
                background = "linear-gradient(180deg,#10b981,#059669)";
                boxShadow = "0 12px 32px rgba(5,230,127,0.8)";
                color = "#02111b";
              } else if (isCurrent) {
                background = "linear-gradient(180deg,#fde68a,#fbbf24)";
                boxShadow = "0 12px 28px rgba(252,211,77,0.7)";
                color = "#02111b";
              }

              return (
                <motion.div
                  key={id}
                  layout
                  layoutId={`bar-${id}`}
                  transition={{ type: "spring", stiffness: 420, damping: 28 }}
                  whileHover={{ scale: isSorting ? 1 : 1.06 }}
                  style={{
                    position: "relative",
                    height: barHeight,
                    width: BAR_WIDTH,
                    borderRadius: 14,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    paddingBottom: 8,
                    boxSizing: "border-box",
                    cursor: isSorting ? "default" : "pointer",
                    userSelect: "none",
                    boxShadow,
                    background,
                    color,
                    fontWeight: 800,
                    fontSize,
                    textShadow: "0 1px 0 rgba(255,255,255,0.15)",
                  }}
                  title={`Value: ${value}`}
                  onClick={() => {
                    if (!isSorting) {
                      setExplanation(`Selected element ${value} at index ${index}`);
                      setCurrentIndices([index]);
                      setTimeout(() => {
                        setCurrentIndices([]);
                        setExplanation("Choose an algorithm and click Start Sort.");
                      }, 900);
                    }
                  }}
                >
                  <div
                    style={{
                      padding: "3px 8px",
                      borderRadius: 8,
                      backgroundColor: "rgba(255,255,255,0.9)",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.10)",
                      whiteSpace: "nowrap",
                      maxWidth: 40,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      userSelect: "text",
                      color: "#02111b",
                    }}
                  >
                    {value}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Explanation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={explanation}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.32 }}
            style={{
              minHeight: 64,
              marginBottom: 30,
              padding: "18px 22px",
              borderRadius: 16,
              background: "rgba(0,0,0,0.28)",
              color: "#fefefe",
              fontSize: 18,
              fontWeight: 700,
              textAlign: "center",
              userSelect: "none",
              boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
            }}
          >
            {explanation}
          </motion.div>
        </AnimatePresence>

        {/* Control buttons */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={startSort}
            disabled={isSorting}
            style={{
              padding: "14px 28px",
              borderRadius: 16,
              border: "none",
              fontWeight: 900,
              fontSize: 18,
              cursor: isSorting ? "not-allowed" : "pointer",
              background: "linear-gradient(90deg,#7c3aed,#4338ca)",
              color: "#f0f4f8",
              boxShadow: "0 12px 36px rgba(67,56,202,0.32)",
              userSelect: "none",
              flexGrow: 1,
              maxWidth: 200,
              minWidth: 160,
            }}
            title="Start the sorting animation"
          >
            Start Sort
          </button>

          <button
            onClick={() => {
              sortingRef.current = false;
              setIsSorting(false);
              setExplanation("Sorting paused/cancelled.");
            }}
            disabled={!isSorting}
            style={{
              padding: "14px 28px",
              borderRadius: 16,
              border: "none",
              fontWeight: 900,
              fontSize: 18,
              cursor: isSorting ? "pointer" : "not-allowed",
              background: isSorting
                ? "linear-gradient(90deg,#f97316,#ef4444)"
                : "rgba(255,255,255,0.06)",
              color: "#fefefe",
              boxShadow: isSorting ? "0 12px 36px rgba(239,68,68,0.34)" : "none",
              userSelect: "none",
              flexGrow: 1,
              maxWidth: 200,
              minWidth: 160,
            }}
            title="Stop/Pause the sorting animation"
          >
            Stop
          </button>

          <button
            onClick={handleReset}
            disabled={isSorting}
            style={{
              padding: "14px 28px",
              borderRadius: 16,
              border: "none",
              fontWeight: 900,
              fontSize: 18,
              cursor: isSorting ? "not-allowed" : "pointer",
              background: "linear-gradient(90deg,#ef4444,#b91c1c)",
              color: "#f0f4f8",
              boxShadow: "0 12px 36px rgba(239,68,68,0.34)",
              userSelect: "none",
              flexGrow: 1,
              maxWidth: 200,
              minWidth: 160,
            }}
            title="Reset to default array"
          >
            Reset
          </button>
        </div>

        {/* Speed slider */}
        <div
          style={{
            marginTop: 26,
            textAlign: "center",
            color: "#67C8FF",
            userSelect: "none",
          }}
        >
          <label htmlFor="speedRange" style={{ fontWeight: "700", marginRight: 12, fontSize: 16 }}>
            Speed (ms delay):
          </label>
          <input
            id="speedRange"
            type="range"
            min="50"
            max="1200"
            step="50"
            value={speed}
            disabled={isSorting}
            onChange={(e) => setSpeed(Number(e.target.value))}
            style={{ width: 360, verticalAlign: "middle", cursor: isSorting ? "not-allowed" : "pointer" }}
          />
          <span style={{ marginLeft: 14, fontWeight: "900", fontSize: 16 }}>{speed} ms</span>
        </div>
      </div>
    </div>
  );

  async function* bubbleSortGen(arr) {
    arr = [...arr];
    const n = arr.length;
    let sortedSet = new Set();

    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        yield {
          array: [...arr],
          currentIndices: [j, j + 1],
          sortedIndices: new Set(sortedSet),
          explanation: `Comparing ${arr[j]} and ${arr[j + 1]}`,
        };
        if (arr[j] > arr[j + 1]) {
          [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
          yield {
            array: [...arr],
            currentIndices: [j, j + 1],
            sortedIndices: new Set(sortedSet),
            explanation: `Swapped ${arr[j]} and ${arr[j + 1]}`,
          };
        }
      }
      sortedSet.add(n - 1 - i);
      yield {
        array: [...arr],
        currentIndices: [],
        sortedIndices: new Set(sortedSet),
        explanation: `Element ${arr[n - 1 - i]} is in correct position.`,
      };
    }
    sortedSet = new Set([...Array(n).keys()]);
    yield { array: [...arr], currentIndices: [], sortedIndices: sortedSet, explanation: "Array sorted!" };
  }

  async function* selectionSortGen(arr) {
    arr = [...arr];
    const n = arr.length;
    let sortedSet = new Set();

    for (let i = 0; i < n; i++) {
      let minIndex = i;
      yield {
        array: [...arr],
        currentIndices: [i],
        sortedIndices: new Set(sortedSet),
        explanation: `Starting selection from index ${i}`,
      };
      for (let j = i + 1; j < n; j++) {
        yield {
          array: [...arr],
          currentIndices: [minIndex, j],
          sortedIndices: new Set(sortedSet),
          explanation: `Comparing ${arr[minIndex]} and ${arr[j]}`,
        };
        if (arr[j] < arr[minIndex]) {
          minIndex = j;
          yield {
            array: [...arr],
            currentIndices: [minIndex],
            sortedIndices: new Set(sortedSet),
            explanation: `New minimum found: ${arr[minIndex]} at index ${minIndex}`,
          };
        }
      }
      if (minIndex !== i) {
        [arr[i], arr[minIndex]] = [arr[minIndex], arr[i]];
        yield {
          array: [...arr],
          currentIndices: [i, minIndex],
          sortedIndices: new Set(sortedSet),
          explanation: `Swapped ${arr[minIndex]} and ${arr[i]}`,
        };
      }
      sortedSet.add(i);
      yield {
        array: [...arr],
        currentIndices: [],
        sortedIndices: new Set(sortedSet),
        explanation: `Element ${arr[i]} is in correct position.`,
      };
    }
    sortedSet = new Set([...Array(n).keys()]);
    yield { array: [...arr], currentIndices: [], sortedIndices: sortedSet, explanation: "Array sorted!" };
  }

  async function* insertionSortGen(arr) {
    arr = [...arr];
    const n = arr.length;
    let sortedSet = new Set();

    for (let i = 1; i < n; i++) {
      let key = arr[i];
      let j = i - 1;
      yield {
        array: [...arr],
        currentIndices: [i],
        sortedIndices: new Set(sortedSet),
        explanation: `Pick element ${key} at index ${i}`,
      };
      while (j >= 0 && arr[j] > key) {
        arr[j + 1] = arr[j];
        yield {
          array: [...arr],
          currentIndices: [j, j + 1],
          sortedIndices: new Set(sortedSet),
          explanation: `Shift ${arr[j]} from index ${j} to ${j + 1}`,
        };
        j--;
      }
      arr[j + 1] = key;
      sortedSet.add(i);
      yield {
        array: [...arr],
        currentIndices: [j + 1],
        sortedIndices: new Set(sortedSet),
        explanation: `Inserted ${key} at index ${j + 1}`,
      };
    }
    sortedSet = new Set([...Array(n).keys()]);
    yield { array: [...arr], currentIndices: [], sortedIndices: sortedSet, explanation: "Array sorted!" };
  }
}

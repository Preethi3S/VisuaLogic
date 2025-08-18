import React, { useState } from "react";

const colors = {
  primary: "#4B6CB7",
  accent: "#67C8FF",
  background: "#F8FAFC",
  text: "#E0E7FF", // changed for theme
  highlight: "#10B981",
  scan: "#F59E0B",
};

const sampleData = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" },
  { id: 3, name: "Carol" },
  { id: 4, name: "David" },
  { id: 5, name: "Eve" },
  { id: 6, name: "Frank" },
  { id: 7, name: "Grace" },
  { id: 8, name: "Heidi" },
  { id: 9, name: "Ivan" },
  { id: 10, name: "Judy" },
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function IndexingVisualizer() {
  const [data] = useState(sampleData);
  const [sortedData] = useState(
    [...sampleData].sort((a, b) => a.name.localeCompare(b.name))
  );
  const [hashIndex] = useState(() => {
    const map = {};
    sampleData.forEach((item) => {
      map[item.name.toLowerCase()] = item;
    });
    return map;
  });

  const [searchKey, setSearchKey] = useState("");
  const [indexType, setIndexType] = useState("none"); // none, binary, hash
  const [currentStep, setCurrentStep] = useState(-1);
  const [searchResult, setSearchResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [stepsLinear, setStepsLinear] = useState(null);
  const [stepsBinary, setStepsBinary] = useState(null);
  const [stepsHash, setStepsHash] = useState(null);
  const [optimizerChoice, setOptimizerChoice] = useState(null);
  const [showHashBucket, setShowHashBucket] = useState(false);

  // Animated linear search
  const linearSearch = async (key) => {
    setCurrentStep(-1);
    let steps = 0;
    for (let i = 0; i < data.length; i++) {
      steps++;
      setCurrentStep(i);
      await sleep(400);
      if (data[i].name.toLowerCase() === key.toLowerCase()) {
        setSearchResult(data[i]);
        return steps;
      }
    }
    setSearchResult(null);
    return steps;
  };

  // Animated binary search
  const binarySearch = async (key) => {
    setCurrentStep(-1);
    let steps = 0;
    let low = 0,
      high = sortedData.length - 1;

    while (low <= high) {
      steps++;
      let mid = Math.floor((low + high) / 2);
      setCurrentStep(mid);
      await sleep(400);

      if (sortedData[mid].name.toLowerCase() === key.toLowerCase()) {
        setSearchResult(sortedData[mid]);
        return steps;
      } else if (
        sortedData[mid].name.toLowerCase() < key.toLowerCase()
      ) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    setSearchResult(null);
    return steps;
  };

  // Animated hash search with bucket highlight
  const hashSearch = async (key) => {
    setCurrentStep(-1);
    setShowHashBucket(true);
    await sleep(600);
    const result = hashIndex[key.toLowerCase()] || null;
    setShowHashBucket(false);
    setSearchResult(result);
    return 1;
  };

  // Silent versions (no animation) to compute steps for cost comparison
  const linearSearchSilent = (key) => {
    for (let i = 0; i < data.length; i++) {
      if (data[i].name.toLowerCase() === key.toLowerCase()) {
        return i + 1;
      }
    }
    return data.length;
  };

  const binarySearchSilent = (key) => {
    let low = 0,
      high = sortedData.length - 1,
      steps = 0;
    while (low <= high) {
      steps++;
      let mid = Math.floor((low + high) / 2);
      if (sortedData[mid].name.toLowerCase() === key.toLowerCase()) {
        return steps;
      } else if (sortedData[mid].name.toLowerCase() < key.toLowerCase()) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    return steps;
  };

  const hashSearchSilent = (key) => {
    return hashIndex[key.toLowerCase()] ? 1 : 1;
  };

  const runSearches = async (key) => {
    setIsSearching(true);
    setStepsLinear(null);
    setStepsBinary(null);
    setStepsHash(null);
    setOptimizerChoice(null);
    setSearchResult(null);
    setCurrentStep(-1);

    let linearSteps = null;
    let binarySteps = null;
    let hashSteps = null;

    // Run animation only for selected index type
    if (indexType === "none") {
      linearSteps = await linearSearch(key);
    } else if (indexType === "binary") {
      binarySteps = await binarySearch(key);
    } else if (indexType === "hash") {
      hashSteps = await hashSearch(key);
    }

    // Compute other costs silently for comparison (optional)
    if (indexType !== "none") {
      linearSteps = linearSearchSilent(key);
    }
    if (indexType !== "binary") {
      binarySteps = binarySearchSilent(key);
    }
    if (indexType !== "hash") {
      hashSteps = hashSearchSilent(key);
    }

    setStepsLinear(linearSteps);
    setStepsBinary(binarySteps);
    setStepsHash(hashSteps);

    // Pick the best optimizer choice
    const candidates = [{ type: "Full Table Scan", steps: linearSteps }];
    if (binarySteps !== null)
      candidates.push({ type: "Binary Index", steps: binarySteps });
    if (hashSteps !== null)
      candidates.push({ type: "Hash Index", steps: hashSteps });

    candidates.sort((a, b) => a.steps - b.steps);
    setOptimizerChoice(candidates[0].type);

    setIsSearching(false);
  };

  const handleRunQuery = () => {
    if (!searchKey.trim()) {
      alert("Please enter a search key.");
      return;
    }
    runSearches(searchKey.trim());
  };

  const displayData = indexType === "binary" ? sortedData : data;

  return (
    <div
      className="bg-cyber-grid animate-cyber-grid animate-cyber-grid-pulse"
      style={{
        minHeight: "100vh",
        width: "100vw",
        padding: "0",
        margin: "0",
        boxSizing: "border-box",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          maxWidth: 750,
          margin: "48px auto",
          background: "rgba(12,17,35,0.92)",
          borderRadius: "20px",
          boxShadow: "0 0 32px 0 rgba(70,180,255,0.18)",
          padding: "34px 32px",
          color: colors.text,
        }}
      >
        <h1
          style={{
            background: "linear-gradient(90deg,#8beee9 20%,#4B6CB7 90%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontWeight: 900,
            fontSize: 30,
            letterSpacing: 2,
            marginBottom: "30px",
            textAlign: "center",
          }}
        >
          Indexing & Query Optimization Visualizer
        </h1>
        <div style={{ marginBottom: 26, textAlign: "center" }}>
          <input
            type="text"
            placeholder="Enter name to search"
            value={searchKey}
            onChange={(e) => setSearchKey(e.target.value)}
            disabled={isSearching}
            style={{
              padding: 10,
              fontSize: 16,
              width: 220,
              marginRight: 16,
              borderRadius: 8,
              border: "1.5px solid #4B6CB7",
              background: "#15203f",
              color: "#E0E7FF",
              outlineColor: "#67C8FF",
              fontFamily: "monospace",
            }}
          />

          <select
            value={indexType}
            onChange={(e) => setIndexType(e.target.value)}
            disabled={isSearching}
            style={{
              padding: 10,
              fontSize: 16,
              marginRight: 16,
              borderRadius: 8,
              border: "1.5px solid #67C8FF",
              background: "#15203f",
              color: "#E0E7FF",
              fontFamily: "monospace",
              cursor: "pointer",
            }}
            title="Select Index Type"
          >
            <option value="none">No Index (Full Scan)</option>
            <option value="binary">Binary Index (B-tree)</option>
            <option value="hash">Hash Index</option>
          </select>

          <button
            onClick={handleRunQuery}
            disabled={isSearching}
            style={{
              background: "linear-gradient(90deg,#4B6CB7,#67C8FF)",
              color: "#fff",
              border: "none",
              padding: "10px 22px",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: "700",
              fontSize: 17,
              boxShadow: "0 0 10px #67C8FF44",
              marginLeft: 4,
            }}
          >
            Run Query
          </button>
        </div>

        {indexType === "hash" && showHashBucket && (
          <div
            style={{
              margin: "22px auto",
              maxWidth: 460,
              padding: 18,
              border: `2px solid ${colors.accent}`,
              borderRadius: 12,
              textAlign: "center",
              fontWeight: "700",
              color: colors.accent,
              backgroundColor: "#223366",
              fontSize: 19,
              userSelect: "none",
              boxShadow: "0 0 14px #67C8FF44",
            }}
          >
            🔍 Looking up hash bucket for key: <em>{searchKey}</em>
          </div>
        )}

        <table
          style={{
            borderCollapse: "collapse",
            width: "100%",
            maxWidth: 500,
            margin: "24px auto",
            background: "#192748",
            color: "#E0E7FF",
            borderRadius: 10,
            overflow: "hidden",
            fontSize: 18,
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  border: "1px solid #334155",
                  padding: "10px 8px",
                  background: "#223366",
                  color: "#67C8FF",
                  fontWeight: 700,
                  fontSize: 19,
                }}
              >
                ID
              </th>
              <th
                style={{
                  border: "1px solid #334155",
                  padding: "10px 8px",
                  background: "#223366",
                  color: "#67C8FF",
                  fontWeight: 700,
                  fontSize: 19,
                }}
              >
                Name
              </th>
            </tr>
          </thead>
          <tbody>
            {displayData.map((row, idx) => {
              const isCurrentStep = idx === currentStep;
              const isFound = searchResult && searchResult.id === row.id;
              return (
                <tr
                  key={row.id}
                  style={{
                    background:
                      isFound
                        ? colors.highlight
                        : isCurrentStep
                        ? colors.scan
                        : "transparent",
                    color: isFound || isCurrentStep ? "#fff" : "#E0E7FF",
                    transition: "background 0.3s",
                    fontWeight: isFound ? "bold" : "normal",
                  }}
                >
                  <td
                    style={{
                      border: "1px solid #334155",
                      padding: "10px 8px",
                      textAlign: "center",
                    }}
                  >
                    {row.id}
                  </td>
                  <td
                    style={{
                      border: "1px solid #334155",
                      padding: "10px 8px",
                      textAlign: "center",
                    }}
                  >
                    {row.name}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div
          style={{
            marginTop: 35,
            maxWidth: 500,
            marginLeft: "auto",
            marginRight: "auto",
            fontWeight: "700",
            fontSize: 17,
            color: "#B0CBF7",
            textAlign: "center",
            background: "#15203f",
            borderRadius: 14,
            padding: "16px 10px",
            boxShadow: "0 0 12px #4B6CB744",
          }}
        >
          <div>
            <span style={{ color: "#F59E0B" }}>Steps taken in linear scan:</span>{" "}
            {stepsLinear ?? "-"}
          </div>
          <div>
            <span style={{ color: "#67C8FF" }}>
              Steps taken in binary search:
            </span>{" "}
            {stepsBinary ?? (indexType === "binary" ? "-" : "N/A")}
          </div>
          <div>
            <span style={{ color: "#10B981" }}>
              Steps taken in hash search:
            </span>{" "}
            {stepsHash ?? (indexType === "hash" ? "-" : "N/A")}
          </div>
          <div style={{ marginTop: 13, fontWeight: "900" }}>
            Optimizer choice:{" "}
            <span
              style={{
                color:
                  optimizerChoice === "Hash Index"
                    ? colors.highlight
                    : optimizerChoice === "Binary Index"
                    ? colors.accent
                    : optimizerChoice === "Full Table Scan"
                    ? colors.scan
                    : colors.text,
                fontSize: 19,
              }}
            >
              {optimizerChoice ?? "-"}
            </span>
          </div>
        </div>

        <div
          style={{
            marginTop: 45,
            fontSize: 16,
            color: "#B0CBF7",
            maxWidth: 650,
            marginLeft: "auto",
            marginRight: "auto",
            lineHeight: 1.7,
            background: "#223366",
            borderRadius: 14,
            padding: "17px 20px",
            boxShadow: "0 0 10px #4B6CB744",
          }}
        >
          <h3
            style={{
              color: "#67C8FF",
              fontSize: 20,
              marginBottom: 8,
              fontWeight: 900,
              letterSpacing: 1,
            }}
          >
            About
          </h3>
          <p>
            This visualizer simulates different types of indexes and shows their
            impact on query performance. Linear scan checks every row. Binary index
            simulates a B-tree search, jumping through sorted data. Hash index uses
            direct lookup, taking constant time, shown by a quick hash bucket lookup
            animation.
          </p>
        </div>
      </div>
    </div>
  );
}

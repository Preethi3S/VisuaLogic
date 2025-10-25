// src/subjects/dbms/ERModelGenerator.jsx
import React, { useState, useCallback } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
} from "reactflow";
import "reactflow/dist/style.css";

export default function ERModelGenerator() {
  const [entities, setEntities] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [entityName, setEntityName] = useState("");
  const [attributes, setAttributes] = useState("");
  const [relName, setRelName] = useState("");
  const [relFrom, setRelFrom] = useState("");
  const [relTo, setRelTo] = useState("");

  // Convert entities & relationships to nodes & edges
  const generateElements = useCallback(() => {
    const nodes = entities.map((ent, index) => ({
      id: ent.name,
      data: { label: `${ent.name}\n(${ent.attributes.join(", ")})` },
      position: { x: 100 + index * 200, y: 100 },
      style: {
        border: "2px solid #4B6CB7",
        borderRadius: "8px",
        padding: "10px",
        background: "#fff",
        boxShadow: "0 0 24px 0 #4B6CB744", // subtle indigo glow
      },
    }));

    const edges = relationships.map((rel, index) => ({
      id: `rel-${index}`,
      source: rel.from,
      target: rel.to,
      label: rel.name,
      animated: true,
      style: { stroke: "#67C8FF", strokeWidth: 2 },
      labelStyle: { fill: "#1F2937", fontWeight: "bold" }
    }));

    return [...nodes, ...edges];
  }, [entities, relationships]);

  const handleAddEntity = () => {
    if (!entityName) return;
    const attrList = attributes.split(",").map(a => a.trim()).filter(Boolean);
    setEntities([...entities, { name: entityName, attributes: attrList }]);
    setEntityName("");
    setAttributes("");
  };

  const handleAddRelationship = () => {
    if (!relName || !relFrom || !relTo) return;
    setRelationships([...relationships, { name: relName, from: relFrom, to: relTo }]);
    setRelName("");
    setRelFrom("");
    setRelTo("");
  };

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
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        color: "#E0E7FF",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1100px",
          margin: "24px auto",
          background: "rgba(12,17,35,0.92)",
          borderRadius: "18px",
          boxShadow: "0 0 38px 0 rgba(70,180,255,0.15)",
          padding: "32px",
        }}
      >
        <h1
          style={{
            background:
              "linear-gradient(90deg, #8beee9 10%, #4B6CB7 80%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontWeight: 900,
            fontSize: 34,
            letterSpacing: 2,
            marginBottom: "1.5rem",
            textAlign: "center",
          }}
        >
          ER Model Generator
        </h1>

        {/* Entity Form */}
        <div
          style={{
            marginBottom: "1.8rem",
            background: "#15203f",
            borderRadius: 10,
            padding: "18px 20px",
            boxShadow: "0 0 14px #67C8FF22",
            color: "#fff"
          }}
        >
          <h2 style={{ color: "#67C8FF", marginBottom: "0.5rem", fontSize: 20 }}>Add Entity</h2>
          <input
            type="text"
            placeholder="Entity Name"
            value={entityName}
            onChange={(e) => setEntityName(e.target.value)}
            style={{
              marginRight: "0.5rem",
              fontFamily: "monospace",
              borderRadius: 8,
              border: "1px solid #4B6CB7",
              padding: "8px",
              background: "#223366",
              color: "white",
              fontSize: 16,
            }}
          />
          <input
            type="text"
            placeholder="Attributes (comma-separated)"
            value={attributes}
            onChange={(e) => setAttributes(e.target.value)}
            style={{
              marginRight: "0.5rem",
              fontFamily: "monospace",
              borderRadius: 8,
              border: "1px solid #4B6CB7",
              padding: "8px",
              background: "#223366",
              color: "white",
              fontSize: 16,
            }}
          />
          <button
            onClick={handleAddEntity}
            style={{
              background: "linear-gradient(90deg,#4B6CB7,#67C8FF)",
              color: "#fff",
              padding: "10px 18px",
              borderRadius: 8,
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              fontSize: 17,
              boxShadow: "0 0 10px #4B6CB744",
            }}
          >
            Add Entity
          </button>
        </div>

        {/* Relationship Form */}
        <div
          style={{
            marginBottom: "2rem",
            background: "#15203f",
            borderRadius: 10,
            padding: "18px 20px",
            boxShadow: "0 0 14px #67C8FF22",
            color: "#fff"
          }}
        >
          <h2 style={{ color: "#67C8FF", marginBottom: "0.5rem", fontSize: 20 }}>Add Relationship</h2>
          <input
            type="text"
            placeholder="Relationship Name"
            value={relName}
            onChange={(e) => setRelName(e.target.value)}
            style={{
              marginRight: "0.5rem",
              fontFamily: "monospace",
              borderRadius: 8,
              border: "1px solid #67C8FF",
              padding: "8px",
              background: "#223366",
              color: "white",
              fontSize: 16,
            }}
          />
          <select
            value={relFrom}
            onChange={(e) => setRelFrom(e.target.value)}
            style={{
              marginRight: "0.5rem",
              fontFamily: "monospace",
              borderRadius: 8,
              border: "1px solid #67C8FF",
              padding: "8px",
              background: "#223366",
              color: "white",
              fontSize: 16,
            }}
          >
            <option value="">From Entity</option>
            {entities.map((e) => (
              <option key={e.name} value={e.name}>{e.name}</option>
            ))}
          </select>
          <select
            value={relTo}
            onChange={(e) => setRelTo(e.target.value)}
            style={{
              marginRight: "0.5rem",
              fontFamily: "monospace",
              borderRadius: 8,
              border: "1px solid #67C8FF",
              padding: "8px",
              background: "#223366",
              color: "white",
              fontSize: 16,
            }}
          >
            <option value="">To Entity</option>
            {entities.map((e) => (
              <option key={e.name} value={e.name}>{e.name}</option>
            ))}
          </select>
          <button
            onClick={handleAddRelationship}
            style={{
              background: "linear-gradient(90deg,#67C8FF,#4B6CB7)",
              color: "#fff",
              padding: "10px 18px",
              borderRadius: 8,
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              fontSize: 17,
              boxShadow: "0 0 10px #67C8FF44",
            }}
          >
            Add Relationship
          </button>
        </div>

        {/* Diagram */}
        <div
          style={{
            height: "60vh",
            border: "1px solid #334155",
            borderRadius: "18px",
            background: "#0a0f1ff4",
            boxShadow: "0 4px 32px 0 #4B6CB744",
            marginTop: 24,
            overflow: "hidden"
          }}
        >
          <ReactFlow
            nodes={generateElements().filter(el => el.position)}
            edges={generateElements().filter(el => !el.position)}
            fitView
          >
            <MiniMap />
            <Controls />
            <Background />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}

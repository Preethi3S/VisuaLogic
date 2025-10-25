// src/subjects/dbms/RelationalSchema.jsx
import React, { useState } from "react";

export default function RelationalSchema() {
  const [entities, setEntities] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [entityName, setEntityName] = useState("");
  const [attributes, setAttributes] = useState("");
  const [primaryKey, setPrimaryKey] = useState("");
  const [relName, setRelName] = useState("");
  const [relFrom, setRelFrom] = useState("");
  const [relTo, setRelTo] = useState("");
  const [viewMode, setViewMode] = useState("table"); // "table" or "sql"

  // Add entity
  const handleAddEntity = () => {
    if (!entityName || !primaryKey) return;
    const attrList = attributes.split(",").map(a => a.trim()).filter(Boolean);
    setEntities([...entities, { name: entityName, attributes: attrList, pk: primaryKey }]);
    setEntityName("");
    setAttributes("");
    setPrimaryKey("");
  };

  // Add relationship
  const handleAddRelationship = () => {
    if (!relName || !relFrom || !relTo) return;
    setRelationships([...relationships, { name: relName, from: relFrom, to: relTo }]);
    setRelName("");
    setRelFrom("");
    setRelTo("");
  };

  // Generate SQL from schema
  const generateSQL = () => {
    let sql = "";
    entities.forEach(ent => {
      sql += `CREATE TABLE ${ent.name} (\n`;
      ent.attributes.forEach(attr => {
        if (attr === ent.pk) {
          sql += `  ${attr} INT PRIMARY KEY,\n`;
        } else {
          sql += `  ${attr} VARCHAR(255),\n`;
        }
      });
      sql = sql.slice(0, -2); // remove last comma
      sql += `\n);\n\n`;
    });

    relationships.forEach(rel => {
      const fromEntity = entities.find(e => e.name === rel.from);
      const toEntity = entities.find(e => e.name === rel.to);
      if (fromEntity && toEntity) {
        sql += `ALTER TABLE ${rel.from} ADD FOREIGN KEY (${toEntity.pk}) REFERENCES ${rel.to}(${toEntity.pk});\n`;
      }
    });

    return sql.trim();
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
        justifyContent: "center",
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          maxWidth: 700,
          margin: "48px auto",
          background: "rgba(12,17,35,0.93)",
          borderRadius: "20px",
          boxShadow: "0 0 32px 0 rgba(70,180,255,0.17)",
          padding: "32px 26px",
          color: "#E0E7FF",
        }}
      >
        <h1
          style={{
            background: "linear-gradient(90deg,#8beee9 15%,#4B6CB7 90%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontWeight: 900,
            fontSize: 28,
            letterSpacing: 2,
            marginBottom: "26px",
            textAlign: "center",
          }}
        >
          Relational Schema Generator
        </h1>

        {/* Entity Form */}
        <div
          style={{
            marginBottom: "1.6rem",
            background: "#223366",
            borderRadius: 10,
            padding: "16px 20px",
            boxShadow: "0 0 12px #67C8FF22",
          }}
        >
          <h2 style={{ color: "#67C8FF", fontWeight: 800, fontSize: 20, marginBottom: 8 }}>Add Entity</h2>
          <input
            type="text"
            placeholder="Entity Name"
            value={entityName}
            onChange={(e) => setEntityName(e.target.value)}
            style={{
              marginRight: "0.5rem",
              fontFamily: "monospace",
              borderRadius: 8,
              border: "1.5px solid #4B6CB7",
              padding: "8px 10px",
              background: "#15203f",
              color: "#fff",
              fontSize: 17,
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
              border: "1.5px solid #4B6CB7",
              padding: "8px 10px",
              background: "#15203f",
              color: "#fff",
              fontSize: 17,
            }}
          />
          <input
            type="text"
            placeholder="Primary Key"
            value={primaryKey}
            onChange={(e) => setPrimaryKey(e.target.value)}
            style={{
              marginRight: "0.5rem",
              fontFamily: "monospace",
              borderRadius: 8,
              border: "1.5px solid #4B6CB7",
              padding: "8px 10px",
              background: "#15203f",
              color: "#fff",
              fontSize: 17,
            }}
          />
          <button
            onClick={handleAddEntity}
            style={{
              background: "linear-gradient(90deg,#4B6CB7,#67C8FF)",
              color: "#fff",
              padding: "9px 18px",
              borderRadius: 8,
              fontWeight: 800,
              border: "none",
              cursor: "pointer",
              fontSize: 16,
              marginTop: 6,
            }}
          >
            Add Entity
          </button>
        </div>

        {/* Relationship Form */}
        <div
          style={{
            marginBottom: "1.6rem",
            background: "#223366",
            borderRadius: 10,
            padding: "16px 20px",
            boxShadow: "0 0 12px #67C8FF22",
          }}
        >
          <h2 style={{ color: "#67C8FF", fontWeight: 800, fontSize: 20, marginBottom: 8 }}>Add Relationship</h2>
          <input
            type="text"
            placeholder="Relationship Name"
            value={relName}
            onChange={(e) => setRelName(e.target.value)}
            style={{
              marginRight: "0.5rem",
              fontFamily: "monospace",
              borderRadius: 8,
              border: "1.5px solid #67C8FF",
              padding: "8px 10px",
              background: "#15203f",
              color: "#fff",
              fontSize: 17,
            }}
          />
          <select
            value={relFrom}
            onChange={(e) => setRelFrom(e.target.value)}
            style={{
              marginRight: "0.5rem",
              fontFamily: "monospace",
              borderRadius: 8,
              border: "1.5px solid #67C8FF",
              padding: "8px 10px",
              background: "#15203f",
              color: "#fff",
              fontSize: 17,
            }}
          >
            <option value="">From Entity</option>
            {entities.map((e) => (
              <option key={e.name} value={e.name}>
                {e.name}
              </option>
            ))}
          </select>
          <select
            value={relTo}
            onChange={(e) => setRelTo(e.target.value)}
            style={{
              marginRight: "0.5rem",
              fontFamily: "monospace",
              borderRadius: 8,
              border: "1.5px solid #67C8FF",
              padding: "8px 10px",
              background: "#15203f",
              color: "#fff",
              fontSize: 17,
            }}
          >
            <option value="">To Entity</option>
            {entities.map((e) => (
              <option key={e.name} value={e.name}>
                {e.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleAddRelationship}
            style={{
              background: "linear-gradient(90deg,#67C8FF,#4B6CB7)",
              color: "#fff",
              padding: "9px 18px",
              borderRadius: 8,
              fontWeight: 800,
              border: "none",
              cursor: "pointer",
              fontSize: 16,
              marginTop: 6,
            }}
          >
            Add Relationship
          </button>
        </div>

        {/* Toggle View */}
        <div style={{ marginBottom: "1.6rem", textAlign: "center" }}>
          <button
            onClick={() => setViewMode("table")}
            style={{
              background: viewMode === "table" ? "#10B981" : "#334155",
              color: viewMode === "table" ? "#fff" : "#B3CAFF",
              marginRight: "0.5rem",
              padding: "10px 18px",
              borderRadius: 8,
              fontWeight: "800",
              border: "none",
              cursor: "pointer",
              fontSize: 16,
              opacity: viewMode === "table" ? "1" : "0.6",
              transition: "opacity 0.2s",
            }}
          >
            Table View
          </button>
          <button
            onClick={() => setViewMode("sql")}
            style={{
              background: viewMode === "sql" ? "#10B981" : "#334155",
              color: viewMode === "sql" ? "#fff" : "#B3CAFF",
              padding: "10px 18px",
              borderRadius: 8,
              fontWeight: "800",
              border: "none",
              cursor: "pointer",
              fontSize: 16,
              opacity: viewMode === "sql" ? "1" : "0.6",
              transition: "opacity 0.2s",
            }}
          >
            SQL View
          </button>
        </div>

        {/* Output */}
        {viewMode === "table" ? (
          <div>
            {entities.map((ent) => (
              <div
                key={ent.name}
                style={{
                  background: "#15203f",
                  border: "1.5px solid #334155",
                  borderRadius: "8px",
                  marginBottom: "1.2rem",
                  padding: "0.8rem",
                  boxShadow: "0 0 8px #4B6CB744",
                  color: "#E0E7FF",
                }}
              >
                <h3 style={{ color: "#4B6CB7", fontWeight: 800, fontSize: 18 }}>{ent.name}</h3>
                <ul>
                  {ent.attributes.map((attr) => (
                    <li key={attr} style={{ fontSize: 16 }}>
                      {attr} {attr === ent.pk && <strong style={{ color: "#10B981" }}>(PK)</strong>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {relationships.length > 0 && (
              <div style={{ marginTop: "1.1rem", background: "#192748", borderRadius: 8, padding: "0.8rem" }}>
                <h3 style={{ color: "#67C8FF", fontWeight: 700, fontSize: 17 }}>Relationships</h3>
                <ul>
                  {relationships.map((rel, idx) => (
                    <li key={idx} style={{ fontSize: 16 }}>
                      {rel.name}: {rel.from} → {rel.to}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <pre
            style={{
              background: "#192748",
              color: "#67C8FF",
              padding: "1.2rem",
              borderRadius: "8px",
              whiteSpace: "pre-wrap",
              fontSize: 16,
              boxShadow: "0 0 6px #67C8FF22",
            }}
          >
            {generateSQL()}
          </pre>
        )}
      </div>
    </div>
  );
}

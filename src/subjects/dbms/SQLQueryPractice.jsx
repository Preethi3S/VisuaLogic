// src/subjects/dbms/SQLQueryPractice.jsx
import React, { useEffect, useState, useRef } from "react";
import alasql from "alasql";

const styles = {
  page: {
    minHeight: "100vh",
    width: "100vw",
    padding: 0,
    margin: 0,
    boxSizing: "border-box",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
  },
  container: {
    maxWidth: 1100,
    margin: "48px auto",
    background: "rgba(12, 17, 35, 0.92)",
    borderRadius: 24,
    boxShadow: "0 0 50px 0 rgba(70, 180, 255, 0.25)",
    padding: 36,
    color: "#E0E7FF",
    display: "flex",
    gap: 24,
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  panel: {
    background: "#15203f",
    borderRadius: 14,
    padding: 20,
    boxShadow: "0 0 28px 0 #4B6CB744",
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  header: {
    color: "#67C8FF",
    marginBottom: 20,
    fontWeight: "900",
    fontSize: 26,
    letterSpacing: 1,
  },
  button: (bg, fg = "#fff") => ({
    background: bg,
    color: fg,
    border: "none",
    padding: "10px 18px",
    marginRight: 12,
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 16,
    boxShadow: `0 0 10px ${bg}88`,
    transition: "background-color 0.3s ease, box-shadow 0.3s ease",
  }),
  textarea: {
    width: "100%",
    minHeight: 160,
    padding: 14,
    borderRadius: 10,
    border: "1.5px solid #4B6CB7",
    fontFamily: "monospace",
    fontSize: 16,
    resize: "vertical",
    backgroundColor: "#121a2c",
    color: "#E0E7FF",
    outlineColor: "#67C8FF",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: 12,
  },
  th: {
    textAlign: "left",
    padding: "12px 14px",
    borderBottom: "2px solid #314e89",
    backgroundColor: "#223366",
    color: "#67C8FF",
    fontWeight: 700,
    fontSize: 17,
  },
  td: {
    padding: "11px 14px",
    borderBottom: "1px solid #334b86",
    color: "#cbd5e1",
    fontSize: 16,
  },
  small: { fontSize: 14, color: "#84a9d1", userSelect: "none" },
};

const SAMPLE_SQLS = [
  {
    title: "Select all customers",
    sql: "SELECT * FROM Customers;",
  },
  {
    title: "Orders with product details",
    sql:
      "SELECT o.id AS order_id, c.name AS customer, p.name AS product, o.quantity, o.order_date\nFROM Orders o\nJOIN Customers c ON o.customer_id = c.id\nJOIN Products p ON o.product_id = p.id;",
  },
  {
    title: "Total spent per customer",
    sql:
      "SELECT c.name AS customer, SUM(p.price * o.quantity) AS total_spent\nFROM Orders o\nJOIN Customers c ON o.customer_id = c.id\nJOIN Products p ON o.product_id = p.id\nGROUP BY c.name\nORDER BY total_spent DESC;",
  },
  {
    title: "Insert sample product",
    sql:
      "INSERT INTO Products (id, name, price, category) VALUES (4, 'Wireless Charger', 699, 'Accessories');",
  },
];

export default function SQLQueryPractice() {
  const [query, setQuery] = useState(SAMPLE_SQLS[0].sql);
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([]);
  const [schemaLoaded, setSchemaLoaded] = useState(false);
  const resultRef = useRef(null);

  // Initialize / reset DB schema + sample data
  const loadSampleDB = () => {
    try {
      alasql("DROP TABLE IF EXISTS Orders;");
      alasql("DROP TABLE IF EXISTS Customers;");
      alasql("DROP TABLE IF EXISTS Products;");
    } catch {}

    try {
      alasql("DROP DATABASE IF EXISTS dbms_sample; CREATE DATABASE dbms_sample; ATTACH DATABASE dbms_sample; USE dbms_sample;");
    } catch {}

    alasql(`
      CREATE TABLE Customers (
        id INT PRIMARY KEY,
        name STRING,
        email STRING,
        city STRING
      );
    `);

    alasql(`
      CREATE TABLE Products (
        id INT PRIMARY KEY,
        name STRING,
        price INT,
        category STRING
      );
    `);

    alasql(`
      CREATE TABLE Orders (
        id INT PRIMARY KEY,
        customer_id INT,
        product_id INT,
        quantity INT,
        order_date DATE
      );
    `);

    alasql("INSERT INTO Customers VALUES (1, 'Asha Patel', 'asha@example.com', 'Mumbai');");
    alasql("INSERT INTO Customers VALUES (2, 'Ravi Kumar', 'ravi@example.com', 'Delhi');");
    alasql("INSERT INTO Customers VALUES (3, 'Sana Singh', 'sana@example.com', 'Bengaluru');");

    alasql("INSERT INTO Products VALUES (1, 'Bluetooth Speaker', 1999, 'Electronics');");
    alasql("INSERT INTO Products VALUES (2, 'Mechanical Keyboard', 3499, 'Peripherals');");
    alasql("INSERT INTO Products VALUES (3, 'USB-C Cable', 299, 'Accessories');");

    alasql("INSERT INTO Orders VALUES (1, 1, 1, 1, '2025-07-01');");
    alasql("INSERT INTO Orders VALUES (2, 1, 3, 2, '2025-07-05');");
    alasql("INSERT INTO Orders VALUES (3, 2, 2, 1, '2025-07-10');");

    setSchemaLoaded(true);
    setResult(null);
    setMessage("Sample DB loaded.");
  };

  useEffect(() => {
    loadSampleDB();
  }, []);

  const runQuery = () => {
    if (!schemaLoaded) {
      setMessage("Load schema before running queries.");
      return;
    }
    const trimmed = query.trim();
    if (!trimmed) {
      setMessage("Please enter a SQL query.");
      return;
    }

    try {
      const res = alasql(trimmed);
      if (Array.isArray(res)) {
        setResult(res);
        setMessage(`${res.length} row(s) returned.`);
      } else {
        setResult(null);
        setMessage(`Query executed. Result: ${JSON.stringify(res)}`);
      }
      setHistory((h) => [{ sql: trimmed, time: new Date().toISOString() }, ...h].slice(0, 20));
    } catch (err) {
      setResult(null);
      setMessage("Error: " + (err && err.message ? err.message : String(err)));
    } finally {
      setTimeout(() => {
        if (resultRef.current) resultRef.current.scrollIntoView({ behavior: "smooth" });
      }, 80);
    }
  };

  const clearHistory = () => setHistory([]);

  const exportCSV = () => {
    if (!result || !Array.isArray(result)) {
      setMessage("No tabular result to export.");
      return;
    }
    const cols = result.length > 0 ? Object.keys(result[0]) : [];
    const rows = result.map((r) => cols.map((c) => (r[c] == null ? "" : String(r[c]).replace(/"/g, '""'))));
    const csvStr = [cols.join(","), ...rows.map((r) => r.map((cell) => `"${cell}"`).join(","))].join("\n");
    const blob = new Blob([csvStr], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `query-result-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadExample = (sql) => setQuery(sql);

  const resetDB = () => {
    if (window.confirm("Reset sample DB to initial state? This will discard all changes.")) {
      loadSampleDB();
      setHistory([]);
      setMessage("DB reset to initial state.");
    }
  };

  return (
    <div className="bg-cyber-grid animate-cyber-grid animate-cyber-grid-pulse" style={styles.page}>
      <div style={styles.container}>
        <div style={styles.panel}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h1 style={styles.header}>SQL Query Practice</h1>
            <div style={{ display: "flex", gap: 10 }}>
              <button style={styles.button("#4B6CB7")} onClick={resetDB}>Reset DB</button>
              <button style={styles.button("#67C8FF")} onClick={() => { setQuery(""); setResult(null); setMessage(""); }}>Clear</button>
            </div>
          </div>

          <div>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Write SQL here..."
              style={styles.textarea}
              spellCheck={false}
            />
          </div>

          <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
            <button style={styles.button("#10B981")} onClick={runQuery}>Run Query</button>
            <button style={styles.button("#F59E0B")} onClick={() => { if (SAMPLE_SQLS[0]) loadExample(SAMPLE_SQLS[0].sql); }}>Load Sample</button>
            <button style={styles.button("#E5E7EB", "#000")} onClick={() => setQuery("")}>Clear Editor</button>
            <button style={styles.button("#4B6CB7")} onClick={() => { navigator.clipboard?.writeText(query); setMessage("Copied query to clipboard."); }}>Copy</button>
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Examples</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {SAMPLE_SQLS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => loadExample(s.sql)}
                  title={s.title}
                  style={{ ...styles.button("#E5E7EB", "#000"), marginBottom: 6 }}
                >
                  {s.title}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ ...styles.panel, flexBasis: 380, display: "flex", flexDirection: "column" }}>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Schema / Tables</div>
          <div style={styles.small}>
            <div><strong>Customers</strong> (id, name, email, city)</div>
            <div><strong>Products</strong> (id, name, price, category)</div>
            <div><strong>Orders</strong> (id, customer_id, product_id, quantity, order_date)</div>
          </div>

          <div style={{ marginTop: 24, fontWeight: 700 }}>Query History</div>
          <div style={{ maxHeight: 260, overflowY: "auto", marginTop: 8 }}>
            {history.length === 0 ? (
              <div style={styles.small}>No history yet — run a query to populate.</div>
            ) : (
              <ul style={{ paddingLeft: 14 }}>
                {history.map((h, i) => (
                  <li key={i} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 14, color: "#a0b8ff" }}>
                      <code style={{ background: "#182840", padding: "4px 8px", borderRadius: 6 }}>
                        {h.sql.length > 110 ? h.sql.slice(0, 110) + "…" : h.sql}
                      </code>
                    </div>
                    <div style={{ ...styles.small, marginBottom: 4 }}>{new Date(h.time).toLocaleString()}</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button style={styles.button("#4B6CB7")} onClick={() => setQuery(h.sql)}>Load</button>
                      <button style={styles.button("#10B981")} onClick={() => { setQuery(h.sql); runQuery(); }}>Run</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div ref={resultRef} style={{ marginTop: 20, maxWidth: 1100, marginLeft: "auto", marginRight: "auto" }}>
        <div style={{ ...styles.panel, background: "#1E2A59", boxShadow: "0 0 22px 0 #4B6CB7cc" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontWeight: 700, fontSize: 20 }}>Result</div>
            <div style={{ ...styles.small, color: "#67C8FF" }}>{message}</div>
          </div>

          <div style={{ marginTop: 12 }}>
            {result && Array.isArray(result) ? (
              result.length === 0 ? (
                <div style={styles.small}>Query returned 0 rows.</div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        {Object.keys(result[0]).map((col) => (
                          <th key={col} style={styles.th}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.map((row, ri) => (
                        <tr key={ri}>
                          {Object.keys(row).map((col) => (
                            <td key={col} style={styles.td}>{String(row[col] ?? "")}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ marginTop: 12 }}>
                    <button style={styles.button("#4B6CB7")} onClick={exportCSV}>Export CSV</button>
                  </div>
                </div>
              )
            ) : (
              <div style={styles.small}>No tabular result to show. {message ? `(${message})` : ""}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

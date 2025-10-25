import React, { useState, useEffect } from "react";

function ipToBinary(ip) {
  return ip
    .split(".")
    .map((octet) => {
      const bin = parseInt(octet, 10).toString(2);
      return "00000000".substring(bin.length) + bin;
    })
    .join("");
}

function binaryToIp(bin) {
  let ip = [];
  for (let i = 0; i < 32; i += 8) {
    ip.push(parseInt(bin.substring(i, i + 8), 2));
  }
  return ip.join(".");
}

function calculateSubnetInfo(ip, cidr) {
  const ipBin = ipToBinary(ip);
  const maskBin = "1".repeat(cidr) + "0".repeat(32 - cidr);

  const networkBin = ipBin
    .split("")
    .map((bit, idx) => (maskBin[idx] === "1" ? bit : "0"))
    .join("");

  const invertedMask = maskBin
    .split("")
    .map((bit) => (bit === "1" ? "0" : "1"))
    .join("");
  let broadcastBin = "";
  for (let i = 0; i < 32; i++) {
    broadcastBin += networkBin[i] === "1" || invertedMask[i] === "1" ? "1" : "0";
  }

  const hostCount = Math.max(0, 2 ** (32 - cidr) - 2);
  const firstHostBin =
    cidr === 32
      ? networkBin
      : networkBin.substring(0, 31) + "1"; // last bit set to 1
  const lastHostBin =
    cidr === 32
      ? networkBin
      : broadcastBin.substring(0, 31) + "0"; // last bit set to 0

  return {
    networkAddress: binaryToIp(networkBin),
    broadcastAddress: binaryToIp(broadcastBin),
    subnetMask: binaryToIp(maskBin),
    numberOfHosts: hostCount,
    firstHost: binaryToIp(firstHostBin),
    lastHost: binaryToIp(lastHostBin),
  };
}

function validateIp(ip) {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) return false;
  for (let p of parts) {
    const n = Number(p);
    if (isNaN(n) || n < 0 || n > 255) return false;
  }
  return true;
}

export default function SubnettingCalculator() {
  const [ip, setIp] = useState("");
  const [cidr, setCidr] = useState(24);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  // Apply static cyber grid
  useEffect(() => {
    document.body.classList.add("bg-cyber-grid");
    document.body.classList.remove("animate-cyber-grid", "animate-cyber-grid-pulse");
    return () => {
      document.body.classList.remove("bg-cyber-grid");
    };
  }, []);

  const handleCalculate = () => {
    setError("");
    if (!validateIp(ip)) {
      setError("Invalid IPv4 address format.");
      setResult(null);
      return;
    }
    if (cidr < 0 || cidr > 32) {
      setError("CIDR must be between 0 and 32.");
      setResult(null);
      return;
    }
    const calc = calculateSubnetInfo(ip, cidr);
    setResult(calc);
  };

  return (
    <div className="relative min-h-screen w-full font-sans">
      {/* Static Cyber Grid Background */}
      <div className="absolute inset-0 bg-cyber-grid bg-fixed z-0" />
      <div className="relative z-10 max-w-3xl mx-auto p-6 bg-white rounded shadow-md select-none">
        <h2 className="text-3xl font-bold mb-6 text-center">Subnetting Calculator</h2>

        <div className="flex flex-col gap-4 mb-6">
          <label className="font-semibold" htmlFor="ip-input">
            IP Address (IPv4)
          </label>
          <input
            id="ip-input"
            type="text"
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            placeholder="e.g. 192.168.1.10"
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-describedby="ipHelp"
          />
          <small id="ipHelp" className="text-gray-500">
            Enter a valid IPv4 address
          </small>
        </div>

        <div className="flex flex-col gap-4 mb-6">
          <label className="font-semibold" htmlFor="cidr-input">
            Subnet Mask (CIDR notation)
          </label>
          <input
            id="cidr-input"
            type="number"
            min="0"
            max="32"
            value={cidr}
            onChange={(e) => setCidr(Number(e.target.value))}
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-describedby="cidrHelp"
          />
          <small id="cidrHelp" className="text-gray-500">Enter subnet mask prefix length (0-32)</small>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
        )}

        <button
          onClick={handleCalculate}
          className="w-full py-3 bg-indigo-600 text-white rounded font-semibold hover:bg-indigo-700 transition"
          aria-label="Calculate subnet information"
        >
          Calculate
        </button>

        {result && (
          <div className="mt-6 bg-indigo-50 rounded p-6 border border-indigo-200">
            <h3 className="text-2xl font-bold mb-4 text-indigo-700">Results</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-800">
              <li>
                <strong>Network Address:</strong> {result.networkAddress}
              </li>
              <li>
                <strong>Broadcast Address:</strong> {result.broadcastAddress}
              </li>
              <li>
                <strong>Subnet Mask:</strong> {result.subnetMask}
              </li>
              <li>
                <strong>Number of Hosts:</strong> {result.numberOfHosts}
              </li>
              <li>
                <strong>Host IP Range:</strong> {result.firstHost} - {result.lastHost}
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

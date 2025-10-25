import React, { useRef, useState, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";

// ---------- Utils (sigmoid, forward, grads) ----------
const sigmoid = (x) => 1 / (1 + Math.exp(-x));
const sigmoidPrime = (x) => {
  const s = sigmoid(x);
  return s * (1 - s);
};

function initNetwork(layerSizes) {
  const layers = [];
  for (let i = 0; i < layerSizes.length - 1; i++) {
    const inSize = layerSizes[i];
    const outSize = layerSizes[i + 1];
    const weights = new Array(outSize).fill(0).map(() =>
      new Array(inSize).fill(0).map(() => (Math.random() - 0.5) * 2)
    );
    const biases = new Array(outSize).fill(0).map(() => (Math.random() - 0.5) * 2);
    layers.push({ weights, biases, inSize, outSize });
  }
  return layers;
}

function forward(network, input) {
  const activations = [input.slice()];
  const zs = [];
  let a = input.slice();
  for (const layer of network) {
    const z = new Array(layer.outSize).fill(0);
    for (let j = 0; j < layer.outSize; j++) {
      let sum = layer.biases[j];
      for (let i = 0; i < layer.inSize; i++) sum += layer.weights[j][i] * a[i];
      z[j] = sum;
    }
    zs.push(z);
    a = z.map(sigmoid);
    activations.push(a);
  }
  return { activations, zs };
}

function backward(network, activations, zs, target) {
  const grads = network.map((layer) => ({ dW: layer.weights.map((r) => r.map(() => 0)), dB: new Array(layer.outSize).fill(0) }));
  const L = network.length - 1;
  const delta = new Array(network[L].outSize).fill(0);
  const aL = activations[activations.length - 1];
  const zL = zs[zs.length - 1];
  for (let j = 0; j < aL.length; j++) {
    const dCost_da = aL[j] - target[j];
    delta[j] = dCost_da * sigmoidPrime(zL[j]);
    grads[L].dB[j] = delta[j];
    for (let i = 0; i < network[L].inSize; i++) {
      grads[L].dW[j][i] = delta[j] * activations[activations.length - 2][i];
    }
  }
  for (let l = L - 1; l >= 0; l--) {
    const layer = network[l];
    const next = network[l + 1];
    const z = zs[l];
    const sp = z.map(sigmoidPrime);
    const newDelta = new Array(layer.outSize).fill(0);
    for (let j = 0; j < layer.outSize; j++) {
      let sum = 0;
      for (let k = 0; k < next.outSize; k++) sum += next.weights[k][j] * delta[k];
      newDelta[j] = sum * sp[j];
      grads[l].dB[j] = newDelta[j];
      for (let i = 0; i < layer.inSize; i++) {
        grads[l].dW[j][i] = newDelta[j] * activations[l][i];
      }
    }
    for (let t = 0; t < newDelta.length; t++) delta[t] = newDelta[t];
  }
  return grads;
}

// ---------- Visual components ----------

function Neuron({ position, activation, radius = 0.25, label }) {
  const ref = useRef();
  useFrame(() => {
    if (!ref.current) return;
    const s = 0.6 + 0.8 * activation;
    ref.current.scale.set(s, s, s);
    ref.current.material.emissiveIntensity = 0.2 + 1.5 * activation;
    ref.current.material.color.setRGB(0.1 + 0.8 * activation, 0.1 + 0.8 * activation, 0.6);
  });
  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[radius, 24, 24]} />
      <meshStandardMaterial metalness={0.2} roughness={0.6} emissive={0x67c8ff} />
      <Html center distanceFactor={8} style={{ pointerEvents: "none" }}>
        <div style={{ fontSize: 12, color: "#1F2937", fontWeight: 600 }}>{label}</div>
      </Html>
    </mesh>
  );
}

function Connection({ from, to, intensity = 0, gradient = 0, width = 0.03, id }) {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current) return;
    const t = (state.clock.elapsedTime * (1 + intensity * 4)) % 1;
    const g = Math.min(Math.abs(gradient) * 6, 1);
    const r = 0.1 + g * 0.8;
    const b = 0.6 - g * 0.5;
    const green = 0.2 + g * 0.7;
    ref.current.material.color.setRGB(r, green, b);
    ref.current.scale.set(1 + Math.min(Math.abs(gradient) * 8, 4), 1, 1);
  });
  const dir = [to[0] - from[0], to[1] - from[1], to[2] - from[2]];
  const len = Math.sqrt(dir[0] * dir[0] + dir[1] * dir[1] + dir[2] * dir[2]);
  const mid = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, (from[2] + to[2]) / 2];
  const axis = [0, 1, 0];
  const quaternion = useMemo(() => {
    const up = [0, 1, 0];
    const v = [dir[0] / len, dir[1] / len, dir[2] / len];
    const cross = [up[1] * v[2] - up[2] * v[1], up[2] * v[0] - up[0] * v[2], up[0] * v[1] - up[1] * v[0]];
    const dot = up[0] * v[0] + up[1] * v[1] + up[2] * v[2];
    const q = [cross[0], cross[1], cross[2], 1 + dot];
    const mag = Math.sqrt(q[0] * q[0] + q[1] * q[1] + q[2] * q[2] + q[3] * q[3]);
    return mag > 0 ? q.map((x) => x / mag) : [0, 0, 0, 1];
  }, [dir, len]);
  return (
    <mesh ref={ref} position={mid} quaternion={quaternion}>
      <cylinderGeometry args={[width, width, len, 10, 1, true]} />
      <meshStandardMaterial emissive={0x000000} metalness={0.3} roughness={0.6} />
    </mesh>
  );
}

function ArrowPulse({ from, to, progress = 0, color = "#ff9900" }) {
  const pos = [from[0] + (to[0] - from[0]) * progress, from[1] + (to[1] - from[1]) * progress, from[2] + (to[2] - from[2]) * progress];
  return (
    <mesh position={pos}>
      <coneGeometry args={[0.08, 0.18, 8]} />
      <meshStandardMaterial color={color} emissive={0xffffff} emissiveIntensity={0.4} />
    </mesh>
  );
}

// ---------- Main Visualizer Component ----------
export default function BackpropVisualizer({ layerSizes = [3, 5, 4, 2], input = [0.9, 0.1, 0.3], target = [1, 0] }) {
  const [network, setNetwork] = useState(() => initNetwork(layerSizes));
  const [positions, setPositions] = useState(() => {
    const gapX = 3;
    const gapY = 1.0;
    const pos = [];
    for (let l = 0; l < layerSizes.length; l++) {
      const layer = [];
      const count = layerSizes[l];
      const mid = (count - 1) / 2;
      for (let i = 0; i < count; i++) {
        layer.push([l * gapX, (mid - i) * gapY, 0]);
      }
      pos.push(layer);
    }
    return pos;
  });

  const [activations, setActivations] = useState(() => {
    const init = layerSizes.map((s, i) => new Array(s).fill(0));
    init[0] = input.slice();
    return init;
  });

  const [zs, setZs] = useState(() => layerSizes.slice(1).map((s) => new Array(s).fill(0)));
  const [gradients, setGradients] = useState(() => network.map((layer) => layer.weights.map((row) => row.map(() => 0))));
  const [arrows, setArrows] = useState([]);
  const [stage, setStage] = useState("idle"); // idle | forward | backprop | updating
  const [autoPlay, setAutoPlay] = useState(false);

  const runForward = async () => {
    if (stage !== "idle") return;
    setStage("forward");
    const { activations: acts, zs: zvals } = forward(network, input);
    for (let l = 0; l < acts.length; l++) {
      setActivations((prev) => {
        const copy = prev.map((arr) => arr.slice());
        for (let i = 0; i <= l; i++) copy[i] = acts[i].slice();
        return copy;
      });
      await new Promise((r) => setTimeout(r, 500));
    }
    setZs(zvals);
    setStage("idle");
  };

  const runBackprop = async () => {
    if (stage !== "idle") return;
    setStage("backprop");
    const { activations: acts, zs: zvals } = forward(network, input);
    setActivations(acts);
    setZs(zvals);
    const grads = backward(network, acts, zvals, target);
    const flat = [];
    for (let l = 0; l < grads.length; l++) {
      const layer = grads[l];
      for (let j = 0; j < layer.dW.length; j++) {
        for (let i = 0; i < layer.dW[j].length; i++) {
          flat.push({ l, j, i, val: layer.dW[j][i] });
        }
      }
    }
    const arrowsList = [];
    for (let l = network.length - 1; l >= 0; l--) {
      for (let j = 0; j < network[l].outSize; j++) {
        for (let i = 0; i < network[l].inSize; i++) {
          const from = positions[l + 1][j];
          const to = positions[l][i];
          arrowsList.push({ from, to, progress: 0, grad: grads[l].dW[j][i] });
        }
      }
    }
    setArrows(arrowsList);

    const steps = 60;
    for (let s = 0; s <= steps; s++) {
      const p = s / steps;
      setArrows((prev) => prev.map((a) => ({ ...a, progress: p })));
      setGradients((prev) => {
        const copy = prev.map((layer) => layer.map((row) => row.slice()));
        let idx = 0;
        for (let l = 0; l < copy.length; l++) {
          for (let j = 0; j < copy[l].length; j++) {
            for (let i = 0; i < copy[l][j].length; i++) {
              const targetVal = grads[l].dW[j][i];
              copy[l][j][i] = targetVal * p;
              idx++;
            }
          }
        }
        return copy;
      });
      await new Promise((r) => setTimeout(r, 20));
    }

    const lr = 0.8;
    const newNet = network.map((layer, li) => {
      const w = layer.weights.map((row, j) => row.map((val, i) => val - lr * grads[li].dW[j][i]));
      const b = layer.biases.map((bb, j) => bb - lr * grads[li].dB[j]);
      return { ...layer, weights: w, biases: b };
    });
    setNetwork(newNet);

    setStage("updating");
    await new Promise((r) => setTimeout(r, 400));
    setGradients((prev) => prev.map((layer) => layer.map((row) => row.map(() => 0))));
    setArrows([]);
    setStage("idle");
  };

  const reset = () => {
    setNetwork(initNetwork(layerSizes));
    setActivations(layerSizes.map((s) => new Array(s).fill(0)).map((arr, idx) => (idx === 0 ? input.slice() : arr)));
    setGradients(network.map((layer) => layer.weights.map((row) => row.map(() => 0))));
    setArrows([]);
    setStage("idle");
  };

  useEffect(() => {
    let mounted = true;
    async function run() {
      if (!autoPlay) return;
      await runForward();
      await new Promise((r) => setTimeout(r, 300));
      await runBackprop();
      if (mounted) setAutoPlay(false);
    }
    run();
    return () => (mounted = false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay]);

  const connections = [];
  for (let l = 0; l < network.length; l++) {
    for (let j = 0; j < network[l].outSize; j++) {
      for (let i = 0; i < network[l].inSize; i++) {
        connections.push({
          id: `c-${l}-${j}-${i}`,
          from: positions[l][i],
          to: positions[l + 1][j],
          weight: network[l].weights[j][i],
          grad: gradients[l] ? gradients[l][j][i] : 0,
        });
      }
    }
  }

  // Cyber grid bg applied here over the full page
  return (
    <div
      className="bg-cyber-grid animate-cyber-grid animate-cyber-grid-pulse"
      style={{
        minHeight: "100vh",
        width: "100vw",
        margin: 0,
        padding: 0,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center"
      }}
    >
      <div style={{
        width: "100%",
        height: "80vh",
        display: "flex",
        gap: 12,
        margin: "44px auto",
        maxWidth: 1550,
      }}>
        <div style={{ flex: 1, position: "relative", borderRadius: 10, overflow: "hidden", background: "#F8FAFC" }}>
          <Canvas camera={{ position: [6, 0, 8], fov: 50 }}>
            <ambientLight intensity={0.7} />
            <directionalLight position={[10, 10, 5]} intensity={0.6} />
            <pointLight position={[0, -5, 10]} intensity={0.3} />

            {/* neurons */}
            {positions.map((layerPos, l) =>
              layerPos.map((pos, i) => (
                <Neuron key={`n-${l}-${i}`} position={pos} activation={activations[l][i] ?? 0} label={`L${l}:${i}`} />
              ))
            )}

            {/* connections */}
            {connections.map((c) => (
              <Connection key={c.id} from={c.from} to={c.to} gradient={c.grad} intensity={Math.abs(c.weight)} />
            ))}

            {/* arrows */}
            {arrows.map((a, idx) => (
              <ArrowPulse key={idx} from={a.from} to={a.to} progress={a.progress} color={a.grad >= 0 ? "#10B981" : "#F59E0B"} />
            ))}

            <OrbitControls />
          </Canvas>

          {/* UI overlay */}
          <div style={{ position: "absolute", left: 12, top: 12, display: "flex", gap: 8, flexDirection: "column" }}>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={runForward} disabled={stage !== "idle"} style={btnStyle}>
                Step Forward
              </button>
              <button onClick={runBackprop} disabled={stage !== "idle"} style={btnStyle}>
                Run Backprop
              </button>
              <button onClick={() => setAutoPlay(true)} disabled={stage !== "idle"} style={btnStyle}>
                Auto Play
              </button>
              <button onClick={reset} style={btnStyleAlt}>
                Reset
              </button>
            </div>
            <div style={{ padding: 8, borderRadius: 8, background: "rgba(255,255,255,0.9)", boxShadow: "0 6px 18px rgba(0,0,0,0.08)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1F2937" }}>Info</div>
              <div style={{ fontSize: 12, color: "#475569" }}>Stage: {stage}</div>
              <div style={{ fontSize: 12, color: "#475569" }}>Input: [{input.map((x) => x.toFixed(2)).join(", ")}]</div>
              <div style={{ fontSize: 12, color: "#475569" }}>Target: [{target.map((x) => x.toFixed(2)).join(", ")}]</div>
            </div>
          </div>
        </div>

        {/* side panel with simple numeric values */}
        <div style={{
          width: 320,
          padding: 12,
          background: "#FFFFFF",
          borderRadius: 8,
          boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
          overflow: "auto"
        }}>
          <h3 style={{ marginTop: 0, color: "#1F2937" }}>Network Details</h3>
          {network.map((layer, li) => (
            <div key={`panel-${li}`} style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 700 }}>Layer {li} ➜ {li + 1}</div>
              <div style={{ fontSize: 12, color: "#475569" }}>Weights (excerpt):</div>
              <div style={{ maxHeight: 120, overflow: "auto", marginTop: 8 }}>
                {layer.weights.slice(0, 6).map((row, j) => (
                  <div key={`w-${li}-${j}`} style={{ fontSize: 12, marginBottom: 4 }}>
                    [{row.map((v, i) => v.toFixed(2)).join(", ")}]
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const btnStyle = {
  padding: "8px 10px",
  borderRadius: 8,
  border: "none",
  background: "#4B6CB7",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
};
const btnStyleAlt = {
  ...btnStyle,
  background: "#F59E0B",
};

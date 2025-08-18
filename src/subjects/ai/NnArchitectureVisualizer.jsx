import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';

export default function NNArchitectureVisualizer() {
  const [layers, setLayers] = useState([3, 5, 4, 2]);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [inputVec, setInputVec] = useState('0.5,0.1,0.9');
  const [activations, setActivations] = useState(null);

  const parsedInput = useMemo(() => {
    const a = inputVec.split(',').map(s => parseFloat(s.trim()));
    const inSize = layers[0];
    const out = new Array(inSize).fill(0);
    for (let i = 0; i < Math.min(inSize, a.length); i++) out[i] = Number.isFinite(a[i]) ? a[i] : 0;
    return out;
  }, [inputVec, layers]);

  // Simple random weights generator / deterministic for demo
  const weights = useMemo(() => {
    const rng = (s) => {
      let x = Math.sin(s) * 10000;
      return x - Math.floor(x);
    };
    const w = [];
    let seed = 1;
    for (let l = 0; l < layers.length - 1; l++) {
      const m = [];
      for (let i = 0; i < layers[l + 1]; i++) {
        const row = [];
        for (let j = 0; j < layers[l]; j++) {
          row.push((rng(seed++) - 0.5) * 2);
        }
        m.push(row);
      }
      w.push(m);
    }
    return w;
  }, [layers]);

  // Compute forward pass (sigmoid activations)
  const forward = (input) => {
    const acts = [input.slice()];
    for (let l = 0; l < weights.length; l++) {
      const next = new Array(layers[l + 1]).fill(0);
      for (let i = 0; i < layers[l + 1]; i++) {
        let s = 0;
        for (let j = 0; j < layers[l]; j++) {
          s += weights[l][i][j] * acts[l][j];
        }
        next[i] = 1 / (1 + Math.exp(-s));
      }
      acts.push(next);
    }
    return acts;
  };

  const runOnce = () => {
    const acts = forward(parsedInput);
    setActivations(acts);
    setPlaying(true);
  };

  const reset = () => {
    setActivations(null);
    setPlaying(false);
  };

  // --- Cyber grid full background applied here ---
  return (
    <div
      className="bg-cyber-grid animate-cyber-grid animate-cyber-grid-pulse"
      style={{
        minHeight: "100vh",
        width: "100vw",
        margin: 0,
        padding: 0,
        position: "relative",
        display: "flex",
        flexDirection: "column"
      }}
    >
      <div className="h-screen w-full flex flex-col">
        <div className="p-4 border-b bg-white shadow-sm flex items-center justify-between" style={{
          background: "rgba(250,252,255,0.96)",
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
        }}>
          <div>
            <h1 className="text-xl font-semibold" style={{ color: "#4B6CB7" }}>3D Neural Network Architecture Visualizer</h1>
            <p className="text-sm" style={{ color: "#67C8FF" }}>Interactive view of layers, neurons and activation flow</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-700">Speed</label>
            <input type="range" min="0.2" max="3" step="0.1" value={speed} onChange={e => setSpeed(Number(e.target.value))} />
            <button onClick={runOnce} className="px-3 py-1 rounded bg-indigo-500 text-white">Run Forward</button>
            <button onClick={reset} className="px-3 py-1 rounded border">Reset</button>
          </div>
        </div>

        <div className="flex flex-1">
          <div className="w-80 p-4 border-r bg-white" style={{
            background: "rgba(255,255,255,0.94)",
            backdropFilter: "blur(0.5px)",
          }}>
            <h2 className="font-medium" style={{ color: "#4B6CB7" }}>Controls</h2>

            <div className="mt-3">
              <label className="text-sm">Layers (comma-separated counts)</label>
              <input
                className="mt-1 w-full rounded border p-2"
                value={layers.join(',')}
                onChange={e => {
                  const arr = e.target.value.split(',').map(s => Math.max(1, Math.min(16, parseInt(s) || 0)));
                  setLayers(arr);
                  setActivations(null);
                }}
              />
              <p className="text-xs text-gray-500 mt-1">Example: 3,5,4,2</p>
            </div>

            <div className="mt-3">
              <label className="text-sm">Input vector (comma-separated)</label>
              <input className="mt-1 w-full rounded border p-2" value={inputVec} onChange={e => setInputVec(e.target.value)} />
              <p className="text-xs text-gray-500 mt-1">Will be clipped/padded to input layer size</p>
            </div>

            <div className="mt-4">
              <h3 className="font-semibold">Legend</h3>
              <div className="mt-2 text-sm text-gray-700">
                <div><span className="inline-block w-3 h-3 bg-green-400 mr-2 rounded-full" /> Activation (higher = greener)</div>
                <div className="mt-1"><span className="inline-block w-3 h-3 bg-gray-300 mr-2 rounded-full" /> Inactive neuron</div>
              </div>
            </div>

            <div className="mt-4 text-sm">
              <h3 className="font-medium">Activation values</h3>
              <div className="h-40 overflow-auto mt-2 bg-gray-50 p-2 rounded">
                {activations ? (
                  activations.map((layer, idx) => (
                    <div key={idx} className="mb-2">
                      <div className="font-medium">Layer {idx} ({layer.length})</div>
                      <div className="text-xs mt-1">{layer.map(v => v.toFixed(3)).join(', ')}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500">Run a forward pass to see values.</div>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 relative">
            <Canvas camera={{ position: [0, 0, 12], fov: 50 }}>
              <ambientLight intensity={0.6} />
              <directionalLight position={[5, 5, 5]} intensity={0.6} />
              <Scene layers={layers} activations={activations} speed={speed} playing={playing} setPlaying={setPlaying} />
              <OrbitControls />
            </Canvas>
          </div>
        </div>
      </div>
    </div>
  );
}

function Scene({ layers, activations, speed, playing, setPlaying }) {
  const spacingX = 3.0;
  const spacingY = 1.2;

  const layout = useMemo(() => {
    const all = [];
    for (let li = 0; li < layers.length; li++) {
      const row = [];
      const count = layers[li];
      const x = (li - (layers.length - 1) / 2) * spacingX;
      for (let ni = 0; ni < count; ni++) {
        const y = (ni - (count - 1) / 2) * spacingY;
        const z = 0;
        row.push([x, y, z]);
      }
      all.push(row);
    }
    return all;
  }, [layers]);

  const progRef = useRef(0);
  useFrame((state, delta) => {
    if (!playing) return;
    progRef.current += delta * speed;
    if (progRef.current > layers.length * 0.8) {
      progRef.current = 0;
      setPlaying(false);
    }
  });

  return (
    <group>
      {/* connections */}
      {layout.map((row, li) => {
        if (li === layout.length - 1) return null;
        return row.map((pos, ni) => (
          <Connections key={`c-${li}-${ni}`} fromPos={pos} toRow={layout[li + 1]} layerIdx={li} neuronIdx={ni} activations={activations} progRef={progRef} />
        ));
      })}

      {/* neurons */}
      {layout.map((row, li) => (
        <group key={`layer-${li}`}>
          {row.map((pos, ni) => (
            <Neuron key={`n-${li}-${ni}`} position={pos} layer={li} index={ni} activations={activations} progRef={progRef} />
          ))}
        </group>
      ))}
    </group>
  );
}

function Connections({ fromPos, toRow, layerIdx, neuronIdx, activations, progRef }) {
  // draw thin lines from fromPos to each neuron in toRow
  return (
    <group>
      {toRow.map((toPos, j) => {
        const key = `line-${layerIdx}-${neuronIdx}-${j}`;
        let brightness = 0.15;
        if (activations && activations[layerIdx] && activations[layerIdx][neuronIdx] !== undefined) {
          brightness = 0.15 + activations[layerIdx][neuronIdx] * 0.8;
        }
        const points = [fromPos, toPos];
        return (
          <lineSegments key={key}>
            <bufferGeometry attach="geometry">
              <bufferAttribute
                attachObject={['attributes', 'position']}
                count={points.length}
                array={new Float32Array(points.flat())}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial attach="material" linewidth={1} transparent opacity={0.9} />
          </lineSegments>
        );
      })}
    </group>
  );
}

function Neuron({ position, layer, index, activations, progRef }) {
  const mesh = useRef();
  const act = activations && activations[layer] && activations[layer][index] !== undefined ? activations[layer][index] : 0;

  useFrame(() => {
    const t = (performance.now() / 1000) % 10;
    const targetScale = 0.4 + act * 0.9 + Math.sin(t * 3 + layer + index) * 0.02;
    if (mesh.current) {
      mesh.current.scale.lerp({ x: targetScale, y: targetScale, z: targetScale }, 0.1);
    }
  });

  const color = act > 0 ? `rgb(${Math.floor((1 - act) * 180)}, ${Math.floor(100 + act * 155)}, ${Math.floor((1 - act) * 120)})` : 'rgb(200,200,200)';

  return (
    <mesh ref={mesh} position={position}>
      <sphereGeometry args={[0.25, 24, 24]} />
      <meshStandardMaterial color={color} metalness={0.2} roughness={0.6} />
      <Html distanceFactor={10} position={[0, -0.5, 0]}>
        <div className="bg-white/90 p-1 rounded text-xs shadow text-black" style={{ minWidth: 44, textAlign: 'center' }}>
          <div>{`L${layer}N${index}`}</div>
          <div>{activations && activations[layer] && activations[layer][index] !== undefined ? activations[layer][index].toFixed(3) : '-'}</div>
        </div>
      </Html>
    </mesh>
  );
}

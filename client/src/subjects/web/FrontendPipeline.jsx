import React, { useEffect, useRef, useState } from "react";

export default function AnimationInspector() {
  const [code, setCode] = useState(DEFAULT_SAMPLE);
  const [htmlPart, setHtmlPart] = useState("");
  const [cssPart, setCssPart] = useState("");
  const [jsPart, setJsPart] = useState("");
  const [animations, setAnimations] = useState([]);
  const [running, setRunning] = useState(true);
  const iframeRef = useRef(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    splitCode(code);
  }, []);

  useEffect(() => {
    const parsed = parseForAnimations(cssPart);
    setAnimations(parsed);
    updatePreview();
  }, [cssPart, htmlPart, jsPart]);

  function splitCode(full) {
    const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;

    let styles = "";
    let scripts = "";
    let html = full;

    html = html.replace(styleRegex, function (_, inner) {
      styles += "\n" + inner;
      return "";
    });

    html = html.replace(scriptRegex, function (_, inner) {
      scripts += "\n" + inner;
      return "";
    });

    if (!styles && !scripts) {
      const lines = full.split('\n');
      let cssLines = [];
      let htmlLines = [];
      let jsLines = [];
      let mode = 'html';
      for (let ln of lines) {
        if (/^\s*@(keyframes|media|supports)/.test(ln) || /animation(-name)?\s*:/i.test(ln) || /\{[^}]*animation/i.test(ln) || /transition\s*:/i.test(ln) || /\.[A-Za-z0-9_\-]+\s*\{/.test(ln)) {
          cssLines.push(ln);
          mode = 'css';
        } else if (/^\s*(function|const|let|var)\s+|=>|document\.|window\.|fetch\(|console\./.test(ln)) {
          jsLines.push(ln);
          mode = 'js';
        } else {
          if (mode === 'css') cssLines.push(ln);
          else if (mode === 'js') jsLines.push(ln);
          else htmlLines.push(ln);
        }
      }
      styles = cssLines.join('\n');
      scripts = jsLines.join('\n');
      html = htmlLines.join('\n');
    }

    setHtmlPart(html.trim());
    setCssPart(styles.trim());
    setJsPart(scripts.trim());
  }

  // FIXED: keyframes parsing error
  function parseForAnimations(css) {
    const results = [];

    if (!css || !css.trim()) return results;

    // Find @keyframes name blocks
    const keyframes = {};
    const kfRegex = /@keyframes\s+([A-Za-z0-9_\-]+)\s*\{([\s\S]*?)\}\s*/g;
    let m;
    while ((m = kfRegex.exec(css)) !== null) {
      const name = m[1];
      // FIXED LINE below:
      const body = typeof m === "string" ? m.trim() : "";
      keyframes[name] = body;
    }

    // Find selector rules and check for animation / transition properties
    const ruleRegex = /([^{]+)\{([^}]+)\}/g;
    while ((m = ruleRegex.exec(css)) !== null) {
      const selector = typeof m === "string" ? m.trim() : "";
      const body = typeof m === "string" ? m.trim() : "";

      const props = {};
      body.split(/;\s*/).forEach((line) => {
        const idx = line.indexOf(":");
        if (idx > -1) {
          const k = line.slice(0, idx).trim();
          const v = line.slice(idx + 1).trim();
          props[k] = v;
        }
      });

      // detect animation shorthand
      if (props['animation'] || props['animation-name'] || /animation\s*:/.test(body)) {
        const shorthand = props['animation'] || '';
        let name = props['animation-name'] || '';
        let duration = props['animation-duration'] || '';
        let timing = props['animation-timing-function'] || '';
        let iteration = props['animation-iteration-count'] || '';
        if (!name && shorthand) {
          const parts = shorthand.split(/\s+/).filter(Boolean);
          for (let p of parts) {
            if (/^[0-9.]+s$/.test(p) || /^[0-9.]+ms$/.test(p) || /ease|linear|ease-in|ease-out|ease-in-out|cubic-bezier/i.test(p) || p === 'infinite' || /^[0-9]+$/.test(p)) continue;
            name = p;
            break;
          }
          const dur = parts.find((p) => /^[0-9.]+m?s$/.test(p));
          if (dur) duration = dur;
          const iter = parts.find((p) => p === 'infinite' || /^[0-9]+$/.test(p));
          if (iter) iteration = iter;
        }

        results.push({
          type: 'animation',
          selector,
          name: name || shorthand || '(unknown)',
          duration: duration || 'initial',
          timing: timing || 'initial',
          iteration: iteration || '1',
          raw: body,
          keyframes: keyframes[name] || null,
        });
      }

      // detect transition
      if (props['transition'] || props['transition-property'] || /transition\s*:/.test(body)) {
        const shorthand = props['transition'] || '';
        results.push({
          type: 'transition',
          selector,
          raw: body,
          shorthand: shorthand || null,
        });
      }
    }

    return results;
  }

  function updatePreview() {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const doc = iframe.contentDocument || iframe.contentWindow.document;
    const full = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
html,body { height: 100%; margin: 0; padding: 8px; background: #0a0f1f; font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; }
${cssPart}

/* helper highlight styles injected by controller */
.__anim_inspector_highlight { outline: 3px dashed #67C8FF !important; box-shadow: 0 0 0 4px rgba(103,200,255,0.12) !important; z-index:999 !important; }
</style>
</head>
<body>
${htmlPart}
<script>
(function(){
  window.__animInspector = {
    play: function(){
      const all = document.querySelectorAll('*');
      all.forEach(el=>{
        if (el.style && getComputedStyle(el).animationName && getComputedStyle(el).animationName !== 'none'){
          el.style.animationPlayState = 'running';
        }
      });
    },
    pause: function(){
      const all = document.querySelectorAll('*');
      all.forEach(el=>{
        if (el.style && getComputedStyle(el).animationName && getComputedStyle(el).animationName !== 'none'){
          el.style.animationPlayState = 'paused';
        }
      });
    },
    highlightSelector: function(sel){
      document.querySelectorAll('.__anim_inspector_highlight').forEach(el=>el.classList.remove('__anim_inspector_highlight'));
      try{
        document.querySelectorAll(sel).forEach(el=>el.classList.add('__anim_inspector_highlight'));
      }catch(e){}
    },
    clearHighlight: function(){
      document.querySelectorAll('.__anim_inspector_highlight').forEach(el=>el.classList.remove('__anim_inspector_highlight'));
    }
  };

  window.addEventListener('message', function(ev){
    const d = ev.data || {};
    if(d.type === 'anim-inspector'){
      if(d.cmd === 'play') window.__animInspector.play();
      else if(d.cmd === 'pause') window.__animInspector.pause();
      else if(d.cmd === 'highlight') window.__animInspector.highlightSelector(d.selector || '');
      else if(d.cmd === 'clearHighlight') window.__animInspector.clearHighlight();
    }
  }, false);
})();
</script>
<script>
${jsPart}
</script>
</body>
</html>`;

    doc.open();
    doc.write(full);
    doc.close();
  }

  function postToPreview(message) {
    const iframe = iframeRef.current;
    if (!iframe) return;
    iframe.contentWindow.postMessage({ type: 'anim-inspector', ...message }, '*');
  }

  function handleRunPause() {
    if (running) {
      postToPreview({ cmd: 'pause' });
      setRunning(false);
    } else {
      postToPreview({ cmd: 'play' });
      setRunning(true);
    }
  }

  function handleSelect(anim) {
    setSelected(anim);
    postToPreview({ cmd: 'highlight', selector: anim.selector });
  }

  function handleClearHighlight() {
    setSelected(null);
    postToPreview({ cmd: 'clearHighlight' });
  }

  function handleAnalyzeClick() {
    splitCode(code);
    const parsed = parseForAnimations(cssPart);
    setAnimations(parsed);
    updatePreview();
  }

  return (
    <div className="min-h-screen bg-black relative">
      {/* Cyber Grid Background */}
      <div className="absolute inset-0 bg-cyber-grid animate-cyber-grid animate-cyber-grid-pulse z-0"></div>
      <div className="relative max-w-7xl mx-auto z-10 p-6">
        <h1 className="text-2xl font-extrabold mb-4 text-cyan-400 drop-shadow-[0_0_10px_#67C8FF]">
          Frontend Animation Inspector — Prototype
        </h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Code input panel */}
          <div className="glass-card col-span-1 rounded-2xl shadow-lg bg-black/60 border border-cyan-400/40 p-4">
            <label className="block text-sm font-medium mb-2 text-cyan-200">Paste HTML / CSS / JS</label>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={16}
              className="w-full p-3 rounded-xl border border-cyan-800 bg-black/70 font-mono text-sm text-cyan-100 focus:outline-cyan-400 focus:border-cyan-400 shadow"
              spellCheck={false}
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => { splitCode(code); updatePreview(); }}
                className="px-3 py-2 rounded-xl bg-cyan-500/80 hover:bg-cyan-400 text-white shadow transition border border-cyan-300"
              >Apply & Preview</button>
              <button
                onClick={() => { setCode(DEFAULT_SAMPLE); splitCode(DEFAULT_SAMPLE); updatePreview(); }}
                className="px-3 py-2 rounded-xl bg-white/10 border border-cyan-500 text-cyan-200"
              >Reset sample</button>
              <button
                onClick={() => { navigator.clipboard && navigator.clipboard.writeText(code); }}
                className="px-3 py-2 rounded-xl bg-white/10 border border-cyan-500 text-cyan-200"
              >Copy</button>
            </div>

            <div className="mt-4 bg-black/60 p-3 rounded-xl border border-cyan-700 text-cyan-300">
              <h3 className="font-medium">Detected parts</h3>
              <div className="text-sm mt-2 space-y-1">
                <div><strong>HTML</strong>: {htmlPart ? `${htmlPart.slice(0, 60).replace(/\n/g, ' ')}${htmlPart.length>60?'...':''}` : '—'}</div>
                <div><strong>CSS</strong>: {cssPart ? `${cssPart.slice(0, 60).replace(/\n/g, ' ')}${cssPart.length>60?'...':''}` : '—'}</div>
                <div><strong>JS</strong>: {jsPart ? `${jsPart.slice(0, 60).replace(/\n/g, ' ')}${jsPart.length>60?'...':''}` : '—'}</div>
              </div>
            </div>
          </div>
          {/* Animations panel */}
          <div className="glass-card col-span-1 rounded-2xl shadow-lg bg-black/60 border border-cyan-400/40 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-cyan-200">Animations & Transitions</h3>
              <div className="flex items-center gap-2">
                <button onClick={handleRunPause}
                  className="px-3 py-1 rounded-xl border border-cyan-600 text-cyan-200 bg-black/50 shadow">{running ? 'Pause' : 'Play'}</button>
                <button onClick={handleClearHighlight}
                  className="px-3 py-1 rounded-xl border border-cyan-600 text-cyan-200 bg-black/50 shadow">Clear</button>
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              {animations.length === 0 && (
                <div className="text-sm text-cyan-600">No animations or transitions detected. Try pasting CSS with <code className="font-mono">animation</code> or <code>@keyframes</code> rules.</div>
              )}
              <ul className="space-y-2 mt-2">
                {animations.map((a, idx) => (
                  <li key={idx}
                      className={`p-2 rounded-xl border ${selected===a? 'border-cyan-400 bg-black/30 shadow':'border-cyan-700 bg-black/10'}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm font-bold text-cyan-300">{a.type.toUpperCase()} — <span className="font-mono">{a.selector}</span></div>
                        {a.type === 'animation' && (
                          <div className="text-xs text-cyan-200 mt-1">name: <code className="font-mono">{a.name}</code> • duration: <code className="font-mono">{a.duration}</code> • iteration: <code className="font-mono">{a.iteration}</code></div>
                        )}
                        {a.type === 'transition' && (
                          <div className="text-xs text-cyan-200 mt-1">transition: <code className="font-mono">{a.shorthand || a.raw}</code></div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <button onClick={() => handleSelect(a)} className="px-2 py-1 rounded-xl border border-cyan-600 text-xs text-cyan-200 bg-black/50 shadow">Highlight</button>
                        <button onClick={() => { navigator.clipboard && navigator.clipboard.writeText(a.raw || a.shorthand || a.name || ''); }}
                          className="px-2 py-1 rounded-xl border border-cyan-600 text-xs text-cyan-200 bg-black/50 shadow">Copy rule</button>
                      </div>
                    </div>
                    {a.keyframes && (
                      <pre className="mt-2 p-2 bg-black/70 rounded-xl text-xs overflow-auto text-cyan-300 font-mono">{a.keyframes}</pre>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {/* Live preview panel */}
          <div className="glass-card col-span-1 rounded-2xl shadow-lg bg-black/60 border border-cyan-400/40 p-4 flex flex-col">
            <h3 className="font-bold text-cyan-200 mb-2">Live Preview</h3>
            <div className="flex-1 border-2 border-cyan-700 bg-black/40 rounded-xl overflow-hidden">
              <iframe ref={iframeRef} title="preview" sandbox="allow-scripts allow-same-origin"
                style={{ width: '100%', height: '420px', border: '0', background: 'transparent' }} />
            </div>
            <div className="text-xs text-cyan-400 mt-2">
              Use the controls to play/pause and highlight selectors. The inspector injects a control layer into the iframe for communication via postMessage.
            </div>
          </div>
        </div>
        {/* Cyberpunk notes section */}
        <div className="mt-8 text-sm text-cyan-100 bg-black/50 p-4 rounded-xl border border-cyan-700 shadow">
          <h3 className="font-bold mb-2 text-cyan-200">Notes / Limitations</h3>
          <ul className="mt-1 list-disc ml-5 text-cyan-300">
            <li>Parser is heuristic and simplified — complex CSS (Sass, nested rules, media queries) may not be parsed correctly.</li>
            <li>JS-based animations (GSAP, anime.js, framer-motion) are only detected by naive regex — deeper static analysis would require an AST-based parser.</li>
            <li>Scrubbing per-frame is not implemented in this prototype (play/pause & highlight available). You can extend the injected controller to implement fine-grained timeline control.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

const DEFAULT_SAMPLE = `
<!-- Sample HTML -->
<div style="display:flex; gap:16px; align-items:center; justify-content:center; height:160px;">
  <div class="box">Bounce</div>
  <div class="fade">Fade</div>
  <button class="hover-btn">Hover me</button>
</div>

<style>
.box {
  width:100px; height:100px; background: linear-gradient(90deg,#67C8FF,#4B6CB7); color:white; display:flex; align-items:center; justify-content:center; border-radius:8px;
  animation: bounce 2s ease infinite;
}
@keyframes bounce {
  0% { transform: translateY(0); }
  50% { transform: translateY(-36px); }
  100% { transform: translateY(0); }
}

.fade {
  width:100px; height:100px; background:#10B981; color:white; display:flex; align-items:center; justify-content:center; border-radius:8px;
  animation: fadein 3s linear 0s 1;
}
@keyframes fadein{
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.hover-btn {
  padding: 10px 14px; border-radius:6px; border:none; background:#111827; color:white;
  transition: transform 200ms ease, background 200ms ease;
}
.hover-btn:hover {
  transform: translateY(-6px) scale(1.02);
  background:#4B6CB7;
}
</style>

<script>
const btn = document.querySelector('.hover-btn');
btn && btn.addEventListener('click', () => {
  alert('Button clicked in preview');
});
</script>
`;

import { useState, useRef } from "react";

const PALETTE = ["#FF6B6B","#4ECDC4","#FFD93D","#A78BFA","#6BCB77","#F4845F","#74C0FC","#F783AC"];

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function lastNDays(n) {
  const arr = [];
  for (let i = n-1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    arr.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`);
  }
  return arr;
}

function shortDay(ds) { return ["S","M","T","W","T","F","S"][new Date(ds).getDay()]; }
function monLabel(ds)  { return new Date(ds).toLocaleDateString("en-US",{month:"short"}); }

function getBestStreak(habits, days) {
  if (!habits.length) return 0;
  let best = 0, cur = 0;
  for (const d of days) {
    if (habits.every(h => !!h.done[d])) { cur++; if (cur > best) best = cur; }
    else cur = 0;
  }
  return best;
}

function LineGraph({ scores, days, monthly }) {
  const W = 460, H = 150;
  const pl=32, pr=12, pt=22, pb=26;
  const cW = W-pl-pr, cH = H-pt-pb;
  const n = days.length;
  const today = todayKey();

  const pts = scores.map((s,i) => ({
    x: pl + (n===1 ? cW/2 : i/(n-1)*cW),
    y: pt + cH - s*cH,
  }));

  let pathD = "";
  if (pts.length >= 2) {
    pathD = `M${pts[0].x},${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const mx = (pts[i-1].x + pts[i].x)/2;
      pathD += ` C${mx},${pts[i-1].y} ${mx},${pts[i].y} ${pts[i].x},${pts[i].y}`;
    }
  }
  const areaD = pts.length >= 2
    ? pathD + ` L${pts[n-1].x},${pt+cH} L${pts[0].x},${pt+cH} Z`
    : "";

  const gid = `g${monthly?"m":"w"}`;
  const labelStep = monthly ? 7 : 2;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"
      style={{ display:"block", overflow:"visible" }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6c6fff" stopOpacity="0.28"/>
          <stop offset="100%" stopColor="#6c6fff" stopOpacity="0.02"/>
        </linearGradient>
        <filter id="gl">
          <feGaussianBlur stdDeviation="2" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {[0,0.5,1].map(g => (
        <g key={g}>
          <line x1={pl} y1={pt+cH-g*cH} x2={W-pr} y2={pt+cH-g*cH} stroke="#1a1a26" strokeWidth="1"/>
          <text x={pl-4} y={pt+cH-g*cH+4} fontSize="8" fill="#252540" textAnchor="end" fontFamily="monospace">
            {Math.round(g*100)}
          </text>
        </g>
      ))}

      {areaD && <path d={areaD} fill={`url(#${gid})`}/>}
      {pathD  && <path d={pathD} fill="none" stroke="#6c6fff" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round" filter="url(#gl)"/>}

      {pts.map((p,i) => (
        <circle key={i} cx={p.x} cy={p.y}
          r={days[i]===today ? 5 : 3.5}
          fill={days[i]===today ? "#6c6fff" : "#0b0b0e"}
          stroke="#6c6fff" strokeWidth="2"/>
      ))}

      {pts.length > 0 && (() => {
        const lp = pts[pts.length-1];
        const sc = scores[scores.length-1];
        return <>
          <line x1={lp.x} y1={pt} x2={lp.x} y2={pt+cH}
            stroke="#6c6fff" strokeWidth="1" strokeDasharray="3,5" opacity="0.35"/>
          <text x={lp.x} y={pt-6} textAnchor="middle" fontSize="8" fill="#6c6fff" fontFamily="monospace">NOW</text>
          <rect x={lp.x-17} y={lp.y-18} width={34} height={14} rx="4" fill="#6c6fff" opacity="0.18"/>
          <text x={lp.x} y={lp.y-8} textAnchor="middle" fontSize="9" fill="#6c6fff" fontFamily="monospace" fontWeight="bold">
            {Math.round(sc*100)}%
          </text>
        </>;
      })()}

      {days.map((d,i) => {
        if (i % labelStep !== 0) return null;
        const x = pl + (n===1 ? cW/2 : i/(n-1)*cW);
        const lbl = monthly ? `${monLabel(d)}${new Date(d).getDate()}` : shortDay(d);
        return (
          <text key={d} x={x} y={H-7} textAnchor="middle" fontSize="8.5"
            fill={d===today ? "#6c6fff" : "#252540"} fontFamily="monospace"
            fontWeight={d===today ? "bold" : "normal"}>{lbl}</text>
        );
      })}
    </svg>
  );
}

function Heatmap({ days, habits, today }) {
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
      {days.map(d => {
        const frac = habits.length ? habits.filter(h=>!!h.done[d]).length / habits.length : 0;
        const isToday = d === today;
        const bg = frac===0 ? "#1a1a24" : frac<0.4 ? "#6c6fff30" : frac<0.75 ? "#6c6fff80" : "#6c6fff";
        return (
          <div key={d} title={`${d}: ${Math.round(frac*100)}%`} style={{
            width:28, height:28, borderRadius:6, background:bg,
            border: isToday ? "2px solid #6c6fff" : "2px solid transparent",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:8, color:"rgba(255,255,255,0.5)", fontFamily:"monospace",
          }}>
            {new Date(d).getDate()}
          </div>
        );
      })}
      <div style={{ width:"100%", display:"flex", gap:8, alignItems:"center", marginTop:8 }}>
        <span style={{ fontSize:9, color:"#252538" }}>less</span>
        {["#1a1a24","#6c6fff30","#6c6fff80","#6c6fff"].map(c => (
          <div key={c} style={{ width:14, height:14, borderRadius:3, background:c }}/>
        ))}
        <span style={{ fontSize:9, color:"#252538" }}>more</span>
      </div>
    </div>
  );
}

export default function App() {
  const [habits, setHabits] = useState([]);
  const [text,   setText]   = useState("");
  const [color,  setColor]  = useState(PALETTE[0]);
  const inputRef = useRef(null);

  const today = todayKey();
  const d14   = lastNDays(14);
  const d7    = lastNDays(7);
  const d30   = lastNDays(30);

  function handleAdd() {
    const name = text.trim();
    if (!name) { inputRef.current && inputRef.current.focus(); return; }
    setHabits(prev => [...prev, { id: Date.now(), name, color, done: {} }]);
    setText("");
    setColor(PALETTE[Math.floor(Math.random() * PALETTE.length)]);
  }

  function handleToggle(id) {
    setHabits(prev => prev.map(h =>
      h.id === id ? { ...h, done: { ...h.done, [today]: !h.done[today] } } : h
    ));
  }

  function handleDelete(id) {
    setHabits(prev => prev.filter(h => h.id !== id));
  }

  const todayDone = habits.filter(h => !!h.done[today]).length;
  const todayPct  = habits.length ? Math.round(todayDone / habits.length * 100) : 0;

  function scores(days) {
    return days.map(d =>
      habits.length ? habits.filter(h => !!h.done[d]).length / habits.length : 0
    );
  }

  const weekTotal = d7.reduce((a,d) => a + habits.filter(h=>!!h.done[d]).length, 0);
  const weekPct   = habits.length ? Math.round(weekTotal / (d7.length * habits.length) * 100) : 0;

  const monthStats = habits.map(h => {
    const done = d30.filter(d => !!h.done[d]).length;
    return { ...h, mp: Math.round(done/30*100), md: done };
  });
  const sorted = [...monthStats].sort((a,b) => b.mp - a.mp);

  const Divider = ({ label }) => (
    <div style={{ display:"flex", alignItems:"center", gap:10, margin:"32px 0 16px" }}>
      <div style={{ flex:1, height:1, background:"#181822" }}/>
      <span style={{ fontSize:9, color:"#252540", fontFamily:"monospace", letterSpacing:"0.14em", whiteSpace:"nowrap" }}>{label}</span>
      <div style={{ flex:1, height:1, background:"#181822" }}/>
    </div>
  );

  const Card = ({ children, style={} }) => (
    <div style={{ background:"#141418", border:"1.5px solid #1e1e28", borderRadius:16, padding:"16px 18px", ...style }}>
      {children}
    </div>
  );

  const MiniLabel = ({ text: t }) => (
    <div style={{ fontSize:9, color:"#252540", fontFamily:"monospace", letterSpacing:"0.12em", marginBottom:14 }}>{t}</div>
  );

  const Legend = () => (
    <div style={{ display:"flex", flexWrap:"wrap", gap:"5px 12px", justifyContent:"center", marginTop:8 }}>
      {habits.map(h => (
        <div key={h.id} style={{ display:"flex", alignItems:"center", gap:4 }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:h.color }}/>
          <span style={{ fontSize:10, color:"#303050" }}>{h.name}</span>
        </div>
      ))}
      <div style={{ display:"flex", alignItems:"center", gap:4 }}>
        <div style={{ width:14, height:2, background:"#6c6fff", borderRadius:1 }}/>
        <span style={{ fontSize:10, color:"#6c6fff" }}>overall %</span>
      </div>
    </div>
  );

  return (
    <div style={{
      minHeight:"100vh", background:"#0b0b0e", color:"#f0f0ec",
      fontFamily:"'Syne','Segoe UI',sans-serif", padding:"32px 16px 80px"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        button { cursor:pointer; }
        input:focus { border-color:#6c6fff !important; }
      `}</style>

      <div style={{ maxWidth:520, margin:"0 auto" }}>

        {/* HEADER */}
        <div style={{ marginBottom:28 }}>
          <div style={{ fontSize:10, color:"#22223a", fontFamily:"monospace", letterSpacing:"0.14em", marginBottom:6 }}>
            {new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"}).toUpperCase()}
          </div>
          <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between" }}>
            <h1 style={{ fontSize:34, fontWeight:800, letterSpacing:"-0.04em" }}>
              habits<span style={{ color:"#6c6fff" }}>.</span>
            </h1>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontFamily:"monospace", fontSize:26, fontWeight:700, color:"#6c6fff" }}>
                {todayPct}<span style={{ fontSize:14, color:"#252540" }}>%</span>
              </div>
              <div style={{ fontSize:9, color:"#252540", letterSpacing:"0.1em" }}>TODAY</div>
            </div>
          </div>
          <div style={{ height:3, background:"#181822", borderRadius:10, marginTop:14, overflow:"hidden" }}>
            <div style={{
              height:"100%", borderRadius:10, width:`${todayPct}%`,
              background:"linear-gradient(90deg,#6c6fff,#a0a0ff)",
              transition:"width 0.5s cubic-bezier(.4,0,.2,1)"
            }}/>
          </div>
        </div>

        {/* ADD HABIT */}
        <div style={{ background:"#141418", border:"1.5px solid #1e1e28", borderRadius:16, padding:16, marginBottom:20 }}>
          <div style={{ display:"flex", gap:8, marginBottom:12 }}>
            <input
              ref={inputRef}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key==="Enter") handleAdd(); }}
              placeholder="Type a habit name…"
              style={{
                flex:1, background:"#0b0b0e", border:"1.5px solid #2a2a3a",
                borderRadius:10, color:"#f0f0ec",
                fontFamily:"'Syne','Segoe UI',sans-serif", fontSize:14,
                padding:"10px 14px", outline:"none",
              }}
            />
            <button
              onClick={handleAdd}
              style={{
                background:"#6c6fff", border:"none", borderRadius:10,
                color:"#fff", fontFamily:"'Syne','Segoe UI',sans-serif",
                fontSize:14, fontWeight:700, padding:"10px 20px",
                whiteSpace:"nowrap",
              }}
              onMouseOver={e=>e.currentTarget.style.background="#5555ee"}
              onMouseOut={e=>e.currentTarget.style.background="#6c6fff"}
            >
              + Add
            </button>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <span style={{ fontSize:10, color:"#303050", fontFamily:"monospace" }}>COLOR</span>
            {PALETTE.map(c => (
              <div key={c} onClick={() => setColor(c)} style={{
                width:22, height:22, borderRadius:"50%", background:c, cursor:"pointer",
                border: color===c ? "3px solid #fff" : "3px solid transparent",
                transform: color===c ? "scale(1.18)" : "scale(1)",
                transition:"all 0.15s",
              }}/>
            ))}
          </div>
        </div>

        {/* HABIT LIST */}
        <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:8 }}>
          {habits.length === 0 && (
            <div style={{ textAlign:"center", padding:"36px 0" }}>
              <div style={{ fontSize:36, marginBottom:10 }}>🌱</div>
              <div style={{ fontSize:14, color:"#252540" }}>No habits yet — add one above</div>
            </div>
          )}
          {habits.map((h, i) => {
            const done = !!h.done[today];
            return (
              <div key={h.id} onClick={() => handleToggle(h.id)} style={{
                display:"flex", alignItems:"center", gap:12,
                padding:"13px 16px", borderRadius:14, background:"#141418",
                border:`1.5px solid ${done ? h.color+"55" : "#1e1e28"}`,
                cursor:"pointer", userSelect:"none", transition:"border-color 0.2s",
                animation:`fadeUp 0.28s ease ${i*0.05}s both`,
              }}>
                <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
                <div style={{ width:3, height:38, borderRadius:2, flexShrink:0,
                  background: done ? h.color : "#252540", transition:"background 0.2s" }}/>
                <div style={{
                  width:34, height:34, borderRadius:"50%", flexShrink:0,
                  border:`2px solid ${done ? h.color : "#2a2a40"}`,
                  background: done ? h.color+"22" : "transparent",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:17, color: done ? h.color : "transparent", transition:"all 0.18s",
                }}>✓</div>
                <span style={{ flex:1, fontSize:15, fontWeight:600,
                  color: done ? "#f0f0ec" : "#3a3a58", transition:"color 0.2s" }}>
                  {h.name}
                </span>
                <div style={{ width:8, height:8, borderRadius:"50%", background:h.color,
                  opacity: done ? 1 : 0.18, transition:"opacity 0.2s" }}/>
                <button onClick={e => { e.stopPropagation(); handleDelete(h.id); }} style={{
                  background:"none", border:"none", color:"#252540",
                  fontSize:14, padding:"3px 6px", borderRadius:6, transition:"color 0.15s",
                }}
                  onMouseOver={e=>e.currentTarget.style.color="#FF6B6B"}
                  onMouseOut={e=>e.currentTarget.style.color="#252540"}
                >✕</button>
              </div>
            );
          })}
        </div>

        {/* 14-DAY GRAPH */}
        <Divider label="14-DAY OVERALL PROGRESS"/>
        {habits.length > 0 ? (
          <><LineGraph scores={scores(d14)} days={d14} monthly={false}/><Legend/></>
        ) : (
          <div style={{ textAlign:"center", color:"#1e1e2a", padding:"20px 0", fontSize:13 }}>
            Add habits to see your progress graph
          </div>
        )}

        {/* WEEKLY */}
        <Divider label="THIS WEEK"/>
        {habits.length > 0 ? (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
              {[
                { label:"COMPLETION", value:`${weekPct}%`,                          color:"#6c6fff" },
                { label:"TOTAL DONE",  value:weekTotal,                              color:"#4ECDC4" },
                { label:"BEST STREAK", value:`${getBestStreak(habits,d7)}d`,         color:"#FFD93D" },
              ].map(s => (
                <Card key={s.label}>
                  <div style={{ fontFamily:"monospace", fontSize:22, fontWeight:700, color:s.color }}>{s.value}</div>
                  <div style={{ fontSize:9, color:"#252540", marginTop:5, letterSpacing:"0.1em", fontFamily:"monospace" }}>{s.label}</div>
                </Card>
              ))}
            </div>
            <Card>
              <MiniLabel text="DAILY BREAKDOWN"/>
              <div style={{ display:"flex", gap:6, justifyContent:"space-between" }}>
                {d7.map(d => {
                  const cnt = habits.filter(h=>!!h.done[d]).length;
                  const frac = habits.length ? cnt/habits.length : 0;
                  const isToday = d===today;
                  return (
                    <div key={d} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
                      <div style={{ fontSize:10, color:isToday?"#6c6fff":"#252540",
                        fontWeight:isToday?"bold":"normal", fontFamily:"monospace" }}>{shortDay(d)}</div>
                      <div style={{ width:"100%", height:70, background:"#111118", borderRadius:8, position:"relative", overflow:"hidden" }}>
                        <div style={{
                          position:"absolute", bottom:0, left:0, right:0,
                          height:`${frac*100}%`,
                          background: isToday ? "linear-gradient(180deg,#6c6fff,#a0a0ff)" : "#252540",
                          borderRadius:8, transition:"height 0.5s cubic-bezier(.4,0,.2,1)"
                        }}/>
                      </div>
                      <div style={{ fontSize:10, color:isToday?"#6c6fff":"#303050", fontFamily:"monospace" }}>{cnt}/{habits.length}</div>
                    </div>
                  );
                })}
              </div>
            </Card>
            <Card>
              <MiniLabel text="PER HABIT THIS WEEK"/>
              {habits.map(h => {
                const d7done = d7.filter(d=>!!h.done[d]).length;
                const p = Math.round(d7done/7*100);
                return (
                  <div key={h.id} style={{ marginBottom:12 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                      <span style={{ fontSize:13, fontWeight:600 }}>{h.name}</span>
                      <span style={{ fontFamily:"monospace", fontSize:12, color:h.color, fontWeight:700 }}>{d7done}/7</span>
                    </div>
                    <div style={{ height:5, background:"#111118", borderRadius:10, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${p}%`, background:h.color, borderRadius:10, transition:"width 0.6s" }}/>
                    </div>
                  </div>
                );
              })}
            </Card>
          </div>
        ) : (
          <div style={{ textAlign:"center", color:"#1e1e2a", padding:"20px 0", fontSize:13 }}>Add habits to see weekly analysis</div>
        )}

        {/* MONTHLY */}
        <Divider label="THIS MONTH (30 DAYS)"/>
        {habits.length > 0 ? (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <LineGraph scores={scores(d30)} days={d30} monthly={true}/>
            <Legend/>
            {sorted.length >= 2 && (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <Card style={{ borderColor: sorted[0].color+"55" }}>
                  <div style={{ fontSize:9, color:"#252540", fontFamily:"monospace", letterSpacing:"0.1em", marginBottom:8 }}>🏆 BEST</div>
                  <div style={{ fontSize:14, fontWeight:700, color:sorted[0].color, marginBottom:4,
                    whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{sorted[0].name}</div>
                  <div style={{ fontFamily:"monospace", fontSize:22, fontWeight:700, color:sorted[0].color }}>
                    {sorted[0].mp}<span style={{fontSize:13}}>%</span>
                  </div>
                </Card>
                <Card style={{ borderColor: sorted[sorted.length-1].color+"55" }}>
                  <div style={{ fontSize:9, color:"#252540", fontFamily:"monospace", letterSpacing:"0.1em", marginBottom:8 }}>📉 NEEDS WORK</div>
                  <div style={{ fontSize:14, fontWeight:700, color:sorted[sorted.length-1].color, marginBottom:4,
                    whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{sorted[sorted.length-1].name}</div>
                  <div style={{ fontFamily:"monospace", fontSize:22, fontWeight:700, color:sorted[sorted.length-1].color }}>
                    {sorted[sorted.length-1].mp}<span style={{fontSize:13}}>%</span>
                  </div>
                </Card>
              </div>
            )}
            <Card>
              <MiniLabel text="30-DAY PER HABIT"/>
              {monthStats.map(h => (
                <div key={h.id} style={{ marginBottom:14 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                    <span style={{ fontSize:13, fontWeight:600 }}>{h.name}</span>
                    <span style={{ fontFamily:"monospace", fontSize:12, color:h.color, fontWeight:700 }}>{h.md}/30</span>
                  </div>
                  <div style={{ height:6, background:"#111118", borderRadius:10, overflow:"hidden", marginBottom:2 }}>
                    <div style={{ height:"100%", width:`${h.mp}%`, background:h.color, borderRadius:10, transition:"width 0.7s" }}/>
                  </div>
                  <div style={{ fontSize:9, color:"#252540", fontFamily:"monospace", textAlign:"right" }}>{h.mp}%</div>
                </div>
              ))}
            </Card>
            <Card>
              <MiniLabel text="ACTIVITY HEATMAP"/>
              <Heatmap days={d30} habits={habits} today={today}/>
            </Card>
          </div>
        ) : (
          <div style={{ textAlign:"center", color:"#1e1e2a", padding:"20px 0", fontSize:13 }}>Add habits to see monthly analysis</div>
        )}

      </div>
    </div>
  );
}

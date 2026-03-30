// npm run build && npm start  (produção com Electron)
// npm run dev                 (apenas frontend, mock mode)

import React, { useState, useEffect } from 'react';
import './App.css';

const MOCK_MODE   = true;
const HISTORY_LEN = 60;

const clamp = (v, mn, mx) => Math.min(Math.max(v, mn), mx);
const pct   = (v, mn, mx) => clamp((v - mn) / (mx - mn), 0, 1);

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTES — PERFORMANCE (cockpit)
// ═══════════════════════════════════════════════════════════════════════════════

function Gauge({ value, min, max, label, unit, size = 240, colorVar = '--cockpit-rpm', warn = null, danger = null }) {
  const r = 82, cx = size / 2, cy = size / 2 + 8;
  const sa = -220, ea = 40, arc = ea - sa;
  const rad = d => d * Math.PI / 180;
  const pt  = (a, rr) => ({ x: cx + rr * Math.cos(rad(a)), y: cy + rr * Math.sin(rad(a)) });
  const ap  = (rr, f, t) => { const s = pt(f,rr), e = pt(t,rr); return `M${s.x} ${s.y}A${rr} ${rr} 0 ${t-f>180?1:0} 1 ${e.x} ${e.y}`; };
  const p   = pct(value, min, max);
  const fa  = sa + p * arc;
  const nt  = pt(fa, r-8), nb1 = pt(fa+90, 7), nb2 = pt(fa-90, 7);
  const ticks = Array.from({length:11}, (_,i) => {
    const a = sa + (i/10)*arc; const mj = i%2===0;
    return { o: pt(a, r+5), i: pt(a, r-(mj?14:7)), mj };
  });

  const color = `var(${colorVar})`;
  const warnColor  = 'var(--c-amber)';
  const dangerColor= 'var(--c-red)';

  let ac = color;
  if (danger != null && value >= danger) ac = dangerColor;
  else if (warn != null && value >= warn) ac = warnColor;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{overflow:'visible'}}>
      <circle cx={cx} cy={cy} r={r+16} fill="none" stroke="var(--cockpit-surface)"  strokeWidth="3"/>
      <circle cx={cx} cy={cy} r={r+16} fill="none" stroke="var(--cockpit-border)" strokeWidth="0.5"/>
      <path d={ap(r,sa,ea)} fill="none" stroke="var(--track)" strokeWidth="14" strokeLinecap="round"/>
      {danger!=null && <path d={ap(r, sa+pct(danger,min,max)*arc, ea)} fill="none" stroke="var(--cockpit-danger-zone)" strokeWidth="14" strokeLinecap="round"/>}
      {p>0.005 && <path d={ap(r,sa,fa)} fill="none" stroke={ac} strokeWidth="14" strokeLinecap="round"
        style={{transition:'all .3s ease-out', filter:`drop-shadow(0 0 5px ${ac}88)`}}/>}
      {ticks.map((t,i) => <line key={i} x1={t.i.x} y1={t.i.y} x2={t.o.x} y2={t.o.y}
        stroke={t.mj?'var(--cockpit-tick-major)':'var(--cockpit-tick-minor)'} strokeWidth={t.mj?1.5:.8}/>)}
      <polygon points={`${nt.x},${nt.y} ${nb1.x},${nb1.y} ${nb2.x},${nb2.y}`} fill={ac}
        style={{transition:'all .3s ease-out', filter:`drop-shadow(0 0 4px ${ac})`}}/>
      <circle cx={cx} cy={cy} r={11} fill="var(--cockpit-needle-bg)" stroke="var(--cockpit-center)" strokeWidth="1.5"/>
      <circle cx={cx} cy={cy} r={4}  fill={ac}/>
      <text x={cx} y={cy+30} textAnchor="middle" fill="var(--cockpit-text)" fontSize="20" fontWeight="600"
        fontFamily="'Courier New',monospace" style={{transition:'all .3s'}}>
        {typeof value==='number' ? value.toFixed(0) : '--'}
      </text>
      <text x={cx} y={cy+45} textAnchor="middle" fill="var(--cockpit-muted)" fontSize="9"
        fontFamily="'Courier New',monospace" letterSpacing="1">{unit}</text>
      <text x={cx} y={cy+r+24} textAnchor="middle" fill="var(--cockpit-muted)" fontSize="10"
        fontFamily="'Courier New',monospace" letterSpacing="2">{label.toUpperCase()}</text>
    </svg>
  );
}

function MiniBar({ value, label, unit, colorVar='--cockpit-rpm', min=0, max=100, warn=null, danger=null, decimals=1 }) {
  const p = pct(value??0, min, max) * 100;
  let bc = `var(${colorVar})`;
  if (danger!=null && (value??0)>=danger) bc='var(--c-red)';
  else if (warn!=null && (value??0)>=warn) bc='var(--c-amber)';
  return (
    <div style={{display:'flex', flexDirection:'column', gap:6}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
        <span style={{fontSize:9, letterSpacing:3, color:'var(--cockpit-muted)', fontFamily:"'Courier New',monospace"}}>
          {label.toUpperCase()}
        </span>
        <span style={{fontSize:16, fontWeight:600, color:'var(--cockpit-text)', fontFamily:"'Courier New',monospace"}}>
          {value!=null ? Number(value).toFixed(decimals) : '--'}
          <span style={{fontSize:10, color:'var(--cockpit-muted)', marginLeft:3}}>{unit}</span>
        </span>
      </div>
      <div style={{height:5, background:'var(--track)', borderRadius:3, overflow:'hidden', border:'0.5px solid var(--border-strong)'}}>
        <div style={{height:'100%', width:`${p}%`, background:bc, borderRadius:3, transition:'all .3s ease-out'}}/>
      </div>
    </div>
  );
}

function PagePerformance({ rpm, speed, throttlePos, engineLoad }) {
  return (
    <div style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
      <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:0, flexWrap:'wrap'}}>
        <Gauge value={rpm}   min={0} max={8000} label="Rotação"    unit="RPM"   size={240} colorVar="--cockpit-rpm"   warn={6000} danger={7000}/>
        <div style={{display:'flex', flexDirection:'column', alignItems:'center', minWidth:140, padding:'0 12px'}}>
          <div style={{fontSize:64, fontWeight:700, color:'var(--cockpit-text)', lineHeight:1, letterSpacing:-3, fontFamily:"'Courier New',monospace"}}>
            {speed.toFixed(0)}
          </div>
          <div style={{fontSize:10, letterSpacing:5, color:'var(--cockpit-muted)', marginTop:6, fontFamily:"'Courier New',monospace"}}>KM/H</div>
        </div>
        <Gauge value={speed} min={0} max={220}  label="Velocidade" unit="km/h"  size={240} colorVar="--cockpit-speed" warn={150}  danger={190}/>
      </div>
      <div style={{width:'100%', maxWidth:580, marginTop:16, background:'var(--bg-surface)', border:'0.5px solid var(--border)', borderRadius:10, padding:'18px 24px', display:'flex', flexDirection:'column', gap:16}}>
        <MiniBar value={throttlePos} label="Acelerador"     unit="%" colorVar="--cockpit-rpm"   min={0} max={100}/>
        <MiniBar value={engineLoad}  label="Carga do Motor" unit="%" colorVar="--cockpit-speed" min={0} max={100} warn={80} danger={95}/>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTES — SAÚDE (clínico)
// ═══════════════════════════════════════════════════════════════════════════════

function ClinicalGauge({ value, min, max, decimals=1, warn=null, danger=null, color='var(--c-blue)' }) {
  const size=140, r=50, cx=size/2, cy=size/2;
  const sa=-220, ea=40, arc=ea-sa;
  const rad = d => d*Math.PI/180;
  const pt  = (a,rr) => ({ x:cx+rr*Math.cos(rad(a)), y:cy+rr*Math.sin(rad(a)) });
  const ap  = (rr,f,t) => { const s=pt(f,rr),e=pt(t,rr); return `M${s.x} ${s.y}A${rr} ${rr} 0 ${t-f>180?1:0} 1 ${e.x} ${e.y}`; };
  const p   = pct(value??0, min, max);
  const fa  = sa + p * arc;

  const isDanger = danger!=null && (value??0)>=danger;
  const isWarn   = warn!=null   && (value??0)>=warn;
  let ac = color;
  if (isDanger) ac='var(--c-red)';
  else if (isWarn) ac='var(--c-amber)';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{overflow:'visible', flexShrink:0}}>
      <path d={ap(r,sa,ea)} fill="none" stroke="var(--track)" strokeWidth="7" strokeLinecap="round"/>
      {warn!=null   && <path d={ap(r, sa+pct(warn,min,max)*arc,   ea)} fill="none" stroke="var(--track-warn)"   strokeWidth="7" strokeLinecap="round"/>}
      {danger!=null && <path d={ap(r, sa+pct(danger,min,max)*arc, ea)} fill="none" stroke="var(--track-danger)" strokeWidth="7" strokeLinecap="round"/>}
      {p>0.005 && <path d={ap(r,sa,fa)} fill="none" stroke={ac} strokeWidth="7" strokeLinecap="round" style={{transition:'all .4s ease-out'}}/>}
      <text x={cx} y={cy-2}  textAnchor="middle" fill={isDanger?'var(--c-red)':isWarn?'var(--c-amber)':'var(--text-primary)'}
        fontSize="18" fontWeight="700" fontFamily="'Inter',system-ui,sans-serif" style={{transition:'fill .3s'}}>
        {value!=null ? Number(value).toFixed(decimals) : '--'}
      </text>
      <text x={cx} y={cy+14} textAnchor="middle" fill="var(--text-muted)" fontSize="10" fontFamily="'Inter',system-ui,sans-serif"/>
    </svg>
  );
}

function Sparkline({ history, min, max, warn=null, danger=null, color='var(--c-blue)', width=260, height=52 }) {
  if (!history || history.length < 2) return null;
  const pad={t:6,b:6,l:4,r:4}, W=width-pad.l-pad.r, H=height-pad.t-pad.b;
  const xs = history.map((_,i) => pad.l + (i/(history.length-1))*W);
  const ys = history.map(v  => pad.t + (1-pct(v, min, max))*H);
  const d    = xs.map((x,i)=>`${i===0?'M':'L'}${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(' ');
  const fill = d + ` L${xs[xs.length-1].toFixed(1)} ${pad.t+H} L${xs[0].toFixed(1)} ${pad.t+H} Z`;
  const wY = warn!=null   ? pad.t+(1-pct(warn,   min,max))*H : null;
  const dY = danger!=null ? pad.t+(1-pct(danger, min,max))*H : null;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {dY!=null && <line x1={pad.l} y1={dY} x2={pad.l+W} y2={dY} stroke="var(--c-red)"   strokeWidth=".8" strokeDasharray="3 3" opacity=".5"/>}
      {wY!=null && <line x1={pad.l} y1={wY} x2={pad.l+W} y2={wY} stroke="var(--c-amber)" strokeWidth=".8" strokeDasharray="3 3" opacity=".5"/>}
      <path d={fill} fill={color} fillOpacity=".08"/>
      <path d={d}    fill="none"  stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={xs[xs.length-1]} cy={ys[ys.length-1]} r="3" fill={color}/>
    </svg>
  );
}

function HealthCard({ label, value, unit, decimals=1, min, max, warn=null, danger=null, color='var(--c-blue)', history=[] }) {
  const isDanger = danger!=null && (value??0)>=danger;
  const isWarn   = warn!=null   && (value??0)>=warn;
  const hasAlert = isDanger || isWarn;

  return (
    <div style={{
      background:'var(--bg-surface)', borderRadius:16,
      border:`1.5px solid ${hasAlert ? (isDanger?'var(--c-red)':'var(--c-amber)') : 'var(--border)'}`,
      padding:'20px 24px', display:'flex', flexDirection:'column', gap:12,
      transition:'border-color .3s, background .3s',
    }}>
      {hasAlert && (
        <div style={{
          background: isDanger?'color-mix(in srgb, var(--c-red) 12%, transparent)':'color-mix(in srgb, var(--c-amber) 12%, transparent)',
          borderRadius:8, padding:'5px 10px',
          fontSize:11, fontWeight:600, fontFamily:"'Inter',system-ui,sans-serif",
          color: isDanger?'var(--c-red)':'var(--c-amber)',
        }}>
          {isDanger ? '⚠ Valor crítico' : '⚠ Atenção'}
        </div>
      )}

      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8}}>
        <div style={{flex:1}}>
          <div style={{fontSize:11, color:'var(--text-muted)', fontFamily:"'Inter',system-ui,sans-serif", letterSpacing:1, textTransform:'uppercase', marginBottom:6}}>
            {label}
          </div>
          <div style={{display:'flex', alignItems:'baseline', gap:4}}>
            <span style={{
              fontSize:40, fontWeight:700, lineHeight:1,
              color: isDanger?'var(--c-red)': isWarn?'var(--c-amber)':'var(--text-primary)',
              fontFamily:"'Inter',system-ui,sans-serif", transition:'color .3s',
            }}>
              {value!=null ? Number(value).toFixed(decimals) : '--'}
            </span>
            <span style={{fontSize:14, color:'var(--text-muted)', fontFamily:"'Inter',system-ui,sans-serif"}}>{unit}</span>
          </div>
        </div>
        <ClinicalGauge value={value} min={min} max={max} decimals={decimals} warn={warn} danger={danger} color={color}/>
      </div>

      <div style={{borderTop:'1px solid var(--border)', paddingTop:10}}>
        <Sparkline history={history} min={min} max={max} warn={warn} danger={danger} color={color} width={260} height={52}/>
        <div style={{display:'flex', justifyContent:'space-between', marginTop:4}}>
          <span style={{fontSize:9, color:'var(--text-faint)', fontFamily:"'Inter',system-ui,sans-serif"}}>60s atrás</span>
          <span style={{fontSize:9, color:'var(--text-faint)', fontFamily:"'Inter',system-ui,sans-serif"}}>agora</span>
        </div>
      </div>
    </div>
  );
}

function PageSaude({ coolantTemp, intakeTemp, maf, intakePressure, histories }) {
  return (
    <div style={{width:'100%', maxWidth:860, display:'flex', flexDirection:'column', gap:20}}>
      <div style={{display:'flex', alignItems:'center', gap:10}}>
        <div style={{width:4, height:20, background:'var(--c-blue)', borderRadius:2}}/>
        <span style={{fontSize:13, color:'var(--text-secondary)', fontFamily:"'Inter',system-ui,sans-serif", fontWeight:600, letterSpacing:.5}}>
          Diagnóstico em tempo real
        </span>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:16}}>
        <HealthCard label="Fluido de Arrefecimento" value={coolantTemp}    unit="°C"  decimals={1} min={0} max={130} warn={100} danger={110} color="var(--c-blue)"   history={histories.coolantTemp}/>
        <HealthCard label="Temperatura do Ar"       value={intakeTemp}     unit="°C"  decimals={1} min={0} max={70}  warn={45}  danger={60}  color="var(--c-cyan)"   history={histories.intakeTemp}/>
        <HealthCard label="Fluxo de Ar (MAF)"       value={maf}            unit="g/s" decimals={2} min={0} max={25}  warn={18}  danger={22}  color="var(--c-purple)" history={histories.maf}/>
        <HealthCard label="Pressão de Admissão"     value={intakePressure} unit="kPa" decimals={1} min={0} max={110} warn={90}  danger={105} color="var(--c-teal)"   history={histories.intakePressure}/>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// APP ROOT
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [page,   setPage]   = useState('performance');
  const [status, setStatus] = useState(MOCK_MODE ? 'SIMULAÇÃO' : 'CONECTANDO');
  const [time,   setTime]   = useState('');

  const [rpm,           setRpm]           = useState(0);
  const [speed,         setSpeed]         = useState(0);
  const [throttlePos,   setThrottlePos]   = useState(0);
  const [engineLoad,    setEngineLoad]    = useState(0);
  const [coolantTemp,   setCoolantTemp]   = useState(0);
  const [intakeTemp,    setIntakeTemp]    = useState(0);
  const [maf,           setMaf]           = useState(0);
  const [intakePressure,setIntakePressure]= useState(0);

  const [histories, setHistories] = useState({
    coolantTemp:[], intakeTemp:[], maf:[], intakePressure:[],
  });

  const pushHistory = (key, val) => setHistories(h => ({
    ...h, [key]: [...h[key].slice(-(HISTORY_LEN-1)), val],
  }));

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'}));
    tick(); const id=setInterval(tick,1000); return ()=>clearInterval(id);
  }, []);

  useEffect(() => {
    if (MOCK_MODE) {
      let t = 0;
      const id = setInterval(() => {
        t += 0.05;
        const base     = (Math.sin(t*0.4)+1)/2;
        const baseSlow = (Math.sin(t*0.1)+1)/2;
        setRpm(Math.round(800+base*5700));
        setSpeed(Math.round(base*180));
        setThrottlePos(parseFloat((base*95).toFixed(1)));
        setEngineLoad(parseFloat((20+base*70).toFixed(1)));
        const ct=parseFloat((70+baseSlow*40).toFixed(1));
        const it=parseFloat((20+baseSlow*25).toFixed(1));
        const mf=parseFloat((2+base*18).toFixed(2));
        const ip=parseFloat((30+base*70).toFixed(1));
        setCoolantTemp(ct); setIntakeTemp(it); setMaf(mf); setIntakePressure(ip);
        pushHistory('coolantTemp',ct); pushHistory('intakeTemp',it);
        pushHistory('maf',mf);        pushHistory('intakePressure',ip);
      }, 400);
      return () => clearInterval(id);
    }

    const esP = new EventSource('http://localhost:8080/obd-performance');
    esP.onopen   = () => setStatus('CONECTADO');
    esP.onerror  = () => setStatus('ERRO');
    esP.onmessage = e => {
      const d=JSON.parse(e.data);
      setRpm(d.rpm??0); setSpeed(d.speed??0);
      setThrottlePos(d.throttle_pos??0); setEngineLoad(d.engine_load??0);
      setStatus('CONECTADO');
    };
    const esS = new EventSource('http://localhost:8080/obd-saude');
    esS.onmessage = e => {
      const d=JSON.parse(e.data);
      const ct=d.coolant_temp??0,it=d.intake_temp??0,mf=d.maf??0,ip=d.intake_pressure??0;
      setCoolantTemp(ct); setIntakeTemp(it); setMaf(mf); setIntakePressure(ip);
      pushHistory('coolantTemp',ct); pushHistory('intakeTemp',it);
      pushHistory('maf',mf);        pushHistory('intakePressure',ip);
    };
    return () => { esP.close(); esS.close(); };
  }, []);

  const statusColor = {CONECTADO:'#4be84b',SIMULAÇÃO:'#e8b84b',CONECTANDO:'#4bb8e8',ERRO:'#e84b4b'}[status]??'#888';

  const navItems = [
    { id:'performance', label:'Performance', icon:(
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    )},
    { id:'saude', label:'Saúde', icon:(
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    )},
  ];

  return (
    <div style={{minHeight:'100vh', background:'var(--bg)', display:'flex', flexDirection:'column', transition:'background .3s'}}>

      {/* ── Header ── */}
      <header style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'0 24px', height:52,
        background:'var(--nav-bg)', borderBottom:'1px solid var(--nav-border)',
        transition:'background .3s, border-color .3s',
      }}>
        <span style={{fontSize:12, fontWeight:700, letterSpacing:3, color:'var(--text-secondary)', fontFamily:"'Courier New',monospace"}}>
          OBD2
        </span>

        <nav style={{display:'flex', gap:2}}>
          {navItems.map(item => {
            const active = page === item.id;
            return (
              <button key={item.id} onClick={()=>setPage(item.id)} style={{
                display:'flex', alignItems:'center', gap:6,
                padding:'6px 18px', borderRadius:8,
                fontSize:12, fontWeight: active?600:400,
                color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                borderBottom: active ? '2px solid var(--c-blue)' : '2px solid transparent',
                fontFamily:"'Inter',system-ui,sans-serif",
                transition:'all .2s',
              }}>
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </nav>

        <div style={{display:'flex', alignItems:'center', gap:8}}>
          <div style={{width:6, height:6, borderRadius:'50%', background:statusColor, boxShadow:`0 0 8px ${statusColor}`}}/>
          <span style={{fontSize:11, color:'var(--text-muted)', letterSpacing:1, fontFamily:"'Inter',system-ui,sans-serif"}}>{time}</span>
        </div>
      </header>

      {/* ── Conteúdo ── */}
      <main style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px 16px 80px'}}>
        {page === 'performance'
          ? <PagePerformance rpm={rpm} speed={speed} throttlePos={throttlePos} engineLoad={engineLoad}/>
          : <PageSaude coolantTemp={coolantTemp} intakeTemp={intakeTemp} maf={maf} intakePressure={intakePressure} histories={histories}/>
        }
      </main>

      {/* ── Nav mobile ── */}
      <nav style={{
        position:'fixed', bottom:0, left:0, right:0, height:60,
        background:'var(--nav-bg)', borderTop:'1px solid var(--nav-border)',
        display:'flex', alignItems:'center', justifyContent:'center',
        transition:'background .3s, border-color .3s',
      }}>
        {navItems.map(item => {
          const active = page === item.id;
          return (
            <button key={item.id} onClick={()=>setPage(item.id)} style={{
              flex:1, maxWidth:160,
              display:'flex', flexDirection:'column', alignItems:'center', gap:3,
              padding:'8px 0',
              color: active ? 'var(--c-blue)' : 'var(--text-muted)',
              fontFamily:"'Inter',system-ui,sans-serif",
              transition:'color .2s',
            }}>
              {item.icon}
              <span style={{fontSize:9, letterSpacing:2}}>{item.label.toUpperCase()}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
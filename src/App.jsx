// npm run build && npm start
// npm run dev -> abre em http://localhost:5173 (vite) - não funciona SSE, só para desenvolvimento frontend

import React, { useState, useEffect } from 'react';
import './App.css';
import './App.css';

function App() {
  const [status, setStatus] = useState('⏳ Conectando...');
  const [rpm, setRpm] = useState('--');
  const [speed, setSpeed] = useState('--');
  const [throttlePos, setThrottlePos] = useState('--');
  const [engineLoad, setEngineLoad] = useState('--');

  useEffect(() => {
    const eventSource = new EventSource('http://localhost:8080/obd-performance');

    eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        // formata pra 2 casas ou '--' se null
        const fmtInt = (v) => v != null ? Math.round(parseFloat(v)).toString() : '--';  // formato inteiro
        const fmtDec = (v) => v != null ? parseFloat(v).toFixed(2) : '--';              // formato decimal

        setRpm(fmtInt(data.rpm));
        setSpeed(fmtInt(data.speed));
        setThrottlePos(fmtDec(data.throttle_pos));
        setEngineLoad(fmtDec(data.engine_load));
        setStatus('✅ Conectado');
    };

    eventSource.onerror = () => {
      setStatus('❌ Erro de conexão');
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <div className="app">
      <h1>🚗 OBD2 Dashboard</h1>
      <div className="status">{status}</div>
      <div className="container">
        <div className="card">
          <div className="label">RPM</div>
          <div className="gauge">{rpm}</div>
          <div className="unit">RPM</div>
        </div>
        <div className="card">
          <div className="label">Velocidade</div>
          <div className="gauge">{speed}</div>
          <div className="unit">km/h</div>
        </div>
        <div className="card">
          <div className="label">Posição do Acelerador</div>
          <div className="gauge">{throttlePos}</div>
          <div className="unit">%</div>
        </div>
        <div className="card">
          <div className="label">Carga do Motor</div>
          <div className="gauge">{engineLoad}</div>
          <div className="unit">%</div>
        </div>
      </div>
    </div>
  );
}

export default App;
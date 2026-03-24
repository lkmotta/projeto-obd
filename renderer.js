// Agora usa a versão exposta pelo preload
const EventSource = window.EventSource

console.log('Iniciando SSE...')
const es = new EventSource('http://localhost:8080/obd-performance')

es.onmessage = (event) => {
  const data = JSON.parse(event.data)
  console.log('Dados recebidos:', data)
  
  document.getElementById('rpm').textContent     = data.rpm.toFixed(0)
  document.getElementById('speed').textContent   = data.speed.toFixed(1)
  document.getElementById('engine_load').textContent = data.engine_load.toFixed(0)
  document.getElementById('throttle_pos').textContent = data.throttle_pos != null ? data.throttle_pos.toFixed(0) : '--'
}

es.onerror = (err) => {
  console.error('Erro SSE:', err)
  document.getElementById('status').textContent = '❌ Desconectado'
}

es.onopen = () => {
  console.log('SSE conectado!')
  document.getElementById('status').textContent = '✅ Conectado'
}
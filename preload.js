const { contextBridge } = require('electron')
const EventSource = require('eventsource')

// Expõe EventSource pro renderer
contextBridge.exposeInMainWorld('EventSource', EventSource)
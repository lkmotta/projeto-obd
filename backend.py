# uvicorn backend:app --port 8080 --reload

from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import obd, json, asyncio

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"]
)

connection = obd.OBD(
    portstr="socket://localhost:35000",
    baudrate=38400,
    protocol=None,
    fast=False,
    timeout=30,
    check_voltage=False
)

async def gerar_dados():
    while True:
        data = {}
        rpm     = connection.query(obd.commands.RPM)
        speed   = connection.query(obd.commands.SPEED)
        coolant = connection.query(obd.commands.COOLANT_TEMP)
        load    = connection.query(obd.commands.ENGINE_LOAD)

        data["rpm"]     = rpm.value.magnitude     if not rpm.is_null()     else None
        data["speed"]   = speed.value.magnitude   if not speed.is_null()   else None
        data["coolant"] = coolant.value.magnitude if not coolant.is_null() else None
        data["load"]    = load.value.magnitude    if not load.is_null()    else None
        yield f"data: {json.dumps(data)}\n\n"
        await asyncio.sleep(0.5)

@app.get("/obd-stream")
async def stream():
    print(gerar_dados())
    return StreamingResponse(gerar_dados(), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=8080)
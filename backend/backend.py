# uvicorn backend:app --port 8080 --reload

from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from paineis import performance, saude

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"]
)

@app.get("/obd-performance")
async def stream():
    return StreamingResponse(performance(), media_type="text/event-stream")

@app.get("/obd-saude")
async def stream():
    return StreamingResponse(saude(), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=8080)
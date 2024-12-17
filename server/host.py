import asyncio
import json
import random
import tempfile
from fastapi.responses import RedirectResponse
import uvicorn
from subprocess import check_output
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path


app = FastAPI()
src = Path(__file__).parent
data = src / "data"

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

keys = {
    "rows": "int",
    "cols": "int",
    "hStates": "list[int]",
    "vStates": "list[int]",
    "hColors": "list[int]",
    "vColors": "list[int]",
    "numbers": "list[int]",
    "nMask": "list[int]",
    "colors": "list[string]",
}


# Post / with a json: Create a puzzle
# Store the json in the data directory
@app.post("/")
async def input_request(request: Request):
    body = (await request.body()).decode().replace("\r\n", "\n")
    
    # Parse json, ensure only keys in the whitelist exist, and ensure they are correct types
    try:
        obj = json.loads(body)
        k = [k for k in obj if k not in keys]
        assert not k, f"Invalid keys: {k}"
    except Exception as e:
        return str(e)

    # Randomly generate a 8-letter id for the puzzle
    id = "".join(random.choices("abcdefghijklmnopqrstuvwxyz0123456789", k=8))
    tf = data / f"{id}.json"
    tf.write_text(body)
    return {"id": id}


# Get /{id}: Get the puzzle with the given id
@app.get("/{id}")
async def get_puzzle(id: str):
    tf = data / f"{id}.json"
    if not tf.exists():
        raise HTTPException(status_code=404, detail="Puzzle not found")
    return json.loads(tf.read_text())


@app.post("/solve")
async def solve(request: Request):
    body = (await request.body()).decode().replace("\r\n", "\n")

    # Write body to a file
    with tempfile.TemporaryDirectory() as tmpdir:
        tf = Path(tmpdir) / "puzzle.slk"
        tf.write_text(body)

        # Run the solver asynchronously with a 60-second timeout
        try:
            # Create subprocess asynchronously
            process = await asyncio.create_subprocess_exec(
                str(src / "slsolver"), 
                str(tf), 
                cwd=str(src), 
                stdout=asyncio.subprocess.PIPE, 
                stderr=asyncio.subprocess.PIPE
            )

            # Wait for the process to finish with a 60-second timeout
            stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=60)
            
            if process.returncode != 0:
                raise HTTPException(status_code=500, detail=f"Solver failed: {stderr.decode()}")
            
            return stdout.decode()
        
        except asyncio.TimeoutError:
            process.kill()  # Ensure the process is killed if it times out
            await process.wait()  # Wait for the process to be fully terminated
            raise HTTPException(status_code=504, detail="Solver took too long to respond (timeout of 60 seconds)")

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


# Getting / redirects to main page
@app.get("/")
async def get_main():
    return RedirectResponse("https://slither.hydev.org")


if __name__ == '__main__':
    uvicorn.run(app, host="0.0.0.0", port=51562)

import uvicorn
from subprocess import check_output
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path


app = FastAPI()
src = Path(__file__).parent

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/")
async def input_request(request: Request):
    body = (await request.body()).decode().replace("\r\n", "\n")

    # Write body to a file
    tf = src / "input.txt"
    tf.write_text(body)

    # Run the solver (example: ./slsolver mypuzzle.slk)
    # Solver is https://github.com/davidjosepha/slitherlink
    solver_path = src / "slsolver"
    output = check_output([solver_path, str(tf)], cwd=src).decode()
    return output


if __name__ == '__main__':
    uvicorn.run(app, host="0.0.0.0", port=8000)

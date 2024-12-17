FROM python:3.13-slim

# Install dependencies: Fastapi and uvicorn
RUN pip install fastapi uvicorn

# Copy ./server to /app
COPY ./server /app
WORKDIR /app

# Run the server
CMD ["python", "host.py"]

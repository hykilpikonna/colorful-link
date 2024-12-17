FROM alpine

# Install build dependencies
RUN apk add --no-cache make clang git python3 py3-pip

# Clone the slitherlink repository and build
RUN git clone https://github.com/davidjosepha/slitherlink /slitherlink \
    && cd /slitherlink \
    && make \
    && mkdir /app \
    && ln -s /slitherlink/slsolver /app/slsolver \
    && cd /

# Install dependencies: Fastapi and uvicorn
RUN pip install fastapi uvicorn --break-system-packages

# Copy ./server to /app
COPY ./server /app
WORKDIR /app

# Run the server
CMD ["python", "host.py"]

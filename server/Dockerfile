FROM rust:1.88-slim AS builder

RUN apt-get update && apt-get install -y pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY Cargo.toml ./
RUN mkdir src && echo "fn main() {}" > src/main.rs && cargo build --release 2>/dev/null; rm -rf src

COPY src ./src
RUN touch src/main.rs && cargo build --release

FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*

RUN groupadd --gid 1001 appuser && useradd --uid 1001 --gid appuser --shell /bin/false --create-home appuser

WORKDIR /app
COPY --from=builder /app/target/release/tetris-gen-api /app/tetris-gen-api

USER appuser

EXPOSE 3000

ENTRYPOINT ["/app/tetris-gen-api"]

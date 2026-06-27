# Minimal image so Glama can start the stdio MCP server for introspection checks.
# Build: docker build -t mythsensus-mcp .  ·  Run: docker run -i mythsensus-mcp
FROM node:20-slim
WORKDIR /app

# Install deps (dev deps needed for the tsc build) against the committed lockfile
COPY package.json package-lock.json ./
RUN npm ci

# Build TypeScript -> dist/ (also copies src/engine -> dist/engine per package.json build script)
COPY . .
RUN npm run build

# stdio transport: the server talks JSON-RPC over stdin/stdout
CMD ["node", "dist/index.js"]

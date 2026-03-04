# Stage 1: Build
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist

# Write entrypoint inline to avoid Windows CRLF issues
RUN printf '#!/bin/sh\nset -e\n\necho "Waiting for MongoDB..."\nuntil node -e "\n  const mongoose = require('"'"'mongoose'"'"');\n  mongoose.connect(process.env.MONGODB_URI)\n    .then(() => { mongoose.connection.close(); process.exit(0); })\n    .catch(() => process.exit(1));\n" 2>/dev/null; do\n  echo "MongoDB not ready, retrying in 2s..."\n  sleep 2\ndone\necho "MongoDB is ready."\n\nif [ "$SEED_DATA" = "true" ]; then\n  echo "Seeding mock data..."\n  node dist/scripts/create-mocks.js\n  echo "Seeding complete."\nfi\n\nexec node dist/server.js\n' > /app/entrypoint.sh \
  && chmod +x /app/entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/app/entrypoint.sh"]

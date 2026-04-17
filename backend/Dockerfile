FROM node:20-alpine

WORKDIR /app

# Build deps for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++

COPY backend/package*.json ./
RUN npm ci --only=production

COPY backend/src ./src

EXPOSE 4000

# Run migrations then start server
CMD ["sh", "-c", "node src/db/migrate.js && node src/index.js"]

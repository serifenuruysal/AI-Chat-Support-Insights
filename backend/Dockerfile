FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci --only=production

COPY backend/src ./src

EXPOSE 4000

CMD ["sh", "-c", "node src/db/migrate.js && node src/index.js"]

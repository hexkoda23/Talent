FROM node:20-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y openssl
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-slim
WORKDIR /app
RUN apt-get update && apt-get install -y openssl
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma
EXPOSE 4000

# Run Prisma migrations, seed public launch data, and then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && node prisma/seed-public.js && node dist/src/main.js"]

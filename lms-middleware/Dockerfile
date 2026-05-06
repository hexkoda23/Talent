# Stage 1: Build the API
FROM node:20-alpine AS api-builder

RUN apk add --no-cache git python3

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Build the React frontend served by the API container
FROM node:20-alpine AS frontend-builder

WORKDIR /frontend

COPY frontend-v2/package*.json ./
RUN npm install

COPY frontend-v2/ ./
RUN npm run build

# Stage 3: Production
FROM node:20-alpine

RUN apk add --no-cache git python3

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=api-builder /app/dist ./dist
COPY --from=api-builder /app/templates ./templates
COPY --from=frontend-builder /frontend/dist ./frontend/dist

EXPOSE 3000

CMD ["npm", "start"]

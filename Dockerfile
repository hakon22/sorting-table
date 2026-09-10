# Backend API
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY api/package.json ./api/
COPY shared/package.json ./shared/
COPY web/package.json ./web/
COPY worker/package.json ./worker/
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build -w shared && npm run build -w api
RUN npx tsc-alias -p api/tsconfig.build.json --resolve-full-paths || true

FROM node:22-alpine AS app
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/api/dist ./api/dist
COPY --from=builder /app/api/package.json ./api/
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/package.json ./
EXPOSE 3019
ENTRYPOINT ["npm", "run"]
CMD ["start:server:prod"]

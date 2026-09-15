# --- Build stage ---
FROM node:20-alpine AS build
WORKDIR /usr/src/app

COPY package.json package-lock.json* ./
COPY tsconfig.base.json ./
COPY apps/airport-service/package.json ./apps/airport-service/package.json
COPY apps/itinerary-service/package.json ./apps/itinerary-service/package.json
COPY apps/notification-function/package.json ./apps/notification-function/package.json

RUN npm install --workspace=apps/airport-service --include-workspace-root

COPY apps/airport-service ./apps/airport-service

RUN npm run build --workspace=apps/airport-service

# --- Runtime stage ---
FROM node:20-alpine AS runtime
WORKDIR /usr/src/app
ENV NODE_ENV=production

COPY --from=build /usr/src/app/apps/airport-service/package.json ./package.json
COPY --from=build /usr/src/app/apps/airport-service/dist ./dist
COPY --from=build /usr/src/app/node_modules ./node_modules

EXPOSE 3001
CMD ["node", "dist/main.js"]

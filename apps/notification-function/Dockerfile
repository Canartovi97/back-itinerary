# --- Build stage ---
FROM node:20-alpine AS build
WORKDIR /usr/src/app

# native module build deps for better-sqlite3
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json* ./
COPY tsconfig.base.json ./
COPY apps/airport-service/package.json ./apps/airport-service/package.json
COPY apps/itinerary-service/package.json ./apps/itinerary-service/package.json
COPY apps/notification-function/package.json ./apps/notification-function/package.json

RUN npm install --workspace=apps/notification-function --include-workspace-root

COPY apps/notification-function ./apps/notification-function

RUN npm run build --workspace=apps/notification-function

# --- Runtime stage ---
FROM node:20-alpine AS runtime
WORKDIR /usr/src/app
ENV NODE_ENV=production

COPY --from=build /usr/src/app/apps/notification-function/package.json ./package.json
COPY --from=build /usr/src/app/apps/notification-function/dist ./dist
COPY --from=build /usr/src/app/node_modules ./node_modules

EXPOSE 3002
CMD ["node", "dist/main.js"]

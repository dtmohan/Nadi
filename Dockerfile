# --- Build stage: compile the client and the server bundle ---
FROM node:20-bookworm-slim AS build
WORKDIR /app

# The sweph package ships prebuilt binaries for linux x64/arm64; this toolchain is a fallback
# in case no prebuilt binary matches this Node ABI and it must compile from source.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- Runtime stage: only what the server needs ---
FROM node:20-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/ephe ./ephe
COPY --from=build /app/package.json ./package.json

EXPOSE 5000
CMD ["node", "dist/index.cjs"]

FROM oven/bun:1@sha256:e90cdbaf9ccdb3d4bd693aa335c3310a6004286a880f62f79b18f9b1312a8ec3 AS builder
WORKDIR /app
COPY package.json bun.lock .
COPY project.inlang ./project.inlang
RUN bun install --frozen-lockfile
COPY . .
# Build with node adapter for Docker/server deployments
ENV ASTRO_ADAPTER=node
RUN bun run build

FROM node:lts-alpine@sha256:931d7d57f8c1fd0e2179dbff7cc7da4c9dd100998bc2b32afc85142d8efbc213
RUN apk add curl
WORKDIR /app
COPY --from=builder /app/dist dist/
COPY --from=builder /app/node_modules node_modules/
COPY package.json .
EXPOSE 3000
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
CMD [ "node", "./dist/server/entry.mjs" ]

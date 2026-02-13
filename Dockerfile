FROM oven/bun:1@sha256:856da45d07aeb62eb38ea3e7f9e1794c0143a4ff63efb00e6c4491b627e2a521 AS builder
WORKDIR /app
COPY package.json bun.lock .
COPY project.inlang ./project.inlang
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM node:lts-alpine@sha256:931d7d57f8c1fd0e2179dbff7cc7da4c9dd100998bc2b32afc85142d8efbc213
# bun can't deal with socket activation on systemd yet
# FROM oven/bun:1-alpine
RUN apk add curl
WORKDIR /app
COPY --from=builder /app/build build/
COPY --from=builder /app/node_modules node_modules/
COPY package.json .
EXPOSE 3000
ENV NODE_ENV=production
# CMD [ "bun", "./build" ]
CMD [ "node", "./build" ]

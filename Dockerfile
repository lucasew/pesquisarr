FROM node:lts-alpine@sha256:e67514e5d0f6c46656005e1b693b2ec9d52e80b641307de684d4a015ba7a4eaf AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY project.inlang ./project.inlang
RUN npm ci
COPY . .
ENV ASTRO_ADAPTER=node
RUN npx astro telemetry disable && npm run build

FROM node:lts-alpine@sha256:e67514e5d0f6c46656005e1b693b2ec9d52e80b641307de684d4a015ba7a4eaf
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

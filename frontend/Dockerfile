# ── deps: install node_modules ────────────────────────────────────────────────
FROM node:22-slim AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ── test: lint and type-check ─────────────────────────────────────────────────
FROM deps AS test

COPY . .

CMD ["sh", "-c", "npm run lint && npm run test"]

# ── build: compile production bundle ──────────────────────────────────────────
FROM deps AS build

COPY . .

RUN npm run build

# ── production: nginx serving the built app ───────────────────────────────────
FROM nginx:alpine AS production

RUN apk add --no-cache curl

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

# Multi-stage image: install, verify, build, then serve the static app.
# The mock API is MSW in the browser, so there is no backend process here.
# See the plan for why the worker ships in this image.

FROM node:22-alpine AS build
WORKDIR /app

ENV HUSKY=0
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV VITE_ENABLE_MOCKS=true

RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json .nvmrc ./
RUN npm ci

COPY . .
RUN npm run verify

FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

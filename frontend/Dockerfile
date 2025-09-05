FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Optional: tiny CORS shim for static (not proxying) – usually Lumen handles CORS.
RUN printf 'add_header Access-Control-Allow-Origin *;\n' \
    >> /etc/nginx/conf.d/default.conf
EXPOSE 80
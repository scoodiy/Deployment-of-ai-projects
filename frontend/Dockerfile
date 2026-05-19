# ---- Build Stage ----
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Runtime Stage ----
FROM nginx:1.25-alpine

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

# Copy nginx config
COPY --from=build /app/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built frontend
COPY --from=build /app/dist /usr/share/nginx/html

# Create cache directories for nginx
RUN mkdir -p /var/cache/nginx/client_temp \
    && chown -R nginx:nginx /var/cache/nginx

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -sf http://127.0.0.1:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

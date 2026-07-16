# syntax=docker/dockerfile:1
# Step 1: Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files INCLUDING .npmrc — @ki4jlu/design-system comes from
# GitHub Packages, and .npmrc points npm at that registry. The registry token
# arrives as a BuildKit secret (never baked into a layer); CI passes
# GITHUB_TOKEN, local builds can use:
#   docker build --secret id=node_auth_token,env=NODE_AUTH_TOKEN .
# NODE_AUTH_TOKEN is always exported (possibly empty) because npm aborts on an
# unset env reference in .npmrc.
COPY package*.json .npmrc ./
RUN --mount=type=secret,id=node_auth_token \
    export NODE_AUTH_TOKEN="$(cat /run/secrets/node_auth_token 2>/dev/null || true)" && npm ci


# Copy the rest of the application files and build
COPY . .
RUN npm run build

# Step 2: Production serve stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY widget-test /usr/share/nginx/html/test-widget

# Copy custom nginx configuration for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

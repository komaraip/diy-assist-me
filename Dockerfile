# Stage 1: Build stage
FROM node:20-alpine AS build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Memastikan file .env terbaca saat build
RUN npm run build

# Stage 2: Production stage
FROM nginx:stable-alpine AS production-stage
# Salin hasil build dari stage pertama ke folder default Nginx
COPY --from=build-stage /app/dist /usr/share/nginx/html
# Salin konfigurasi custom Nginx jika ada, atau gunakan default
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
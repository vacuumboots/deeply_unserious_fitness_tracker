# Use a lightweight web server to serve the production build
FROM node:16-alpine AS build

WORKDIR /app

COPY package.json ./
RUN npm install --production

RUN npm install lucide-react @radix-ui/react-alert-dialog tailwindcss postcss autoprefixer react-chartjs-2 chart.js

COPY . .

RUN npm run build

# Serve the build using a static file server
FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html

# Copy custom Nginx configuration if needed
# COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

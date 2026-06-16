# Stage 1: Build the React application
FROM node:18-alpine as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# serve the app using Nginx
FROM nginx:stable-alpine

# Copy the custom nginx config from our host to the container
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the build output to replace the default nginx contents
COPY --from=build-stage /app/build /usr/share/nginx/html
# Expose port 80 for the web server
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
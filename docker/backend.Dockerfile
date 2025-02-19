# Backend Dockerfile
FROM node:18-slim

WORKDIR /app

# Install dependencies
COPY backend/package*.json ./
RUN npm install

# Copy source
COPY backend/ .

# Build app
RUN npm run build

# Expose and run
EXPOSE 3001
CMD ["npm", "start"]
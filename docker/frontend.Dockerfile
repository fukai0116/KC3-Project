# Frontend Dockerfile
FROM node:18-slim

WORKDIR /app

# Install dependencies
COPY frontend/package*.json ./
RUN npm install

# Copy source
COPY frontend/ .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0

# Build app
RUN npm run build

# Expose and run
EXPOSE 3000
CMD ["npm", "start"]
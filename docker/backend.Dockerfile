FROM node:20-slim

WORKDIR /app

COPY backend/package*.json ./

RUN npm install

COPY backend/ .
COPY backend/.env .

RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
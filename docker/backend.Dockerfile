FROM node:20-slim

WORKDIR /app

COPY backend/package*.json ./

RUN npm install

COPY backend/ .

RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

EXPOSE 3000

ENV NODE_ENV=development

CMD ["npm", "run", "start:dev"]
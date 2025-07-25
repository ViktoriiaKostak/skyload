FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

# Copy Google credentials if they exist
COPY google-credentials.json /app/credentials.json

RUN npm run build

RUN npm prune --production

EXPOSE 3000

USER node

CMD ["npm", "run", "start:prod"] 
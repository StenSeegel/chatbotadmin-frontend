FROM node:20-alpine
WORKDIR /app

# Dependencies zuerst (besseres Layer-Caching)
COPY package*.json ./
RUN npm install

# Quellcode
COPY index.mjs widgets-store.mjs history-store.mjs ./

EXPOSE 3001
CMD ["node", "index.mjs"]

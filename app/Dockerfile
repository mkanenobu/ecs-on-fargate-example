FROM node:20-bookworm-slim

WORKDIR /app

COPY ./dist /app

EXPOSE 3000

CMD ["node", "--enable-source-maps", "main.js"]

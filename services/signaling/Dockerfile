FROM node:20-alpine

RUN addgroup -g 1001 -S nodejs && \
    adduser -S signaling -u 1001

WORKDIR /app

COPY services/signaling/package.json ./
RUN npm install --production

COPY services/signaling/server.js ./

USER signaling

ENV NODE_ENV=production
ENV SIGNAL_PORT=4001

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
    CMD node -e "try{require('net').createConnection(4001,'localhost',()=>process.exit(0)).on('error',()=>process.exit(1))}catch(e){process.exit(1)}"

EXPOSE 4001

CMD ["node", "server.js"]

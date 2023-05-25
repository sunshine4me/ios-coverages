FROM node:18
WORKDIR /app
COPY . .
RUN npm install --production

EXPOSE 8888
CMD node ./lib/index.js
# Development stage
FROM node:20-alpine AS development
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN chmod +x /app/docker-entrypoint.sh
RUN npx prisma generate
EXPOSE 5000
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["npm", "run", "dev"]

# Production stage
FROM node:20-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN chmod +x /app/docker-entrypoint.sh
RUN npx prisma generate
EXPOSE 5000
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["npm", "start"]

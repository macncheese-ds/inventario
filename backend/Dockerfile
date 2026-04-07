FROM node:18-alpine

WORKDIR /app

# Install dependencies first for caching layers
COPY package*.json ./
RUN npm install

# Copy source files
COPY . .

# Expose backend port
EXPOSE 101

# Command to run the backend (as normal, no hot-reloading in production)
CMD ["node", "src/index.js"]

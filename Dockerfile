# Use Node.js LTS Alpine image for smaller size
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Run Vite dev server with host 0.0.0.0 for Docker networking
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

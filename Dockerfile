# Use Node.js Alpine image for smaller size
FROM node:20-alpine

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy TypeScript config and source files
COPY tsconfig.json ./
COPY src ./src

# Install dev dependencies for building
RUN npm install --save-dev typescript @types/node

# Build the TypeScript code
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

# Remove source files to reduce image size
RUN rm -rf src/

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership of app directory
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Start the server
CMD ["node", "dist/http-server.js"]
FROM node:18-alpine

WORKDIR /app

# Install Docker CLI for workflow execution
RUN apk add --no-cache docker-cli

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "run", "dev"]
FROM node:18

# Set working directory
WORKDIR /usr/src/app

# Copy only backend files (.) relative to the Dockerfile location
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Run the server (không cần prefix "backend/" nữa)
CMD ["node", "server.js"]
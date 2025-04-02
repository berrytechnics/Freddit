FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# For development, we'll use ts-node-dev
# In production, you would build the TypeScript code
EXPOSE 3001

CMD ["npm", "run", "dev"]
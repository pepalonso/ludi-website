# client/Dockerfile
FROM node:20-alpine

WORKDIR /app
# Copy only package.json and package-lock.json to leverage Docker caching
COPY package.json package-lock.json ./

# Install dependencies (including dev dependencies)
RUN npm install

# Copy the rest of the application code
COPY . .

EXPOSE 4200
CMD ["npm", "start"]

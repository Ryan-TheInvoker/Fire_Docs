FROM node:14

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

ENV DATABASE_URL=postgresql://postgres:Mantastyle1@db:5432/mydatabase


EXPOSE 3000
CMD [ "npm", "start" ]

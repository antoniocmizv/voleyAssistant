FROM node:18-alpine

WORKDIR /app

# Instalar dependencias para better-sqlite3
RUN apk add --no-cache python3 make g++ 

COPY package*.json ./

RUN npm ci --only=production

COPY . .

# Crear directorio para la base de datos
RUN mkdir -p /app/data

EXPOSE 3001

CMD ["npm", "start"]

FROM node:22

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar el esquema de prisma y generar cliente
COPY prisma ./prisma/
RUN npx prisma generate

# Copiar el resto del código
COPY . .

EXPOSE 4000

CMD ["npm", "start"]

# Usamos una imagen ligera de Node.js
FROM node:20-alpine

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos los archivos de dependencias para aprovechar el cache
COPY package*.json ./

# Instalamos dependencias (incluyendo tsx y typescript)
RUN npm install

# Copiamos el resto del código del servidor
COPY tsconfig*.json ./
COPY *.ts ./

COPY src ./src

# Exponemos el puerto 5173 (donde corre tu servidor)
EXPOSE 5173

# Comando para iniciar en modo desarrollo
CMD ["npm", "run", "dev", "--", "--host"]

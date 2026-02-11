# Dockerfile optimizado para Hugging Face Spaces
FROM node:18-slim

# Instalar herramientas básicas si es necesario
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# En las imágenes oficiales de Node, el usuario 'node' ya tiene el UID 1000.
# Hugging Face requiere un usuario con UID 1000.
USER node
ENV HOME=/home/node \
    PATH=/home/node/.local/bin:$PATH

WORKDIR $HOME/app

# Copiar package.json primero para aprovechar el cache de Docker
COPY --chown=node:node package*.json ./
RUN npm install

# Copiar el resto del código con los permisos correctos
COPY --chown=node:node . .

# Crear directorios para datos y asegurar permisos
# Nota: Como usuario 'node', ya tenemos permisos en nuestro HOME
RUN mkdir -p results uploads

# HF Spaces usa el puerto 7860
EXPOSE 7860
ENV PORT=7860

CMD ["npm", "start"]

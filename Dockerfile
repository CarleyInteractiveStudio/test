# Dockerfile optimizado para Hugging Face Spaces
FROM node:18-slim

# Instalar herramientas básicas si es necesario
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Crear usuario con ID 1000 (estándar de HF)
RUN useradd -m -u 1000 user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

WORKDIR $HOME/app

# Copiar package.json primero para aprovechar el cache de Docker
COPY --chown=user:user package*.json ./
RUN npm install

# Copiar el resto del código
COPY --chown=user:user . .

# Crear y dar permisos a los directorios de datos
RUN mkdir -p results uploads && \
    chown -R user:user $HOME/app && \
    chmod -R 777 results uploads

# Cambiar al usuario no-root
USER user

# Hugging Face Spaces usa el puerto 7860
EXPOSE 7860
ENV PORT=7860

CMD ["npm", "start"]

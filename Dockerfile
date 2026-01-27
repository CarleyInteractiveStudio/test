# Configuración para Hugging Face Spaces (Docker)
FROM node:18-slim

# Crear usuario para mayor seguridad
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
	PATH=/home/user/.local/bin:$PATH

WORKDIR $HOME/app

# Copiar archivos de dependencias
COPY --chown=user package*.json ./
RUN npm install

# Copiar el resto del código
COPY --chown=user . .

# Directorios necesarios con permisos
RUN mkdir -p results uploads && chmod 777 results uploads

# HF Spaces usa el puerto 7860 por defecto
EXPOSE 7860
ENV PORT=7860

CMD ["npm", "start"]

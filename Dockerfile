FROM node:18-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Hugging Face Spaces typically use port 7860
EXPOSE 7860
ENV PORT=7860

CMD ["npm", "start"]

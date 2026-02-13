FROM node:20-slim

# Install dependencies for Puppeteer AND better-sqlite3 (Python + build tools)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    chromium \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    libxss1 \
    libx11-xcb1 \
    libxtst6 \
    lsb-release \
    xdg-utils \
    wget \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Set env for Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Create directory for persistent storage
RUN mkdir -p /app/.wwebjs_auth /app/db && chmod -R 777 /app/.wwebjs_auth /app/db

CMD ["npm", "start"]

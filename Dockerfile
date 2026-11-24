
# ---- Base Image ----
FROM node:20.18.0-bookworm-slim

# ---- Working Directory ----
WORKDIR /app

# ---- System Dependencies ----
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        build-essential \
        python3 \
        python3-venv \
        python3-pip \
        git \
        libgl1 \
    && rm -rf /var/lib/apt/lists/*

# ---- Python Virtual Environment ----
RUN python3 -m venv /opt/venv

ENV PATH="/opt/venv/bin:$PATH"
ENV NLTK_DATA="/usr/share/nltk_data"

# ---- Python Dependencies ----
COPY requirements.txt ./

RUN python -m pip install --no-cache-dir --upgrade pip && \
    python -m pip install --no-cache-dir -r requirements.txt

# ---- Download NLTK Resources ----
RUN python -m nltk.downloader \
    -d /usr/share/nltk_data \
    punkt_tab wordnet

# ---- Node.js Dependencies ----
COPY package.json package-lock.json ./

RUN npm ci --omit=dev

# ---- Application Source Code ----
COPY . .

# ---- Production Environment ----
ENV NODE_ENV=production

# ---- Start Application ----
CMD ["npm", "start"]

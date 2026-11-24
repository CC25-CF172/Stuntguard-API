
# ---- Base Image ----
FROM node:20.18.0-bookworm-slim

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
        libglib2.0-0 \
        libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# ---- Python Environment ----
RUN python3 -m venv /opt/venv

ENV PATH="/opt/venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV NLTK_DATA=/usr/share/nltk_data

# ---- Python Dependencies ----
COPY requirements.txt ./

RUN python -m pip install --no-cache-dir --upgrade pip && \
    python -m pip install --no-cache-dir -r requirements.txt

# ---- NLTK Resources ----
RUN python -m nltk.downloader \
    -d /usr/share/nltk_data \
    punkt_tab wordnet

# ---- Node Dependencies ----
COPY package.json package-lock.json ./

RUN npm ci --omit=dev

# ---- Application Files ----
COPY . .

# ---- Production ----
ENV NODE_ENV=production

# ---- Start Application ----
CMD ["npm", "start"]

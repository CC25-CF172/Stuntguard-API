# Dockerfile

# ---- STAGE 1: Build tahap dasar dengan Node.js dan Python ----
# Gunakan base image yang sudah punya Node.js dan Python.
# node:20-bullseye-slim adalah pilihan yang baik karena sudah termasuk Node.js dan Python3
# dan berbasis Debian Bullseye yang ringan.
FROM node:20.18.0-bullseye-slim

# Atur direktori kerja di dalam kontainer
WORKDIR /app

# ---- Instalasi Dependensi Sistem (jika diperlukan) ----
# Update apt dan instal pustaka yang mungkin diperlukan oleh TensorFlow/NLTK
# atau dependensi pip lainnya. 'build-essential' untuk kompilasi, 'libgl1-mesa-glx' untuk TensorFlow.
# Hapus cache apt setelah instalasi untuk menjaga ukuran image tetap kecil.
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        build-essential \
        python3-pip \
        git \
        libgl1-mesa-glx \
    && rm -rf /var/lib/apt/lists/*

# ---- Instalasi Dependensi Python ----
# Salin file requirements.txt terlebih dahulu untuk memanfaatkan caching Docker layer.
# Jika requirements.txt tidak berubah, layer pip install tidak perlu dibangun ulang.
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# ---- Download NLTK Data ----
# Download punkt_tab and wordnet resources for NLTK
RUN python3 -m nltk.downloader punkt_tab wordnet

# ---- Instalasi Dependensi Node.js ----
# Salin package.json dan package-lock.json terlebih dahulu untuk caching.
COPY package.json package-lock.json ./
RUN npm install --omit=dev

# ---- Salin Seluruh Kode Aplikasi ----
# Salin semua file proyek Anda ke direktori kerja /app.
# Ini akan menyalin 'src/', 'models/', 'app.js', dll., menjaga struktur folder.
COPY . .

# ---- Salin .env.example menjadi .env ----
RUN cp .env.example .env

# ---- Konfigurasi Lingkungan (Opsional tapi disarankan) ----
# Set variabel lingkungan untuk mode produksi
ENV NODE_ENV production
# Railway akan menyediakan PORT secara otomatis, tetapi ini bagus sebagai fallback atau dokumentasi
ENV PORT 5000

# ---- Perintah Startup Aplikasi ----
# Jalankan aplikasi Node.js Anda. Pastikan ini sesuai dengan script 'start' di package.json Anda.
CMD ["npm", "start"]
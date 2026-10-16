# 🚀 Panduan Lengkap Deployment Vercel (All-in-One): CryptoApples

Panduan ini disusun khusus untuk kamu yang ingin mendeploy seluruh sistem **CryptoApples** (Frontend React 19, Serverless API Edge, Database Postgres, dan Background Cron) **100% menggunakan ekosistem Vercel**.

> 💰 **Estimasi Biaya Operasional:** **$0 / Bulan (100% Free Tier)**  
> Menggunakan paket gratis Vercel Hobby + Neon Serverless Postgres + CoinGecko Demo API Key.

---

## 🗺️ Arsitektur Sistem (Vercel All-in-One)

Dengan memilih **Vercel**, arsitektur menjadi jauh lebih simpel, terpadu, dan tanpa masalah CORS:

```
┌────────────────────────────────────────────────────────┐
│             External Crypto Data Providers             │
│   • CoinGecko (Free Demo Key ~10.000 calls/bln)        │
│   • CoinPaprika (100% Free Fallback tanpa API Key)     │
│   • Binance Vision (Live Real-time Tickers & WS)       │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼ (Tiap 5 Menit via Vercel Cron)
┌────────────────────────────────────────────────────────┐
│             Vercel Cron Job (/api/cron)                │
│   • Terjadwal otomatis via `vercel.json`               │
│   • Menarik 100 koin teratas & simpan ke DB            │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│             Neon Serverless Postgres (DB)              │
│   • Bisa via Neon.tech atau Vercel Storage Postgres    │
│   • Tabel `coins`, `market_snapshots`, `promotions`    │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│     Vercel Edge Network & Serverless (/api/*)          │
│   • /api/market      -> Data pasar ter-cache (CDN)     │
│   • /api/health      -> Health check status            │
│   • /api/promotions  -> Banner iklan/affiliate dinamis │
│   • Super cepat (<30ms) dengan Edge CDN Caching        │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼ (Internal Same-Origin Fetch)
┌────────────────────────────────────────────────────────┐
│         Frontend: Vercel Web Hosting                   │
│   • URL: cryptoapples.vercel.app / cryptoapples.net    │
│   • React 19 + Interactive Canvas Physics Apples       │
│   • 0 CORS Error (karena Frontend & API 1 Domain)      │
└────────────────────────────────────────────────────────┘
```

---

## 📋 Checklist Akun yang Perlu Kamu Siapkan

Hanya butuh **3 akun gratis** (tanpa kartu kredit wajib):

| No | Layanan | Fungsi | Status Biaya | Link Registrasi |
|:---|:---|:---|:---|:---|
| 1 | **Vercel** | Hosting Frontend, Edge API (`/api/*`), & Cron Job | **Gratis** (Hobby Plan) | [vercel.com](https://vercel.com) |
| 2 | **Neon.tech** | Database PostgreSQL (Menyimpan snapshot harga & koin) | **Gratis** (0.5 GB Storage) | [neon.tech](https://neon.tech) |
| 3 | **CoinGecko** | API Data Pasar Kripto (Top 100 + Sparkline) | **Gratis** (Demo API Key) | [coingecko.com/en/api](https://www.coingecko.com/en/api) |

---

## 🛠️ Langkah Demi Langkah (Step-by-Step)

### LANGKAH 1: Setup Database Postgres (Neon)

Database ini berfungsi menyimpan harga historis, koin, dan iklan sponsor agar frontend tidak overload menembak API pihak ketiga.

1. Buka [neon.tech](https://neon.tech) dan login (bisa pakai akun **GitHub** atau Google).
2. Klik tombol **"Create Project"**:
   - **Project Name:** `crypto-apples`
   - **Region:** Pilih `Singapore (ap-southeast-1)` atau `US East` (sesuaikan dengan target pengguna).
3. Setelah database terbuat, masuk ke dashboard Neon:
   - Pilih tab **`Connection Details`** -> centang **`Pooled connection`**.
   - Salin connection string yang muncul, contoh:
     ```text
     postgres://username:password@ep-xyz-pooler.ap-southeast-1.aws.neon.tech/crypto-apples?sslmode=require
     ```
4. Di komputermu, buat file `.env` di folder project ini:
   ```bash
   cp .env.example .env
   ```
   Buka file `.env` dan paste string koneksi Neon tadi:
   ```env
   DATABASE_URL=postgres://username:password@ep-xyz-pooler.ap-southeast-1.aws.neon.tech/crypto-apples?sslmode=require
   ```
5. Buat tabel database otomatis dengan mengetik di terminal:
   ```bash
   pnpm db:migrate
   pnpm db:seed
   ```
   *Output akan menyatakan bahwa tabel `coins`, `market_snapshots`, dan `promotions` berhasil dibuat dan diisi data awal.*

---

### LANGKAH 2: Push Kode ke GitHub

1. Buka [github.com](https://github.com) dan buat repository baru, misal bernama `crypto-apples` (bisa Private atau Public).
2. Push project dari komputermu:
   ```bash
   git add .
   git commit -m "feat: setup vercel serverless api and cron"
   git remote add origin https://github.com/USERNAME/crypto-apples.git
   git branch -M main
   git push -u origin main
   ```

---

### LANGKAH 3: Import & Deploy ke Vercel

1. Buka [vercel.com](https://vercel.com) dan login dengan akun GitHub kamu.
2. Klik **"Add New..."** -> pilih **"Project"**.
3. Cari repository `crypto-apples` yang baru saja kamu push, lalu klik **"Import"**.
4. Di halaman konfigurasi:
   - **Framework Preset:** `Vite` (terdeteksi otomatis).
   - **Root Directory:** `./`
   - **Environment Variables**:
     Buka bagian accordion *Environment Variables*, tambahkan:
     - **Key:** `DATABASE_URL`
     - **Value:** `postgres://username:password@ep-xyz-pooler.ap-southeast-1.aws.neon.tech/crypto-apples?sslmode=require` (string Neon kamu)
5. Klik tombol **"Deploy"**!
6. Tunggu sekitar 1 menit. Vercel akan mem-build frontend dan mengaktifkan Serverless Edge Function di `/api/*` secara otomatis!

---

### LANGKAH 4: Konfigurasi Otomatis Vercel Cron (Sync Pasar Tiap 5 Menit)

Di project ini sudah disediakan file [`vercel.json`](file:///Users/aji/Projects/crypto-apples/vercel.json):
```json
{
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

Ketika kamu men-deploy ke Vercel:
1. Buka dashboard project kamu di Vercel -> menu **"Cron Jobs"** (di bawah tab *Settings* atau *Analytics*).
2. Kamu akan melihat task `/api/cron` aktif dengan jadwal `*/5 * * * *` (setiap 5 menit).
3. Vercel akan otomatis mengeksekusi `/api/cron` setiap 5 menit untuk menarik harga pasar koin terbaru dari CoinGecko dan menyimpannya langsung ke database Neon!

> 💡 **Opsional (Keamanan Cron):**  
> Vercel otomatis mengirim header `Authorization: Bearer <CRON_SECRET>` jika kamu memasukkan variabel `CRON_SECRET` di Vercel Environment Variables.

---

### LANGKAH 5: Setup Custom Domain (cryptoapples.net / .co)

1. Di dashboard project Vercel:
   - Masuk ke tab **Settings** -> **Domains**.
   - Ketik domain yang sudah kamu beli, misalnya: `cryptoapples.net` atau `www.cryptoapples.net`.
   - Klik **Add**.
2. Vercel akan memberikan petunjuk DNS:
   - Buat **A Record** mengarah ke: `76.76.21.21`
   - Atau **CNAME Record** untuk `www` mengarah ke: `cname.vercel-dns.com`
3. Masuk ke tempat kamu membeli domain (Namecheap, Niagahoster, Cloudflare, Domainesia, dll) dan masukkan record DNS di atas.
4. Dalam 5–15 menit, domainmu sudah aktif dengan sertifikat SSL HTTPS gratis otomatis dari Vercel!

---

## 🛡️ Catatan Tentang API Crypto & Rate Limit

1. **Apakah harus bayar CoinGecko API Pro ($129/bln)?**
   - **TIDAK PERLU.** Karena Vercel Cron hanya memanggil CoinGecko 1 kali setiap 5 menit (= ~8.640 calls per bulan), kuota **Demo API Key Gratis** (10.000 calls/bulan) sudah sangat mencukupi!
2. **Bagaimana jika CoinGecko down atau terkena rate limit?**
   - Frontend sudah dilengkapi **Tier-3 Multi-Fallback**:
     1. **Tier 1:** Mengambil data tersimpan dari Vercel API kamu (`/api/market`) yang super cepat karena dicache di Vercel Edge CDN.
     2. **Tier 2:** Jika database kosong, menembak langsung ke **CoinPaprika API** (100% gratis, 2.000 koin, tanpa butuh API key).
     3. **Live Layer:** **Binance Vision WebSocket Feed** untuk update harga tik-demi-tik real-time tanpa delay.

---

## 🔍 Ringkasan File Vercel di Repository Ini

| File Path | Fungsi |
|:---|:---|
| [`vercel.json`](file:///Users/aji/Projects/crypto-apples/vercel.json) | Konfigurasi Vercel Cron (`/api/cron` tiap 5 menit) |
| [`api/market.ts`](file:///Users/aji/Projects/crypto-apples/api/market.ts) | Vercel Edge Function untuk data pasar & cache CDN |
| [`api/cron.ts`](file:///Users/aji/Projects/crypto-apples/api/cron.ts) | Endpoint background sync harga pasar ke Neon DB |
| [`api/health.ts`](file:///Users/aji/Projects/crypto-apples/api/health.ts) | Health check status service & koneksi database |
| [`api/promotions.ts`](file:///Users/aji/Projects/crypto-apples/api/promotions.ts) | API banner iklan & link referral exchange |

---

## ⚡ Perintah Penting di Komputer Lokal

```bash
# Menjalankan frontend lokal
pnpm dev              # http://localhost:3000

# Testing Database & Sync Manual
pnpm db:migrate       # Membuat tabel di Neon Database
pnpm db:seed          # Mengisi data awal 100 koin & promo
pnpm sync:market      # Sync manual data pasar dari CoinGecko ke DB

# Build & Test Frontend
pnpm build            # Memastikan build Vite tidak ada error sebelum deploy
```

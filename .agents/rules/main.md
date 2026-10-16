# Architecture & Resource Distribution Rules

## Core Mindset: $0 Cost Selamanya via Resource Diversification

> **Prinsip Utama:** Setiap resource dan layanan harus terdistribusi secara seimbang ke berbagai penyedia layanan gratisan (Free Tier) terbaik di kelasnya. Jangan pernah menumpuk semua beban pada satu provider. Tujuan akhirnya adalah mempertahankan infrastruktur berjalan dengan **$0 cost selamanya**, tanpa resiko suspended/paused, dan minim friksi operasional.

---

## 1. Pembagian Peran Komponen (Resource Distribution)

| Komponen | Provider / Stack | Peran Spesifik | Alasan & Keuntungan |
| :--- | :--- | :--- | :--- |
| **Frontend UI** | **Cloudflare Pages** | Hosting static assets (HTML/JS/CSS) | Unlimited bandwidth, global CDN, 100% gratis tanpa batas kuota bulanan. |
| **API & Edge Cache** | **Cloudflare Workers** | Proxy tipis & Edge Caching endpoint | Response latency <30ms, menghemat koneksi langsung ke database. Menggunakan `wrangler.json` (mudah dimigrasi). |
| **Database** | **NeonDB (PostgreSQL)** | Persistent storage (coins, snapshots, referrals) | Standar PostgreSQL murni. **TIDAK ADA periode 7-day pause** (bebas dari resiko suspended seperti Supabase). |
| **Background Service** | **Trigger.dev** | Cron worker, API sync, heavy async jobs | Mengurangi beban compute di Cloudflare & browser. Otomatis retry & durable execution (50k free runs/bln). |
| **Realtime Market Ticks** | **Binance WebSocket** | Live ticker streaming langsung di browser | 100% gratis, unlimited, zero server load. |
| **Local User State** | **Browser LocalStorage** | Watchlist, favorites, client-side cache | 0 server request, privasi aman, instan render. |

---

## 2. Prinsip "Vendor Non-Locked" (Portabilitas Kode)

1. **Hindari Library / SDK Proprietary:**
   * **DILARANG** menggunakan client library khusus yang mengunci arsitektur ke satu vendor (contoh: `@supabase/supabase-js`, Firebase SDK).
   * **GUNAKAN** standar industri: Standard SQL query, standard connection string (`postgres://...`), dan standard `fetch` API.
2. **Konfigurasi yang Mudah Dimigrasi:**
   * Penggunaan `wrangler.json` / `wrangler.toml` dapat diterima karena strukturnya transparan dan mudah dipindahkan ke runtime lain (seperti Hono di Node.js / Bun / Fastify / Deno) jika diperlukan.
3. **Database Portabel:**
   * Skema database harus berupa DDL standar PostgreSQL murni (`CREATE TABLE`, standard types, standard indexing). Jika suatu saat ingin pindah dari NeonDB ke VPS self-hosted Postgres atau Supabase self-hosted, skema bisa langsung di-*import* tanpa modifikasi.

---

## 3. Strategi Efisiensi Operasional

* **Zero-Cold-Start Impact:** Manfaatkan Edge Caching di Cloudflare Workers agar user tetap mendapatkan respon instan meskipun database Neon sedang dalam kondisi *scale-to-zero compute*.
* **Offload Compute:** Jangan jalankan proses komputasi berat atau polling interval ketat di browser user atau di edge API. Delegasikan semua proses berulang (cron) ke Trigger.dev.
* **No Bloatware:** Utamakan terminal CLI (`wrangler`, `psql`, git) daripada dashboard grafis yang lambat dan mengikat.

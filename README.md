# 🚀 MarketInsight — E-Commerce Competitive Intelligence & Global Price Analytics Platform

[![Next.js](https://img.shields.io/badge/Next.js-15.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.10%2B-blue?style=for-the-badge&logo=python)](https://www.python.org/)
[![SQLite](https://img.shields.io/badge/SQLite-3.0-blue?style=for-the-badge&logo=sqlite)](https://www.sqlite.org/)
[![License](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)](LICENSE)

**MarketInsight** is a state-of-the-art E-Commerce Intelligence and Multi-Country Price Analytics Platform designed for brands, sellers, and market analysts. It provides automated, real-time scraping, cross-border price comparison, arbitrage margin calculations, and deep market trend analytics across major global retail platforms.

---

## 🌟 Key Features

### 🛍️ 1. Global Storefront Scraping Engine
- **Sephora International Grid**: 100% live bestseller extraction across **8 storefronts**:
  - 🇮🇹 Italy (`sephora-it`)
  - 🇫🇷 France (`sephora-fr`)
  - 🇩🇪 Germany (`sephora-de`)
  - 🇪🇸 Spain (`sephora-es`)
  - 🇬🇧 United Kingdom (`sephora-uk`)
  - 🇵🇱 Poland (`sephora-pl`)
  - 🇺🇸 United States (`sephora`)
  - 🇨🇦 Canada (`sephora-ca`)
- **Global Marketplaces**: Real-time integration with **Amazon** (US, UK, DE, FR, IT, ES, JP), **Walmart**, **Target**, **LEGO Store**, **Interflora**, and **Cdiscount**.
- **Zero Mock Data**: 100% authentic pricing, discount percentages, rating metrics, review counts, high-resolution product images, and direct native purchase links.

### 🛡️ 2. Stealth Anti-Bot Bypass Engine
- **Akamai & Cloudflare Stealth Engine**: Uses `puppeteer-extra-plugin-stealth` and `undetected-chromedriver` combined with Python `scrapling` and TLS fingerprint impersonation (`curl_cffi`).
- **Session Handshake & Cookie Clearance**: Automatic JS challenge execution and token persistence across sessions.

### 📊 3. Advanced Analytics & Arbitrage Engine
- **Cross-Border Price Comparison**: Compare identical product SKUs across different countries to identify pricing disparities.
- **Margin & Profit Calculator**: Calculate net profitability taking into account currency conversion, seller fees, shipping costs, and import taxes.
- **DuckDB & Plotly Visualizations**: High-performance SQL analytics on store pricing distributions, brand market share, and discount heatmaps.
- **Google Trends Integration**: View relative search interest for trending products directly alongside price tracking.

---

## 🏗️ Architecture & Project Structure

```
MarketInsight/
├── backend/                  # Node.js Express REST API & Database
│   ├── marketinsight.db      # SQLite Database Engine
│   ├── populate_sephora.js   # Multi-country Sephora population script
│   ├── populate_it.js        # Italy-focused Sephora population script
│   └── src/
│       ├── browserHelper.js  # Puppeteer Stealth Browser Launcher
│       ├── server.js         # Main Express API Server (Port 8000)
│       └── scrapers/         # Store scrapers (Sephora, Amazon, Walmart, etc.)
├── frontend/                 # Next.js 15 App Router Frontend
│   ├── src/
│   │   ├── app/              # Next.js Pages (Dashboard, Compare, Wiki)
│   │   ├── components/       # UI Components (Charts, Modals, Tables)
│   │   └── lib/              # API Client & Utility Functions
├── scraper/                  # Python Scrapling & Undetected Automation Engine
│   ├── scrapers/
│   │   ├── scrapling_scrapers.py        # Core Python scraping module
│   │   └── sephora_all_countries_test.py# Multi-country verification test
│   └── .venv/                # Isolated Python virtual environment
└── README.md
```

---

## 🚀 Quick Start Guide

### Prerequisites
Make sure you have installed:
- **Node.js**: `v20.0.0` or higher
- **npm**: `v9.0.0` or higher
- **Python**: `v3.10` or higher
- **Google Chrome**: Latest version installed (used by Puppeteer Stealth and Undetected Chromedriver)

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/willmartAQE/MarketInsight.git
cd MarketInsight
```

---

### Step 2: Install Backend & Scraper Dependencies

#### 1. Backend Setup:
```bash
cd backend
npm install
cd ..
```

#### 2. Python Scraper Setup:
```bash
cd scraper
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install undetected-chromedriver
cd ..
```

---

### Step 3: Configure Environment Variables

1. Copy `.env.example` in the `backend` folder to `.env`:
   ```bash
   cp backend/.env.example backend/.env
   ```
2. Edit `backend/.env` with your desired configuration (optional API keys for Amazon PA-API or eBay):
   ```env
   PORT=8000
   CORS_ORIGIN=*
   ```

---

### Step 4: Populate SQLite Database

To populate the database with live e-commerce data from Sephora (8 countries), run:
```bash
node backend/populate_sephora.js
```

---

### Step 5: Launch Backend Server

Start the backend API server:
```bash
npm start --prefix backend
```
The server will run at: `http://localhost:8000`

---

### Step 6: Launch Frontend Application

In a new terminal window, start the Next.js development server:
```bash
npm run dev --prefix frontend
```
Open your browser and navigate to: `http://localhost:3000`

---

## 📡 REST API Documentation

### 1. Get Products
`GET /api/products`

**Query Parameters:**
- `source`: Filter by store source (e.g. `sephora-it`, `sephora-fr`, `sephora`, `amazon`)
- `country`: Filter by country code (e.g. `IT`, `FR`, `US`, `DE`)
- `category`: Filter by product category (e.g. `Beauty`, `Electronics`)
- `search`: Full-text search term in product titles

**Sample Response:**
```json
[
  {
    "id": 1,
    "name": "SOL DE JANEIRO Brazilian Crush Body Fragrance Mist 90 ml",
    "price": 18.20,
    "original_price": 26.00,
    "discount_pct": 30,
    "rating": 4.6,
    "reviews_count": 12745,
    "category": "Beauty",
    "source": "sephora-it",
    "url": "https://www.sephora.it/p/brazilian-crush-body-fragrance-mist---spray-profumato-corpo-P3347006.html",
    "image_url": "https://media.sephora.eu/content/dam/gdam/europe/digital/pim/published/S/SOL_DE_JANEIRO/P3347006/23644-media_principal-1.jpg",
    "seller": "Sephora Italia",
    "country": "IT",
    "currency": "€"
  }
]
```

### 2. Get Active Sources & Stores
`GET /api/sources`

Returns store counts and coverage metadata across all active e-commerce platforms.

### 3. Analytics & Price Distribution
`GET /api/analytics`

Returns high-level DuckDB price distribution stats and category breakdowns.

---

## 🔒 Security & Best Practices

- **Zero API Key Leakage**: All `.env` files and `.db` database binaries are excluded from Git repository tracking via `.gitignore`.
- **Environment Templates**: Always use `backend/.env.example` to document environment variables safely.

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for details.

---

## 🤝 Contributing

Contributions are welcome! Feel free to open an **Issue** or submit a **Pull Request**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

# RideVault Pro 🏍️ (100% Free & Local-First Sandbox)

RideVault Pro is an enterprise-grade, AI-powered multi-vendor motorcycle riding gear marketplace and multi-warehouse inventory management platform. This codebase runs **100% locally and completely free** using smart sandbox mock engines for paid third-party APIs (databases, payments, image uploads, and AI).

---

## 📂 Project Architecture

```text
ridevault-pro/
├── backend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── controllers/      # Business logic (Auth, Products, Orders, AI, Stitch)
│   │   │   ├── middlewares/      # Security, JWT + Refresh tokens, RBAC permissions
│   │   │   └── routes/           # Routing layers
│   │   ├── config/               # Fallback JSON-DB setups
│   │   ├── services/             # Native Gemini LLM wrapper, simulated payments
│   │   └── app.ts                # HTTP & Socket.io server bootstrap
│   ├── data/                     # Local file persistence database (.json)
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── api/                  # Axios HTTP client with JWT interceptors
│   │   ├── context/              # Auth, cart, compare, and WebSocket notification state
│   │   ├── App.tsx               # Main layout and multi-role views
│   │   └── index.css             # Tailwind style sheets and custom scrollbars
│   ├── index.html
│   └── vite.config.ts
└── package.json                  # Root monorepo run controller
```

---

## ⚡ Quick Start (No setup required)

To boot up both backend (port 5000) and frontend (port 3000) concurrently with zero installations needed elsewhere:

1. **Navigate to the workspace directory:**
   ```bash
   cd /Users/charithas/.gemini/antigravity/scratch/ridevault-pro
   ```
2. **Install dependencies in all folders:**
   ```bash
   npm install && npm run install-all
   ```
3. **Launch the concurrent servers:**
   ```bash
   npm run dev
   ```
4. **Open your browser:** Go to `http://localhost:3000`.

---

## 🛠️ Sandbox Credentials & Demo Roles

To easily demo and test the different roles on the platform:
- **Registration:** Register any email and choose a role:
  - **Standard Rider (Customer):** Places orders, redemptions, compares gear, writes reviews.
  - **Gear Manufacturer (Vendor):** Defines variant stock levels, checks warehouse alerts, manages products.
  - **Platform Moderator (Admin):** GST seller approval validation, checks system audit logs.
- **Verification Hook:** If you register as a Vendor, sign out, sign back in as an **Admin**, go to the **Admin Panel**, and approve the seller account to enable product listings.

---

## 🔌 Stitch MCP Sandbox Console

A **Stitch MCP Console** has been integrated into the client dashboard. This panel lets you:
- Inspect available Model context endpoints (`stitch/list_models`, `stitch/query_index`, `stitch/apply_refactor`).
- Test JSON payloads directly in a simulated sandboxed terminal.
- View real-time output responses.
- Inspect logs logged to the platform security audit trail.

---

## ⚙️ Environment Configurations

By default, the system operates locally without credentials. To activate live integrations, configure these in `backend/.env`:
- `GEMINI_API_KEY`: Add your Google AI Studio API key to switch from mock search matching to live LLM generation.
- `MONGO_URI`: Add a MongoDB connection string to switch from JSON file databases to MongoDB Atlas.

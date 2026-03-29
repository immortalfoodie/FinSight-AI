# 💸 AI Money Mentor

**Your AI-Powered Personal Finance Advisor** — A comprehensive AI personal finance platform offering FIRE planning, tax optimization, portfolio analysis, and more, specifically tailored for the Indian financial context.

![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite)
![License](https://img.shields.io/badge/License-Private-red)

## ✨ Features

- **📊 Dashboard** — Get a comprehensive overview of your financial health, net worth tracking, and recent activity.
- **🔥 FIRE Planner** — Plan your Financial Independence, Retire Early journey with intelligent inflation and corpus projections.
- **💰 Tax Wizard** — Smart tax optimization with old vs. new regime comparison based on Indian taxation rules.
- **💍 Life Event Advisor** — Financial guidance for major life events like marriage, buying a house, or having a child.
- **👫 Couples Planner** — Joint financial planning for partners, helping align financial goals and budgets.
- **📈 Portfolio X-Ray** — Deep analysis of your investment portfolio with support for extracting data from uploaded documents.
- **🛡️ Privacy-First** — All execution, processing, and data storage happens locally in your browser.

## 🛠️ Tech Stack

- **Frontend:** React 19, Vite 8
- **Styling:** Custom Vanilla CSS with a premium dark-mode glassmorphism design system
- **Charts & Visualization:** Recharts
- **Icons:** Lucide React
- **Document Processing:** `pdfjs-dist`, `tesseract.js`

---

## 🚀 Setup & Installation

Follow these steps to get the project up and running on your local machine.

### 📋 Prerequisites

Ensure you have the following installed:
- **Node.js** (v18.0.0 or higher recommended)
- **npm** (comes with Node.js)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd eco-gemini-try
```

### 2. Install Dependencies

Install all the required npm packages:

```bash
npm install
```

### 3. Start the Development Server

Run the app in development mode:

```bash
npm run dev
```

The application will start and be available at [http://localhost:5173](http://localhost:5173). The page will automatically reload if you make code edits.

---

## 🔧 Available Commands

In the project directory, you can run:

| Command | Description |
|---------|-------------|
| `npm run dev` | Starts the Vite development server with Hot Module Replacement (HMR). |
| `npm run build` | Builds the app for production to the `dist` folder. It optimizes the build for the best performance. |
| `npm run preview` | Boots up a local static web server that serves the files from `dist/` to let you preview the production build locally. |
| `npm run lint` | Runs ESLint to check for code quality and syntax issues. |

---

## 📁 Project Structure

```
eco-gemini-try/
├── public/                 # Static assets that are copied directly to the build
├── src/
│   ├── agents/             # Logic for intelligent agents processing financial data
│   ├── assets/             # Images, SVGs, and other media
│   ├── components/         # Reusable UI components (Sidebar, Inputs, Cards, etc.)
│   ├── context/            # React Contexts (e.g., UserProfileContext for global state)
│   ├── engine/             # Core calculation engines (Tax, FIRE, Portfolio, Couples)
│   ├── pages/              # Main application views/pages
│   ├── utils/              # Helper functions and utilities
│   ├── App.jsx             # Main application wrapper and routing structure
│   ├── index.css           # Global vanilla CSS (tokens, utilities, glassmorphism)
│   └── main.jsx            # Application entry point
├── eslint.config.js        # ESLint configuration
├── package.json            # Project dependencies and scripts
└── vite.config.js          # Vite build configuration
```

---

## 🔐 Privacy & Security

This application prioritizes user data security:
- **Local Storage Only:** Data is stored using standard browser mechanisms like localStorage/sessionStorage or React Context state.
- **No Telemetry/Server Uploads:** Processing for document reading, OCR, and financial calculations happens entirely client-side.
- **Zero-Knowledge Architecture:** Your financial data and credentials never leave your device.

---

## ⚠️ Disclaimer

This application provides AI-generated and algorithm-based financial guidance for educational purposes only. It does not constitute professional financial advice. Always consult with a certified financial planner or tax consultant before making significant investment or tax decisions.

---
Built with ❤️ for the Indian financial community.

# AI Money Mentor

**Your AI-Powered Personal Finance Advisor** — India's first comprehensive AI personal finance platform offering FIRE planning, tax optimization, portfolio analysis, and more.

![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite)
![License](https://img.shields.io/badge/License-Private-red)

## ✨ Features

- **📊 Dashboard** — Get a comprehensive overview of your financial health
- **🔥 FIRE Planner** — Plan your Financial Independence, Retire Early journey
- **💰 Tax Wizard** — Smart tax optimization with dual regime comparison
- **💍 Life Event Advisor** — Financial guidance for major life events
- **👫 Couples Planner** — Joint financial planning for partners
- **📈 Portfolio X-Ray** — Deep analysis of your investment portfolio with PDF/image upload support

## 🛠️ Tech Stack

- **Frontend:** React 19 with Vite 8
- **Charts:** Recharts
- **Icons:** Lucide React
- **PDF Processing:** pdfjs-dist
- **OCR:** Tesseract.js
- **Styling:** Custom CSS with glass-morphism design

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher recommended)
- **npm** (v9.0.0 or higher) or **yarn**

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd eco-gemini-try
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or the next available port).

### 4. Build for Production

```bash
npm run build
```

The production build will be output to the `dist/` folder.

### 5. Preview Production Build

```bash
npm run preview
```

## 📁 Project Structure

```
├── public/               # Static assets
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── agents/           # AI agent logic
│   ├── assets/           # Images and media
│   ├── components/       # Reusable UI components
│   │   ├── AdvisorPanel.jsx
│   │   ├── AIDisclaimer.jsx
│   │   ├── OnboardingFlow.jsx
│   │   ├── Sidebar.jsx
│   │   └── ...
│   ├── context/          # React context providers
│   ├── data/             # Static data and configurations
│   ├── engine/           # Core calculation engine
│   ├── pages/            # Main application pages
│   │   ├── Dashboard.jsx
│   │   ├── FirePlanner.jsx
│   │   ├── TaxWizard.jsx
│   │   ├── LifeEventAdvisor.jsx
│   │   ├── CouplesPlanner.jsx
│   │   └── PortfolioXRay.jsx
│   ├── utils/            # Utility functions
│   ├── App.jsx           # Main application component
│   ├── index.css         # Global styles
│   └── main.jsx          # Application entry point
├── index.html            # HTML template
├── vite.config.js        # Vite configuration
├── eslint.config.js      # ESLint configuration
└── package.json          # Project dependencies
```

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint to check code quality |

## 🔐 Privacy & Data

- **Session-based storage** — Your data stays in your browser session
- **No server uploads** — All processing happens locally
- **Privacy-first design** — Your financial data never leaves your device

## 🎨 Design Features

- Dark theme with glass-morphism UI
- Responsive design for all screen sizes
- Real-time AI advisor panel
- System activity logging for transparency

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## ⚠️ Disclaimer

This application provides AI-generated financial guidance for educational purposes only. It does not constitute professional financial advice. Always consult with a qualified financial advisor before making investment decisions.

## 📄 License

This project is private and proprietary.

---

Built with ❤️ for the Indian financial community

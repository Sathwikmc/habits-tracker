# 🌱 Habits. — Visual Habit Tracker  

> A clean, dark-themed, single-page habit tracking app built with React. No chart l ibraries. Just React + raw SVG.

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)
![Zero Chart Libs](https://img.shields.io/badge/Charts-Raw%20SVG-blueviolet?style=flat-square)

---

## ✨ Features

- ✅ Add unlimited habits with custom color labels
- ☑️ Check off habits daily with one tap
- 📈 14-day smooth bezier line graph (combined completion %)
- 📅 Weekly analysis — completion %, streaks, daily bars, per-habit progress
- 🗓️ Monthly analysis — 30-day graph, best/worst habit cards, activity heatmap
- 🔥 Best streak counter (all habits done consecutively)
- 🗺️ GitHub-style activity heatmap
- 🚫 Zero chart dependencies — built with raw SVG

---

## 🚀 Quick Start

```bash
# 1. Clone
git clone https://github.com/your-username/habits-tracker.git
cd habits-tracker

# 2. Install
npm install

# 3. Run locally
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) — done.

---

## 📁 Project Structure

```
habits-tracker/
├── public/
│   └── favicon.svg
├── src/
│   ├── App.jsx        ← entire app (components + logic)
│   ├── main.jsx       ← React entry point
│   └── index.css      ← global reset
├── index.html
├── package.json
├── vite.config.js
├── vercel.json        ← Vercel deploy config
└── .gitignore
```

---

## ☁️ Deploy to Vercel

### Option A — Via GitHub (recommended)

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project**
3. Import your GitHub repo
4. Vercel auto-detects Vite — click **Deploy**
5. Live in ~30 seconds at `https://habits-tracker-yourname.vercel.app`

### Option B — Vercel CLI

```bash
npm install -g vercel
vercel
```

Follow the prompts. Done.

---

## 🛠️ Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start local dev server at localhost:5173 |
| `npm run build` | Build for production → `/dist` |
| `npm run preview` | Preview the production build locally |

---

## 🔧 Customization

**Change colors:**
```js
// src/App.jsx — top of file
const PALETTE = ["#FF6B6B","#4ECDC4","#FFD93D", ...];
```

**Change graph range:**
```js
const d14 = lastNDays(14); // change to any number
const d30 = lastNDays(30); // change to any number
```

**Add localStorage persistence:**
```js
// Replace useState([]) with:
const [habits, setHabits] = useState(() => {
  try { return JSON.parse(localStorage.getItem("habits") || "[]"); }
  catch { return []; }
});

// Add inside App():
useEffect(() => {
  localStorage.setItem("habits", JSON.stringify(habits));
}, [habits]);
```

---

## 📊 How the Graph Works

Pure SVG — no libraries:

1. `lastNDays(14)` → array of `YYYY-MM-DD` date strings
2. `scores()` → maps each day to a 0–1 completion ratio
3. Points plotted on SVG canvas (x = time, y = score)
4. Cubic bezier curves connect each point (`C` SVG command)
5. Area closed to bottom and filled with a gradient

---

## 📄 License

MIT © 2026 — free to use, fork, and build on.

---

> *"We are what we repeatedly do."* — Aristotle

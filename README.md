# Cadence

**Find your rhythm.** — A student timetable and study management app.

## Status: Work in progress 🚧

This project is under active development. Currently building:

- [x] Project scaffolding (frontend + backend)
- [x] Dark/light theme system with persistence
- [ ] Custom UI component library (buttons, inputs, dropdowns, checkboxes, modal)
- [ ] Authentication (signup/login/logout, JWT)
- [ ] Profile creation & editing
- [ ] Timetable workspace builder (name → days → slots → empty grid)

Not built yet, later phases: subjects, homework tracking, attendance, analytics, files, sharing.

## Tech stack

- **Frontend:** React + Vite + Tailwind CSS v4
- **Backend:** Node.js + Express
- **Database:** PostgreSQL
- **Auth:** JWT (email/password)

## Running locally

\`\`\`bash
# backend
cd backend
npm install
cp .env.example .env
npm run dev

# frontend
cd frontend
npm install
npm run dev
\`\`\`

This README will be updated as features are completed.

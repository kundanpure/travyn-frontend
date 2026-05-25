# Travyn Frontend

> **Trusted Solo Travel Network** — Next.js Web Application

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Private-red?style=flat-square)]()

---

## Overview

Travyn helps verified solo travelers discover, connect, and co-travel with compatible companions. This repository contains the frontend web application — a modern, dark-themed SPA built with Next.js and TypeScript.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 (strict) |
| **Styling** | Tailwind CSS v4 + Custom Design System |
| **State** | Zustand (persisted auth store) |
| **HTTP** | Axios (with token refresh interceptor) |
| **Icons** | Lucide React |
| **Build** | Turbopack |

## Project Structure

```
frontend/
├── src/
│   ├── app/                        # Next.js App Router pages
│   │   ├── layout.tsx              # Root layout (fonts, metadata)
│   │   ├── page.tsx                # Landing page
│   │   ├── globals.css             # Design system & tokens
│   │   ├── login/
│   │   │   └── page.tsx            # Sign in
│   │   ├── register/
│   │   │   └── page.tsx            # Sign up
│   │   ├── verify-email/
│   │   │   └── page.tsx            # Email verification
│   │   ├── forgot-password/
│   │   │   └── page.tsx            # Request password reset
│   │   ├── reset-password/
│   │   │   └── page.tsx            # Set new password
│   │   └── dashboard/
│   │       ├── layout.tsx          # Dashboard shell (sidebar)
│   │       └── page.tsx            # Dashboard home
│   ├── lib/
│   │   └── api.ts                  # Axios instance + interceptors
│   └── stores/
│       └── auth-store.ts           # Zustand auth state
├── public/                         # Static assets
├── tailwind.config.ts
├── tsconfig.json
├── next.config.ts
└── package.json
```

## Pages & Routes

| Route | Page | Auth Required |
|-------|------|:------------:|
| `/` | Landing page | No |
| `/login` | Sign in | No |
| `/register` | Create account | No |
| `/verify-email` | Email verification | No |
| `/forgot-password` | Request reset link | No |
| `/reset-password?token=` | Set new password | No |
| `/dashboard` | User dashboard | Yes |

## Design System

The app uses a custom dark-themed design system built with Tailwind v4 CSS variables:

- **Primary:** Emerald/teal gradient (`#2dd4a8` → `#1fae8a`)
- **Accent:** Warm amber (`#f0a030`)
- **Background:** Deep navy-black (`#06080c` → `#141c2b`)
- **Typography:** Inter (body) + Outfit (display)
- **Components:** `t-btn-primary`, `t-btn-outline`, `t-input`, `t-gradient-text`

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- Backend API running on `http://localhost:8080`

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/kundanpure/travyn-frontend.git
   cd travyn-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment** (optional)
   ```bash
   # Create .env.local if using a non-default API URL
   echo "NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1" > .env.local
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

### Production Build

```bash
npm run build
npm start
```

## API Integration

The frontend communicates with the [Travyn Backend](https://github.com/kundanpure/Travyn-backend) via Axios:

- **Base URL:** `http://localhost:8080/api/v1` (configurable via `NEXT_PUBLIC_API_URL`)
- **Auth:** Bearer token in `Authorization` header
- **Token Refresh:** Automatic — interceptor catches 401 and retries with refreshed token
- **State:** Auth data persisted to `localStorage` via Zustand

## Auth Flow

```
Register → Email Sent → Verify Email → Login → Dashboard
                              ↑
                        Resend Verification
                        
Login (unverified) → Shows "Resend" banner
Login (forgot) → Forgot Password → Email Sent → Reset Password → Login
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

## License

Private — All rights reserved.

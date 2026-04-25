# Cantio Frontend

A premium, interactive music generation interface built with Next.js 15. The UI is designed to be high-density yet airy, focusing on a tactile "Composer Studio" experience.

## Design Philosophy
- **Tactile Feedback**: Every button and card uses Framer Motion for spring-based physical reactions (`whileTap`, `whileHover`).
- **Visual Feedback**: Real-time generation status tracking with animated sequence indicators.
- **Resilience**: Synchronous submission locks and automatic form clearing to prevent duplicate generation requests.

---

## Getting Started

### Prerequisites
- Node.js 20+
- Backend API running at `http://localhost:8000`

### Setup & Run
1. **Navigate**: `cd frontend`
2. **Install**: `npm install`
3. **Environment**:
   The app defaults to `http://localhost:8000` for the API. To override, create a `.env.local` file:
   ```bash
   NEXT_PUBLIC_API_URL=http://your-api-url
   ```
4. **Run**:
   ```bash
   npm run dev
   ```

## UI & Template Layer (`app/`)

The frontend follows an **MVT-like pattern** where Next.js Pages act as the Templates that orchestrate interactions between the user and the Backend REST API.

### Core Pages
- **Login (`/login`)**: The entry point. Handles Google OAuth initiation and user redirection.
- **Dashboard (`/dashboard`)**: The primary library template. Fetches and displays the user's collection of generated tracks.
- **Generate (`/generate`)**: The "Composer Studio" interface. Manages complex form state and real-time generation lifecycles.
- **Favourites (`/favourites`)**: A filtered template displaying only starred compositions.
- **Share (`/share/[id]`)**: A public-facing template for track previews.

### Smart Components
- **`SongCard`**: Handles resource-specific actions like favouriting, deleting, and toggling public visibility.
- **`AudioPlayerBar`**: A persistent global component that streams audio from the backend-provided CDN URLs.

---

## Infrastructure & State

## Commands

| Task | Command |
|---|---|
| Development | `npm run dev` |
| Production Build | `npm run build` |
| Linting | `npm run lint` |
| Type Check | `npx tsc` |

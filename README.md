# Pokédex Frontend

A modern Vue 3 + TypeScript web application for exploring Pokémon, managing favorites, building teams, connecting with friends, and battling. Features a premium dark-mode Pokémon-themed UI with glassmorphism effects and smooth animations.

## Tech Stack

- **Framework**: Vue 3 (Composition API)
- **Language**: TypeScript
- **Build Tool**: Vite
- **State Management**: Pinia
- **Routing**: Vue Router 4
- **HTTP Client**: Axios
- **Icons**: Font Awesome 6
- **Styling**: Custom CSS with CSS variables, glassmorphism, and animations

## Setup

```bash
# Install dependencies
npm install

# Run development server (requires backend running on port 3000)
npm run dev

# Build for production
npm run build
```

> **Note**: The frontend proxies API requests to `http://localhost:3000` in development.
> Make sure the backend server is running first.

## Features

- 🔐 **Authentication** — Register/Login with email and password
- 📖 **Pokédex** — Browse Pokémon with filtering by Name, Type 1, Type 2, and Region
- 📊 **Pokémon Details** — Stats, species info, abilities, moves, and evolution chain
- ❤️ **Favorites** — Save and manage your favorite Pokémon
- 👥 **Teams** — Create teams with up to 6 Pokémon each
- 🤝 **Friends** — Add friends via unique friend code
- ⚔️ **Battles** — Challenge friends to turn-based battles with type effectiveness

## Project Structure

```
src/
├── api/
│   └── client.ts          # Axios instance with JWT interceptor
├── components/
│   ├── NavBar.vue          # Responsive navigation bar
│   ├── PokemonCard.vue     # Pokémon card with sprite and type badges
│   ├── StatsChart.vue      # Animated stat bars
│   └── EvolutionChain.vue  # Horizontal evolution chain
├── router/
│   └── index.ts            # Routes with auth guards
├── stores/
│   ├── auth.ts             # Authentication state
│   ├── pokemon.ts          # Pokémon list & filters
│   ├── favorites.ts        # Favorites management
│   ├── teams.ts            # Team CRUD
│   ├── friends.ts          # Friends system
│   └── battles.ts          # Battle system
├── views/
│   ├── LoginView.vue       # Login page
│   ├── RegisterView.vue    # Registration page
│   ├── PokedexView.vue     # Main Pokédex browser
│   ├── PokemonDetailView.vue # Pokémon detail page
│   ├── FavoritesView.vue   # Favorites collection
│   ├── TeamsView.vue       # Team management
│   ├── FriendsView.vue     # Friend system
│   ├── BattleView.vue      # Battle arena
│   └── BattleDetailView.vue # Battle replay
├── App.vue                 # Root component
├── main.ts                 # App entry point
└── style.css               # Global design system
```

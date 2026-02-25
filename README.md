# IdleMMO Profit Calculator

A comprehensive profit calculator for IdleMMO that helps players optimize their gold-per-hour across dungeons, potion crafting, and resource gathering.

## Features

- **Dungeon Profit Analysis**: Calculate expected profit per hour for all 18 dungeons based on drop rates and Magic Find settings
- **Potion Crafting Calculator**: Compare crafting costs vs. market prices for 6 craftable potions
- **Resource Gathering Optimizer**: Analyze vendor vs. market selling strategies for resources
- **Magic Find Customization**: Adjust Streak, Dungeon, Item, and Bonus MF values
- **Market Tax Aware**: Automatically accounts for 12% market tax in profit calculations
- **Real-time Price Updates**: (Coming soon) Integration with IdleMMO API for live market prices

## Tech Stack

- **Vite** - Fast build tool and dev server
- **Vue 3** - Progressive JavaScript framework with Composition API
- **TypeScript** - Type-safe development
- **ESLint + Prettier** - Code quality and formatting

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Development Commands

```bash
# Run linter
npm run lint

# Format code
npm run format

# Type checking
npx vue-tsc --noEmit
```

## Project Structure

```
idle-mmo-profiter/
├── src/
│   ├── data/
│   │   └── defaults.json  # Game data (345 recipes, 18 dungeons, etc.)
│   ├── types/
│   │   └── index.ts     # TypeScript type definitions
│   ├── App.vue          # Root component
│   ├── main.ts          # Application entry point
│   └── style.css        # Global styles (IdleMMO dark theme)
├── scripts/
│   └── generate-defaults-json.js  # Excel extraction script
├── Idlemmo.xlsx         # Source data spreadsheet
└── vite.config.ts       # Vite configuration
```

## Data Model

The calculator uses a comprehensive data model extracted from the Excel spreadsheet:

- **345 Recipes** with prices, drop chances, and values
- **18 Dungeons** with run costs, times, and complete drop tables
- **11 Materials** with market prices
- **6 Potions** with market prices
- **7 Resources** with vendor and market prices
- **6 Potion Crafts** with ingredient requirements and craft times
- **12 Resource Gathering** activities with time and cost data

All data is statically typed with TypeScript interfaces for type safety.

## Development Roadmap

- [x] Epic 1: Project Scaffolding & Core Data Model
- [ ] Epic 2: API Integration Layer (Rate-Limited Client)
- [ ] Epic 3: Local Storage Persistence & Manual Data Entry
- [ ] Epic 4: Profit Calculation Engine
- [ ] Epic 5: UI Components & Data Tables
- [ ] Epic 6: Visualization & Charts
- [ ] Epic 7: Polish & Deployment

## License

ISC

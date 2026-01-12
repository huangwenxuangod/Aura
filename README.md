# Aura - Predict Your Behavior

Aura is a behavioral finance app that helps users achieve personal goals through **real money staking**, **social supervision**, and a unique **recovery mechanism**.

## 🎯 Core Features

- **Prediction System**: Create predictions with stake credits and deadlines
- **Referee System**: Invite friends as referees to verify your success
- **Recovery Mode**: Failed predictions enter recovery mode - 2 consecutive successes to recover
- **Credit System**: Purchase credits to stake on predictions

## 🛠 Tech Stack

- **Client**: React Native (Expo)
- **UI**: NativeWind (Tailwind CSS for RN)
- **State**: Zustand
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Payments**: Stripe

## 📁 Project Structure

```
aura/
├── app/                    # Expo Router pages
│   ├── (auth)/            # Auth screens (login, register)
│   ├── (tabs)/            # Tab screens (home, prediction, profile)
│   ├── (screens)/         # Stack screens (details, settings)
│   └── referee/           # Referee flow
├── components/            # Reusable components
│   └── ui/               # UI primitives
├── hooks/                 # Custom hooks
├── lib/                   # Utilities and configs
├── services/              # API services
├── stores/                # Zustand stores
├── supabase/              # Supabase config and migrations
│   ├── functions/        # Edge Functions
│   └── migrations/       # Database migrations
└── types/                 # TypeScript types
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Expo CLI
- Supabase CLI
- Android Studio (for Android development)

### Installation

1. Clone the repository
```bash
git clone https://github.com/your-repo/aura.git
cd aura
```

2. Install dependencies
```bash
pnpm install
```

3. Copy environment variables
```bash
cp env.example .env
```

4. Configure environment variables in `.env`

5. Start the development server
```bash
pnpm start
```

### Supabase Setup

1. Create a new Supabase project
2. Run migrations:
```bash
supabase db push
```

3. Deploy Edge Functions:
```bash
supabase functions deploy stripe-checkout
supabase functions deploy stripe-webhook
```

4. Configure Stripe webhook in Supabase dashboard

## 📱 Core Flows

### Prediction Flow
1. User creates prediction with title, deadline, and stake
2. System generates unique referee code
3. User shares code with friends
4. Friends join as referees
5. At deadline (or user request), prediction enters JUDGING
6. Referees vote YES/NO
7. Majority determines outcome
8. Success: stake returned | Failure: enters recovery mode

### Recovery Mode
- First failure: stake enters recovery
- Need 2 consecutive successes to recover
- Fail during recovery: stake forfeited to platform

### Referee Flow
1. Receive referee code from friend
2. Open app with code (deep link)
3. View prediction details and check-ins
4. Vote when judgment requested
5. No vote in 24h = YES

## 📄 License

MIT

# Crowdfund Frontend (Working)

This frontend is a minimal, working Next.js app (no wagmi/RainbowKit) that uses ethers v6 and MetaMask for contributions.

## Setup

1. Install deps

```bash
npm install
```

2. Configure env

Copy `.env.local.example` to `.env.local` and set your RPC and deployed contract address.

3. Run dev server

```bash
npm run dev
```

4. Open http://localhost:3000

Notes:
- The app will first try to fetch campaigns from `NEXT_PUBLIC_BACKEND_URL` if set; otherwise it will call the contract directly via `NEXT_PUBLIC_RPC_URL`.
- For contributions, MetaMask must be installed.


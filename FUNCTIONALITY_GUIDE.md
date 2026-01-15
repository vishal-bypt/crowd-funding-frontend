# Crowdfund Frontend - Functionality Understanding Document

## Project Overview

**Crowdfund Frontend** is a minimal, lightweight Next.js 14 application designed to provide a user interface for interacting with a blockchain-based crowdfunding smart contract. The application uses **ethers.js v6** for blockchain interactions and **MetaMask** for wallet connections, without relying on higher-level libraries like wagmi or RainbowKit.

**Technology Stack:**
- Next.js 14.2.0 (React framework)
- React 18.2.0
- ethers.js 6.13.4 (Blockchain library)
- axios 1.5.0 (HTTP client)
- Target Network: Ethereum Sepolia Testnet

---

## Architecture Overview

### Project Structure

```
crowdfund-frontend-working/
├── package.json
├── README.md
├── pages/
│   ├── _app.js                 # Next.js app wrapper
│   ├── index.js                # Home page (campaigns list)
│   ├── api/
│   │   └── contract.js         # Backend API route for campaign data
│   └── campaign/
│       ├── [id].js             # Campaign detail page
│       └── create.js           # Campaign creation page
├── styles/
│   └── globals.css             # Global styling
```

### Data Flow Architecture

```
User Interface (Pages)
    ↓
API Routes / Contract Calls
    ↓
Smart Contract / Backend Server
    ↓
Blockchain Data
```

---

## Core Pages & Components

### 1. **Home Page** (`pages/index.js`)

**Purpose:** Display all campaigns and provide navigation to create new campaigns.

**Key Features:**
- Lists all active crowdfunding campaigns
- Shows campaign metrics: title, description, funding goal, and amount pledged
- Dual data source support:
  - Primary: Backend server (if `NEXT_PUBLIC_BACKEND_URL` is set)
  - Fallback: Direct blockchain contract calls via RPC
- Quick links to smart contract on Etherscan
- Create campaign button for new campaigns

**Data Fetching Logic:**
```
1. On component mount, check if NEXT_PUBLIC_BACKEND_URL exists
2. If YES → Fetch from: ${NEXT_PUBLIC_BACKEND_URL}/api/campaigns
3. If NO → Fetch from: /api/contract (local API route)
```

**Displayed Information per Campaign:**
- Campaign ID / Title
- Description
- Funding Goal (in ETH)
- Amount Pledged (in ETH)
- View button (links to campaign detail)

**Utility Function:** `formatWei(wei)`
- Converts Wei to ETH format with 6 decimal places
- Handles edge cases and invalid inputs

---

### 2. **Campaign Detail Page** (`pages/campaign/[id].js`)

**Purpose:** Display detailed information about a specific campaign and allow contributions.

**Key Features:**
- Displays complete campaign information
- Shows all investors/contributors with their amounts and percentages
- Enables ETH contribution directly through MetaMask
- Real-time investor list updates

**Campaign Data Structure:**
```javascript
{
  owner: address,           // Campaign creator's wallet
  title: string,           // Campaign name
  description: string,     // Campaign details
  goal: uint256,           // Funding target (in Wei)
  pledged: uint256,        // Amount raised so far (in Wei)
  deadline: uint256,       // Timestamp when campaign ends
  withdrawn: boolean       // Whether funds were withdrawn
}
```

**Investor Information Displayed:**
- Wallet address
- Contribution amount (in ETH)
- Percentage of total contributions

**Contribution Process:**
1. User clicks "Contribute 0.01 ETH" button
2. MetaMask popup requests account access
3. Transaction is sent to smart contract
4. Fixed amount: 0.01 ETH (hardcoded)
5. Upon success, page reloads to show updated data

**Supported Actions:**
- View campaign details
- View all investors and their contributions
- Contribute 0.01 ETH to the campaign
- Navigate back to home page

---

### 3. **Create Campaign Page** (`pages/campaign/create.js`)

**Purpose:** Allow users to create new crowdfunding campaigns.

**Key Features:**
- Form-based campaign creation
- Input validation (all fields required)
- Automatic ETH to Wei conversion
- Supports both backend server and contract direct submission

**Form Fields:**
1. **Campaign Title** (text input, required)
   - User-friendly campaign name
   - Example: "New Product Launch"

2. **Description** (textarea, required)
   - Detailed campaign information
   - Multi-line support (min 4 rows)

3. **Funding Goal** (number input, required)
   - Amount in ETH (not Wei)
   - Step: 0.000001 (6 decimals)
   - Minimum: 0

**Campaign Creation Logic:**
1. User fills form and submits
2. System converts goal from ETH to Wei: `goal * 10^18`
3. Sets fixed duration: 86,400 seconds (24 hours)
4. Determines submission endpoint:
   - If `NEXT_PUBLIC_BACKEND_URL` exists → POST to backend
   - Otherwise → POST to `/api/contract`
5. On success → Redirects to home page
6. On error → Displays error alert

**Data Submission Format:**
```javascript
{
  title: string,              // Campaign name
  description: string,        // Campaign details
  goal: string,              // Goal in Wei (as string for BigInt)
  durationSeconds: 86400     // 24 hours in seconds
}
```

---

## API Routes

### API Route: `pages/api/contract.js`

**Purpose:** Backend endpoint for fetching campaign data from the blockchain or an external backend.

**HTTP Method:** GET

**Response Format:**
```javascript
[
  {
    id: number,               // Campaign index (0-49)
    title: string,
    description: string,
    goal: string,            // In Wei format (as string)
    pledged: string,         // In Wei format (as string)
    deadline: number,        // Unix timestamp
    withdrawn: boolean,
    holders: [               // Array of investors
      {
        address: string,     // Investor wallet
        amount: string,      // Contribution in Wei (as string)
        pct: string         // Percentage of total (2 decimals)
      }
    ]
  }
]
```

**Dual Mode Operation:**

**Mode 1: Backend Server (If `NEXT_PUBLIC_BACKEND_URL` is set)**
- Fetches from external backend: `${NEXT_PUBLIC_BACKEND_URL}/api/campaigns`
- Backend assumed to handle blockchain interaction
- Forwards response directly to client

**Mode 2: Direct Blockchain Access (Default)**
- Connects to RPC endpoint: `NEXT_PUBLIC_RPC_URL` (defaults to `http://127.0.0.1:8545`)
- Uses smart contract at: `NEXT_PUBLIC_CONTRACT_ADDRESS`
- Iterates through campaigns (0-50) and calls contract methods
- Aggregates contributor data and calculates percentages

**Smart Contract Methods Called:**
1. `getCampaign(id)` → Campaign struct
2. `getContributors(id)` → Array of contributor addresses
3. `contributions(id, address)` → Individual contribution amount

**Smart Contract ABI Methods:**
```javascript
// Read-only methods (view/pure)
getCampaign(uint256 campaignId) → Campaign struct
getContributors(uint256 campaignId) → address[]
contributions(uint256 campaignId, address holder) → uint256

// State-changing methods
createCampaign(string title, string description, uint256 goal, uint256 durationSeconds) → uint256
contribute(uint256 campaignId) → (payable)
```

---

## Application Wrapper

### App Component (`pages/_app.js`)

**Purpose:** Next.js app wrapper that provides consistent layout for all pages.

**Functionality:**
- Simple pass-through wrapper
- Applies global styles to all pages
- Provides context for page components

```javascript
export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />
}
```

---

## Styling System

### Global Styles (`styles/globals.css`)

**Design Approach:** Minimal, clean UI with CSS variables for theming.

**Color Scheme:**
- Background: `#f7fafc` (light slate)
- Card/Surface: `#ffffff` (white)
- Accent: `#4f46e5` (indigo)
- Text: `#0f172a` (dark slate)

**Key CSS Classes:**

| Class | Purpose |
|-------|---------|
| `.container` | Max-width wrapper (900px), centered with margins |
| `.header` | Flex layout for title and navigation buttons |
| `.card` | Content containers with shadow and padding |
| `.button` | Primary action button (accent background) |
| `.link` | Text link styling |
| `.small` | Reduced font size (0.9rem) for secondary text |
| `.list` | Vertical flex list with spacing |
| `.footer` | Small text for additional info |
| `.form-group` | Wrapper for form inputs with spacing |
| `.input` | Text input, textarea styling with focus states |

---

## Environment Variables

**Required Configuration (`.env.local`):**

| Variable | Type | Required | Default | Purpose |
|----------|------|----------|---------|---------|
| `NEXT_PUBLIC_RPC_URL` | URL | No | `http://127.0.0.1:8545` | Blockchain RPC endpoint |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | Address | **Yes** | N/A | Smart contract address (0x...) |
| `NEXT_PUBLIC_BACKEND_URL` | URL | No | N/A | Optional backend server (e.g., http://localhost:4000) |

**Note:** Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

---

## User Workflows

### Workflow 1: Browse Campaigns
```
Home Page (Index) 
  ↓ useEffect triggers
  ↓ Fetch campaigns (backend or contract)
  ↓ Display campaign list
  ↓ User clicks "View" 
  ↓ Navigate to Campaign Detail Page
```

### Workflow 2: View Campaign & Contribute
```
Campaign Detail Page
  ↓ Load campaign data from contract
  ↓ Load investor list
  ↓ Display campaign info and investors
  ↓ User clicks "Contribute 0.01 ETH"
  ↓ MetaMask wallet connection
  ↓ Transaction confirmation in MetaMask
  ↓ Contract executes contribute() payable function
  ↓ Page reloads
  ↓ New contribution visible in investor list
```

### Workflow 3: Create New Campaign
```
Home Page (Index)
  ↓ User clicks "Create Campaign"
  ↓ Navigate to Create Campaign Page
  ↓ Fill form: title, description, goal amount (in ETH)
  ↓ Submit form
  ↓ Convert ETH to Wei
  ↓ Send POST request to API
  ↓ API submits to contract or backend
  ↓ On success: Redirect to home page
  ↓ New campaign appears in list
```

---

## Key Technical Patterns

### 1. **BigInt Handling for Wei**
- JavaScript uses BigInt for precise large number handling
- Wei conversions: `1 ETH = 10^18 Wei`
- Example: `0.01 ETH = 10000000000000000 Wei`
- Used in calculations to avoid floating-point precision issues

### 2. **Dual Data Source Pattern**
- Check for backend URL → use backend if available
- Fallback to direct contract calls via RPC
- Enables flexible deployment options

### 3. **MetaMask Integration**
- Uses browser `window.ethereum` object
- `ethers.BrowserProvider` wraps MetaMask
- Requests account access: `eth_requestAccounts`
- Signs transactions with user's signer

### 4. **React Hooks Usage**
- `useState`: Manage component state (campaigns, loading, form data)
- `useEffect`: Fetch data on component mount
- `useRouter`: Navigation between pages

### 5. **Error Handling**
- Try-catch blocks for async operations
- Console logging for debugging
- User-friendly alert messages
- Graceful fallbacks for missing data

---

## Dependencies & Versions

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 14.2.0 | React framework |
| `react` | 18.2.0 | UI library |
| `react-dom` | 18.2.0 | React DOM rendering |
| `ethers` | 6.13.4 | Blockchain interaction |
| `axios` | 1.5.0 | HTTP requests |

---

## Common Issues & Solutions

### Issue: "Set NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local"
**Cause:** Contract address not configured
**Solution:** Create `.env.local` file with valid contract address

### Issue: "Campaign not found"
**Cause:** Invalid campaign ID or contract not deployed
**Solution:** Ensure contract is deployed and has campaigns

### Issue: "Please install MetaMask"
**Cause:** MetaMask browser extension not installed
**Solution:** Install MetaMask from https://metamask.io

### Issue: "Network not supported"
**Cause:** MetaMask connected to wrong network (not Sepolia)
**Solution:** Switch MetaMask to Sepolia Testnet

---

## Running the Application

### Development Mode
```bash
npm install
npm run dev
# Opens on http://localhost:3000
```

### Production Build
```bash
npm run build
npm start
# Runs optimized production build
```

---

## Summary

This crowdfunding frontend provides a complete user interface for blockchain-based campaign management. It abstracts complex blockchain interactions behind simple React components while maintaining flexibility through dual data source support. The application demonstrates modern Next.js patterns with ethers.js integration for decentralized application (dApp) development.


export type Currency = 'USDC' | 'NGN' | 'XOF' | 'GHS' | 'KES';

export interface Supplier {
  id: string;
  name: string;
  location: string;
  country: string;
  avatar: string;
  category: string;
  localCurrency: Currency;
  escrowAddress: string;
  rating: number;
  completedTrades: number;
  catalog: {
    id: string;
    name: string;
    priceLocal: number;
    priceUSDC: number;
    image: string;
  }[];
}

export interface Trade {
  id: string;
  traderName: string;
  supplierId: string;
  supplierName: string;
  amountUSDC: number;
  amountLocal: number;
  localCurrency: Currency;
  status: 'LOCKED' | 'RELEASED' | 'DISPUTED' | 'REFUNDED';
  createdAt: string;
  releasedAt?: string;
  escrowTxHash: string;
  releaseTxHash?: string;
  disputeWindowDays: number;
  verificationMethod: 'QR_SCAN' | 'TRANSPORT_UNION' | 'TIMEOUT';
}

export interface GuildPool {
  id: string;
  name: string;
  origin: string;
  destination: string;
  targetUSDC: number;
  currentUSDC: number;
  membersCount: number;
  maxMembers: number;
  status: 'OPEN' | 'FILLED' | 'LOCKED' | 'SHIPPED' | 'COMPLETED';
  timeLeft: string;
  description: string;
  contributions: {
    traderName: string;
    amountUSDC: number;
    timestamp: string;
  }[];
}

export interface CreditLine {
  id: string;
  corridor: string; // e.g. "Lagos – Cotonou"
  totalFundedUSDC: number;
  utilizationRate: number;
  repaymentRate: number;
  riskTierRates: {
    Rising: number;
    Navigator: number;
    Polaris: number;
  };
  repaymentCurve: number[]; // points for chart
}

export interface ZKProof {
  id: string;
  timestamp: string;
  provenTier: 'Rising' | 'Navigator' | 'Polaris';
  totalVolumeUSDC: number;
  disputeRate: number;
  tradesCompleted: number;
  cryptographicHash: string;
  verifiedOnChain: boolean;
}

export interface LedgerEvent {
  id: string;
  timestamp: string;
  type: 'CONTRACT_CALL' | 'SEP24_FUNDING' | 'PATH_PAYMENT' | 'ZK_VERIFY' | 'ESCROW_RELEASE';
  contract: string;
  method: string;
  details: string;
  txHash: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
}

export interface AppState {
  walletBalanceUSDC: number;
  walletBalanceNGN: number;
  reputationPoints: number;
  completedCount: number;
  disputeCount: number;
  activeTier: 'Rising' | 'Navigator' | 'Polaris';
  trades: Trade[];
  guildPools: GuildPool[];
  creditLines: CreditLine[];
  zkProofs: ZKProof[];
  ledgerEvents: LedgerEvent[];
  activeCreditDraws: {
    amountUSDC: number;
    dueDate: string;
    repaid: boolean;
  }[];
}

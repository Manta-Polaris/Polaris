import { useState, useEffect } from 'react';
import { AppState, Trade, ZKProof, GuildPool, CreditLine, Supplier, LedgerEvent } from './types';
import { INITIAL_SUPPLIERS } from './data/suppliers';
import { MobileTraderApp } from './components/MobileTraderApp';
import { SupplierPortal } from './components/SupplierPortal';
import { CreditMarketplace } from './components/CreditMarketplace';
import { NetworkLedger } from './components/NetworkLedger';
import {
  Compass,
  ArrowRight,
  Sparkles,
  Info,
  Layers,
  Award,
  Wallet,
  PlayCircle,
  HelpCircle,
  CheckCircle,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

export default function App() {
  // Global State for the entire Polaris Ecosystem
  const [appState, setAppState] = useState<AppState>({
    walletBalanceUSDC: 2450.0,
    walletBalanceNGN: 480000,
    reputationPoints: 4,
    completedCount: 4,
    disputeCount: 0,
    activeTier: 'Rising',
    trades: [
      {
        id: 'hist_trade_1',
        traderName: 'Aisha Bello (You)',
        supplierId: 'sup_1',
        supplierName: 'Amina Fabrics Cotonou',
        amountUSDC: 240,
        amountLocal: 144000,
        localCurrency: 'XOF',
        status: 'RELEASED',
        createdAt: '2 days ago',
        releasedAt: '2 days ago',
        escrowTxHash: 'SHA256_HIST_01_ESCROW_TX',
        releaseTxHash: 'SHA256_HIST_01_RELEASE_TX',
        disputeWindowDays: 3,
        verificationMethod: 'QR_SCAN'
      },
      {
        id: 'hist_trade_2',
        traderName: 'Aisha Bello (You)',
        supplierId: 'sup_2',
        supplierName: 'Kofi Shoe Wholesalers Accra',
        amountUSDC: 180,
        amountLocal: 2270,
        localCurrency: 'GHS',
        status: 'RELEASED',
        createdAt: 'Last week',
        releasedAt: 'Last week',
        escrowTxHash: 'SHA256_HIST_02_ESCROW_TX',
        releaseTxHash: 'SHA256_HIST_02_RELEASE_TX',
        disputeWindowDays: 3,
        verificationMethod: 'TRANSPORT_UNION'
      }
    ],
    guildPools: [
      {
        id: 'guild_1',
        name: 'Cotonou Ankara Wax Guild #14',
        origin: 'Lagos, Nigeria',
        destination: 'Cotonou, Benin',
        targetUSDC: 15000,
        currentUSDC: 11200,
        membersCount: 11,
        maxMembers: 15,
        status: 'OPEN',
        timeLeft: '3 days left',
        description: 'Cooperative buying of bulk premium wax directly from Dutch mills. Split shipping and customs pro-rata.',
        contributions: [
          { traderName: 'Chiamaka N. (Aba)', amountUSDC: 1500, timestamp: '10:14 AM' },
          { traderName: 'Joy O. (Onitsha)', amountUSDC: 1200, timestamp: '09:45 AM' },
          { traderName: 'Mariam D. (Kano)', amountUSDC: 2000, timestamp: 'Yesterday' }
        ]
      },
      {
        id: 'guild_2',
        name: 'Nairobi Beauty Wholesale Guild #9',
        origin: 'Kampala, Uganda',
        destination: 'Nairobi, Kenya',
        targetUSDC: 8000,
        currentUSDC: 7600,
        membersCount: 14,
        maxMembers: 15,
        status: 'OPEN',
        timeLeft: '1 day left',
        description: 'Bulk purchase of luxury wig caps and organic shea moisturizers. Discounted wholesale unit rates.',
        contributions: [
          { traderName: 'Grace K. (Kampala)', amountUSDC: 800, timestamp: '11:22 AM' },
          { traderName: 'Sarah M. (Nairobi)', amountUSDC: 1200, timestamp: '10:05 AM' }
        ]
      }
    ],
    creditLines: [
      {
        id: 'line_1',
        corridor: 'Lagos ↔ Cotonou Corridor',
        totalFundedUSDC: 85000,
        utilizationRate: 72,
        repaymentRate: 99.4,
        riskTierRates: { Rising: 15.2, Navigator: 12.5, Polaris: 8.0 },
        repaymentCurve: [85, 92, 95, 97, 99, 99.2, 99.4, 99.4, 99.4, 99.4]
      },
      {
        id: 'line_2',
        corridor: 'Nairobi ↔ Kampala Corridor',
        totalFundedUSDC: 60000,
        utilizationRate: 58,
        repaymentRate: 98.9,
        riskTierRates: { Rising: 16.0, Navigator: 13.0, Polaris: 9.5 },
        repaymentCurve: [70, 80, 85, 90, 93, 95, 97, 98.2, 98.8, 98.9]
      }
    ],
    zkProofs: [],
    ledgerEvents: [
      {
        id: 'genesis_evt_1',
        timestamp: '10:00:00 AM',
        type: 'CONTRACT_CALL',
        contract: 'TradeRep',
        method: 'genesis_block',
        details: 'Polaris trade credit reputation registry initialized. BLS12-381 curves active.',
        txHash: 'SHA256_GEN_001_A1B2C3D4E5',
        status: 'SUCCESS'
      },
      {
        id: 'genesis_evt_2',
        timestamp: '10:05:00 AM',
        type: 'CONTRACT_CALL',
        contract: 'TradeEscrow',
        method: 'deploy_anchors',
        details: 'Multi-corridor anchor registries synchronized: NGN, XOF, GHS, KES liquidity pools ready.',
        txHash: 'SHA256_GEN_002_F6G7H8I9J0',
        status: 'SUCCESS'
      }
    ],
    activeCreditDraws: []
  });

  const [activeWebTab, setActiveWebTab] = useState<'supplier' | 'defi' | 'ledger'>('supplier');
  const [showGuide, setShowGuide] = useState<boolean>(true);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Recalculate Tiers dynamically based on completed count
  useEffect(() => {
    let tier: 'Rising' | 'Navigator' | 'Polaris' = 'Rising';
    if (appState.completedCount >= 16) {
      tier = 'Polaris';
    } else if (appState.completedCount >= 6) {
      tier = 'Navigator';
    }

    if (tier !== appState.activeTier) {
      setAppState((prev) => ({
        ...prev,
        activeTier: tier
      }));
      triggerToast(`🎉 Dynamic Reputation Upgrade! You are now a ${tier} class trader!`);
    }
  }, [appState.completedCount]);

  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 5000);
  };

  // Escape key: close guide board and dismiss active toast
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowGuide(false);
        setSuccessToast(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Helper: Append event to the Soroban Ledger
  const handleAddLedgerEvent = (
    type: 'CONTRACT_CALL' | 'SEP24_FUNDING' | 'PATH_PAYMENT' | 'ZK_VERIFY' | 'ESCROW_RELEASE',
    contract: string,
    method: string,
    details: string
  ) => {
    const newEvent: LedgerEvent = {
      id: 'evt_' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      type,
      contract,
      method,
      details,
      txHash: 'SHA256_' + Math.random().toString(36).substring(2, 16).toUpperCase(),
      status: 'SUCCESS'
    };

    setAppState((prev) => ({
      ...prev,
      ledgerEvents: [...prev.ledgerEvents, newEvent]
    }));
  };

  // Handler: Add a trade
  const handleAddTrade = (newTrade: Trade) => {
    setAppState((prev) => ({
      ...prev,
      trades: [newTrade, ...prev.trades]
    }));
    triggerToast(`💰 New trade locked: $${newTrade.amountUSDC} USDC is now held in escrow for ${newTrade.supplierName}.`);
  };

  // Handler: Release Escrow (Trader scans at shop or delivery confirms)
  const handleReleaseTrade = (tradeId: string) => {
    setAppState((prev) => {
      const updatedTrades = prev.trades.map((t) => {
        if (t.id === tradeId) {
          return {
            ...t,
            status: 'RELEASED' as const,
            releasedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
        }
        return t;
      });

      const releasedTrade = prev.trades.find((t) => t.id === tradeId);
      const incrementPoints = releasedTrade ? releasedTrade.amountUSDC >= 100 ? 1 : 1 : 0;

      return {
        ...prev,
        trades: updatedTrades,
        completedCount: prev.completedCount + 1,
        reputationPoints: prev.reputationPoints + incrementPoints
      };
    });

    triggerToast('✅ Escrow Released! Supplier notified to request fiat cash out.');
  };

  // Handler: Supplier instant fiat cash-out via anchor path payment
  const handleTriggerSettlement = (tradeId: string) => {
    const trade = appState.trades.find((t) => t.id === tradeId);
    if (!trade) return;

    // First mark as fully processed
    handleAddLedgerEvent(
      'PATH_PAYMENT',
      'StellarDEX',
      'anchor_path_pay_fiat',
      `Stellar Anchor executing path payment conversion. Converting $${trade.amountUSDC} USDC to ${trade.localCurrency} ${trade.amountLocal} and depositing directly to supplier's local bank/mobile account.`
    );

    setAppState((prev) => {
      const updated = prev.trades.map((t) => {
        if (t.id === tradeId) {
          return { ...t, status: 'RELEASED' as const }; // ensures state is updated
        }
        return t;
      });
      return { ...prev, trades: updated };
    });

    triggerToast(`🏦 Anchor path-payment successful! ${trade.localCurrency} ${trade.amountLocal.toLocaleString()} credited to supplier account.`);
  };

  // Handler: Add ZK Proof to ledger
  const handleAddZKProof = (proof: ZKProof) => {
    setAppState((prev) => ({
      ...prev,
      zkProofs: [proof, ...prev.zkProofs]
    }));
    triggerToast('🛡️ Cryptographic ZK proof submitted and verified on-chain by financiers.');
  };

  // Handler: Update Wallet Balance
  const handleUpdateWalletBalance = (newUSDC: number, newNGN: number) => {
    setAppState((prev) => ({
      ...prev,
      walletBalanceUSDC: newUSDC,
      walletBalanceNGN: newNGN
    }));
  };

  // Handler: Join Wholesale Guild Pool
  const handleJoinGuildPool = (poolId: string, traderName: string, amount: number) => {
    setAppState((prev) => {
      const updatedPools = prev.guildPools.map((p) => {
        if (p.id === poolId) {
          const newCurrent = p.currentUSDC + amount;
          const status = newCurrent >= p.targetUSDC ? ('FILLED' as const) : p.status;

          // If filled, simulate cooperative block order lock on Soroban
          if (newCurrent >= p.targetUSDC) {
            setTimeout(() => {
              handleAddLedgerEvent(
                'CONTRACT_CALL',
                'GuildPool',
                'lock_pool_and_purchase',
                `Bulk order triggered! Combined wholesale pool ${p.name} ($15,000) locked on-chain. Splitting goods-payment obligations pro-rata.`
              );
            }, 1000);
          }

          return {
            ...p,
            currentUSDC: newCurrent,
            membersCount: p.membersCount + 1,
            status,
            contributions: [
              { traderName, amountUSDC: amount, timestamp: 'Just now' },
              ...p.contributions
            ]
          };
        }
        return p;
      });
      return { ...prev, guildPools: updatedPools };
    });

    triggerToast(`👥 Contributed $${amount} USDC to the Guild group-buying pool! Sharing costs with sister-traders.`);
  };

  // Handler: Draw Credit Line
  const handleDrawCredit = (amount: number) => {
    setAppState((prev) => {
      const formattedDate = new Date();
      formattedDate.setDate(formattedDate.getDate() + 30);
      const dueDateStr = formattedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

      // Increase credit line utilization rate
      const updatedLines = prev.creditLines.map((line) => {
        if (line.id === 'line_1') {
          return {
            ...line,
            utilizationRate: Math.min(100, line.utilizationRate + 4)
          };
        }
        return line;
      });

      return {
        ...prev,
        walletBalanceUSDC: prev.walletBalanceUSDC + amount,
        creditLines: updatedLines,
        activeCreditDraws: [
          ...prev.activeCreditDraws,
          {
            amountUSDC: amount,
            dueDate: dueDateStr,
            repaid: false
          }
        ]
      };
    });

    triggerToast(`💳 Reputation Credit Draw complete! $${amount} USDC credited to your travel wallet.`);
  };

  // Handler: Repay Credit
  const handleRepayCredit = (index: number) => {
    setAppState((prev) => {
      const targetDraw = prev.activeCreditDraws[index];
      const updatedDraws = prev.activeCreditDraws.filter((_, i) => i !== index);

      // Decrease credit line utilization
      const updatedLines = prev.creditLines.map((line) => {
        if (line.id === 'line_1') {
          return {
            ...line,
            utilizationRate: Math.max(0, line.utilizationRate - 4),
            repaymentRate: Math.min(100, line.repaymentRate + 0.1)
          };
        }
        return line;
      });

      return {
        ...prev,
        creditLines: updatedLines,
        activeCreditDraws: updatedDraws,
        completedCount: prev.completedCount + 1 // Repayment increases completed trade count as a bonus!
      };
    });

    triggerToast('🎉 Loan fully settled on-chain. Financiers have accrued interest, and your credit rating has expanded!');
  };

  // Preset Story Automation / Guided Walkthrough Trigger
  const runPresetScenario = (step: number) => {
    if (step === 1) {
      // Step 1: Fund new trade
      const amt = 250;
      handleAddLedgerEvent(
        'SEP24_FUNDING',
        'StellarAnchor',
        'deposit_request',
        'Guided Tour: Auto-depositing MTN money. Swapping NGN to $250 USDC. Creating trade lock.'
      );

      const newTrade: Trade = {
        id: 'guide_trade_99',
        traderName: 'Aisha Bello (You)',
        supplierId: 'sup_1',
        supplierName: 'Amina Fabrics Cotonou',
        amountUSDC: amt,
        amountLocal: 150000,
        localCurrency: 'XOF',
        status: 'LOCKED',
        createdAt: 'Just now',
        escrowTxHash: 'SHA256_GUIDE_LOCKED_250_XOF',
        disputeWindowDays: 3,
        verificationMethod: 'QR_SCAN'
      };

      handleAddTrade(newTrade);
      setAppState(prev => ({
        ...prev,
        walletBalanceUSDC: prev.walletBalanceUSDC - amt
      }));
      handleAddLedgerEvent(
        'CONTRACT_CALL',
        'TradeEscrow',
        'lock_funds',
        'Soroban contract locked $250 USDC. Destination: Amina Fabrics Dantokpa escrow.'
      );
      triggerToast('Step 1 Complete: $250 USDC has been safely locked in Amina Fabrics’ Escrow! Check the Supplier Portal.');
    } else if (step === 2) {
      // Step 2: Release trade
      const targetTrade = appState.trades.find(t => t.status === 'LOCKED');
      if (!targetTrade) {
        alert('Please run Step 1 first, or lock a trade in the Mobile phone simulator "New Trade" tab!');
        return;
      }
      handleReleaseTrade(targetTrade.id);
      triggerToast(`Step 2 Complete: Aisha inspected goods and triggered biometric QR scan! Escrow Released on-chain.`);
    } else if (step === 3) {
      // Step 3: Settle trade local
      const releasedTrade = appState.trades.find(t => t.status === 'RELEASED' && t.id.startsWith('trade_') || t.id === 'guide_trade_99');
      if (!releasedTrade) {
        alert('No released trade pending settlement found. Complete a trade in the Mobile simulator or run Step 2 first!');
        return;
      }
      handleTriggerSettlement(releasedTrade.id);
    } else if (step === 4) {
      // Step 4: Mint ZK Proof
      const zkHash = 'BLS12_381_SIG_GUIDE_' + Math.random().toString(36).substring(2, 12).toUpperCase();
      const newProof: ZKProof = {
        id: 'zk_guide_01',
        timestamp: new Date().toLocaleTimeString(),
        provenTier: appState.activeTier,
        totalVolumeUSDC: appState.completedCount * 180 + 350,
        disputeRate: 0,
        tradesCompleted: appState.completedCount,
        cryptographicHash: zkHash,
        verifiedOnChain: true
      };
      handleAddZKProof(newProof);
      handleAddLedgerEvent(
        'ZK_VERIFY',
        'TradeRep',
        'verify_proof',
        `Guided Tour: Verified BLS12-381 proof. Proved ${appState.activeTier} Tier and 0 disputes. Individual trade identities completely hidden.`
      );
      setActiveWebTab('defi');
      triggerToast('Step 4 Complete: Cryptographic ZK proof generated and verified in the financiers’ Risk Marketplace!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Toast Alert */}
      {successToast && (
        <div className="fixed top-6 right-6 bg-slate-900 border-2 border-amber-500 rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-50 max-w-sm animate-bounce flex items-start space-x-3">
          <Sparkles className="text-amber-500 shrink-0 mt-0.5" size={18} />
          <div>
            <p className="text-xs font-bold text-slate-100 leading-snug">{successToast}</p>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <header className="border-b border-slate-900 bg-slate-950 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-30">
        <div className="flex items-center space-x-3.5">
          {/* Logo */}
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-amber-950/40">
              ✦
            </div>
            {/* North Star indicator line */}
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full border border-slate-950 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-black tracking-wider text-slate-100 uppercase">POLARIS NETWORK</h1>
              <span className="text-[10px] bg-cyan-950/80 text-cyan-400 border border-cyan-900 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono">
                Stellar Soroban Live
              </span>
            </div>
            <p className="text-xs text-slate-400">The decentralized trust & trade rail for Africa's cash-in-a-bag economy</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold px-4 py-2 rounded-xl text-xs border border-slate-800 flex items-center space-x-1.5 transition-all"
          >
            <HelpCircle size={14} />
            <span>{showGuide ? 'Hide Guide' : 'Ecosystem Walkthrough'}</span>
          </button>
          <div className="h-6 w-[1px] bg-slate-900 hidden md:block" />
          <div className="text-right hidden md:block">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold">Ledger State</span>
            <span className="text-xs text-emerald-500 font-bold font-mono flex items-center justify-end">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1.5" /> Core v21.4.0
            </span>
          </div>
        </div>
      </header>

      {/* Main Layout Area */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Interactive Guide Board */}
        {showGuide && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-violet-500/5 blur-3xl rounded-full pointer-events-none" />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-3xl">
                <div className="flex items-center space-x-2">
                  <span className="bg-amber-950 text-amber-500 text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full font-black border border-amber-900">
                    Ecosystem Walkthrough
                  </span>
                  <span className="text-slate-500 text-xs font-medium">Step-by-step Interactive Story</span>
                </div>
                <h3 className="text-base font-bold text-slate-200">How to experience Polaris Trade Escrow & ZK Reputation:</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Millions of traders cross borders carrying thousands in physical cash, losing capital to thieves and bribery. 
                  Polaris replaces cash bags with **Soroban on-chain escrows**, and uses **ZK cryptographic proofs** to score credit lines without leaking individual business details.
                </p>
              </div>

              {/* Automation Quick Actions */}
              <div className="flex flex-wrap gap-2 shrink-0 bg-slate-950 p-3 rounded-2xl border border-slate-800/60 max-w-md">
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider block w-full mb-1">
                  Guided Story Triggers:
                </span>
                <button
                  onClick={() => runPresetScenario(1)}
                  className="bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold px-3 py-2 rounded-xl text-[10px] flex items-center space-x-1 border border-slate-800 transition-all"
                  title="Locks funds for textiles"
                >
                  <PlayCircle size={12} className="text-amber-500" />
                  <span>1. Lock $250 Escrow</span>
                </button>
                <button
                  onClick={() => runPresetScenario(2)}
                  className="bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold px-3 py-2 rounded-xl text-[10px] flex items-center space-x-1 border border-slate-800 transition-all"
                  title="Simulates QR scanning at Beninese shop"
                >
                  <PlayCircle size={12} className="text-cyan-400" />
                  <span>2. Aisha scans QR</span>
                </button>
                <button
                  onClick={() => runPresetScenario(3)}
                  className="bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold px-3 py-2 rounded-xl text-[10px] flex items-center space-x-1 border border-slate-800 transition-all"
                  title="Converts onchain USDC into West African XOF"
                >
                  <PlayCircle size={12} className="text-emerald-500" />
                  <span>3. Settle Local Currency</span>
                </button>
                <button
                  onClick={() => runPresetScenario(4)}
                  className="bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold px-3 py-2 rounded-xl text-[10px] flex items-center space-x-1 border border-slate-800 transition-all"
                  title="Mint reputation ZK proof on-chain"
                >
                  <PlayCircle size={12} className="text-violet-400" />
                  <span>4. Mint ZK Reputation Proof</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Sandbox Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: Phone Simulator (Trader Mobile App) */}
          <div className="lg:col-span-4 flex flex-col items-center">
            <div className="text-center mb-2">
              <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">Trader Terminal</span>
              <p className="text-[11px] text-slate-400">Mobile simulation (Aisha Bello)</p>
            </div>
            <MobileTraderApp
              appState={appState}
              suppliers={INITIAL_SUPPLIERS}
              onAddTrade={handleAddTrade}
              onReleaseTrade={handleReleaseTrade}
              onAddZKProof={handleAddZKProof}
              onUpdateWalletBalance={handleUpdateWalletBalance}
              onJoinGuildPool={handleJoinGuildPool}
              onDrawCredit={handleDrawCredit}
              onRepayCredit={handleRepayCredit}
              onAddLedgerEvent={handleAddLedgerEvent}
            />
          </div>

          {/* RIGHT: Web Portal Hub & Ledger */}
          <div className="lg:col-span-8 space-y-6 flex flex-col h-full">
            {/* Nav Switcher for the Web side */}
            <div className="bg-slate-900 p-1.5 rounded-2xl border border-slate-800 flex justify-between gap-1 w-full max-w-md">
              <button
                onClick={() => setActiveWebTab('supplier')}
                className={`flex-1 py-2.5 px-3 font-bold text-xs rounded-xl transition-all uppercase tracking-wider flex items-center justify-center space-x-1.5 ${
                  activeWebTab === 'supplier'
                    ? 'bg-slate-950 text-slate-100 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Compass size={14} className="text-amber-500" />
                <span>Supplier Portal</span>
              </button>

              <button
                onClick={() => setActiveWebTab('defi')}
                className={`flex-1 py-2.5 px-3 font-bold text-xs rounded-xl transition-all uppercase tracking-wider flex items-center justify-center space-x-1.5 ${
                  activeWebTab === 'defi'
                    ? 'bg-slate-950 text-slate-100 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers size={14} className="text-violet-500" />
                <span>Credit Marketplace</span>
              </button>

              <button
                onClick={() => setActiveWebTab('ledger')}
                className={`flex-1 py-2.5 px-3 font-bold text-xs rounded-xl transition-all uppercase tracking-wider flex items-center justify-center space-x-1.5 ${
                  activeWebTab === 'ledger'
                    ? 'bg-slate-950 text-slate-100 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <RefreshCw size={14} className="text-cyan-400 animate-spin-slow" />
                <span>Soroban Ledger</span>
              </button>
            </div>

            {/* Switchable Web Panels */}
            <div className="flex-1">
              {activeWebTab === 'supplier' && (
                <div className="animate-fade-in">
                  <SupplierPortal
                    suppliers={INITIAL_SUPPLIERS}
                    trades={appState.trades}
                    onTriggerSettlement={handleTriggerSettlement}
                    onAddLedgerEvent={handleAddLedgerEvent}
                  />
                </div>
              )}

              {activeWebTab === 'defi' && (
                <div className="animate-fade-in">
                  <CreditMarketplace
                    creditLines={appState.creditLines}
                    zkProofs={appState.zkProofs}
                    onFundPool={(lineId, amt) => {
                      setAppState((prev) => {
                        const updated = prev.creditLines.map((line) => {
                          if (line.id === lineId) {
                            return { ...line, totalFundedUSDC: line.totalFundedUSDC + amt };
                          }
                          return line;
                        });
                        return { ...prev, creditLines: updated };
                      });
                    }}
                    onAddLedgerEvent={handleAddLedgerEvent}
                  />
                </div>
              )}

              {activeWebTab === 'ledger' && (
                <div className="animate-fade-in">
                  <NetworkLedger
                    events={appState.ledgerEvents}
                    onClear={() => {
                      setAppState((prev) => ({ ...prev, ledgerEvents: [] }));
                    }}
                  />
                </div>
              )}
            </div>

            {/* Split view: Underneath the panels, we can show a quick mini-ledger event ticker if we aren't already on the ledger tab, keeping the technical ledger visible! */}
            {activeWebTab !== 'ledger' && (
              <div className="bg-slate-950 border border-slate-900 rounded-2xl p-4 font-mono text-[10px] space-y-2">
                <div className="flex justify-between items-center border-b border-slate-900 pb-2 text-slate-500">
                  <span className="font-bold flex items-center"><RefreshCw size={11} className="mr-1 text-cyan-400 animate-spin-slow" /> SOROBAN EVENT STREAM (LIVE RECEPTOR)</span>
                  <span className="text-[9px]">Ledger synced</span>
                </div>
                {appState.ledgerEvents.length === 0 ? (
                  <div className="text-slate-600 text-center py-2">No active contract calls.</div>
                ) : (
                  <div className="space-y-1 max-h-[70px] overflow-y-auto">
                    {appState.ledgerEvents.slice(-2).map((evt) => (
                      <div key={evt.id} className="flex justify-between items-start text-slate-400 py-0.5 hover:text-slate-200">
                        <span className="text-slate-500 shrink-0">[{evt.timestamp}]</span>
                        <span className="text-cyan-400 shrink-0 font-bold ml-1.5">{evt.contract}::{evt.method}()</span>
                        <span className="text-slate-300 flex-1 ml-2 truncate">{evt.details}</span>
                        <span className="text-emerald-500 text-[9px] shrink-0 font-bold ml-1">✓ SUCCESS</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 px-8 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-black tracking-wide text-slate-400 uppercase">✦ POLARIS RAIL</span>
            <span>|</span>
            <span>Stellar Soroban Mainnet Corridor Prototype</span>
          </div>
          <div className="flex space-x-4">
            <span className="hover:text-slate-300 cursor-pointer">AfCFTA Compliance Policy</span>
            <span>•</span>
            <span className="hover:text-slate-300 cursor-pointer">Security Audits (ZK Rep)</span>
            <span>•</span>
            <span className="hover:text-slate-300 cursor-pointer">Anchor API Specs</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

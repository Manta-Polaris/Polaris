import React, { useState, useEffect } from 'react';
import { Supplier, Trade, GuildPool, ZKProof, AppState, Currency } from '../types';
import {
  Smartphone,
  Wifi,
  WifiOff,
  Battery,
  Home,
  PlusCircle,
  QrCode,
  Award,
  Wallet,
  ArrowRightLeft,
  Users,
  ChevronRight,
  Shield,
  Clock,
  Scan,
  Fingerprint,
  RotateCcw,
  Check,
  AlertTriangle,
  Flame,
  Globe
} from 'lucide-react';

interface MobileTraderAppProps {
  appState: AppState;
  suppliers: Supplier[];
  onAddTrade: (trade: Trade) => void;
  onReleaseTrade: (tradeId: string) => void;
  onAddZKProof: (proof: ZKProof) => void;
  onUpdateWalletBalance: (newBalanceUSDC: number, newBalanceNGN: number) => void;
  onJoinGuildPool: (poolId: string, traderName: string, amount: number) => void;
  onDrawCredit: (amount: number) => void;
  onRepayCredit: (index: number) => void;
  onAddLedgerEvent: (
    type: 'CONTRACT_CALL' | 'SEP24_FUNDING' | 'PATH_PAYMENT' | 'ZK_VERIFY' | 'ESCROW_RELEASE',
    contract: string,
    method: string,
    details: string
  ) => void;
}

export const MobileTraderApp: React.FC<MobileTraderAppProps> = ({
  appState,
  suppliers,
  onAddTrade,
  onReleaseTrade,
  onAddZKProof,
  onUpdateWalletBalance,
  onJoinGuildPool,
  onDrawCredit,
  onRepayCredit,
  onAddLedgerEvent
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'new_trade' | 'release' | 'my_star' | 'credit' | 'guild'>('home');
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [queuedSigCount, setQueuedSigCount] = useState<number>(0);
  const [simulatedTime, setSimulatedTime] = useState<string>('09:41');

  // New Trade Form states
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('sup_1');
  const [tradeAmountUSDC, setTradeAmountUSDC] = useState<string>('150');
  const [fundingStep, setFundingStep] = useState<'input' | 'sep24' | 'swap' | 'lock' | 'success'>('input');
  const [selectedPayMethod, setSelectedPayMethod] = useState<'MTN' | 'ORANGE' | 'BANK'>('MTN');
  const [mobileNumber, setMobileNumber] = useState<string>('229 97 12 34 56');

  // Escrow Release states
  const [releasingTrade, setReleasingTrade] = useState<Trade | null>(null);
  const [releaseStep, setReleaseStep] = useState<'select' | 'scan' | 'biometric' | 'broadcast' | 'success'>('select');
  const [scanning, setScanning] = useState<boolean>(false);

  // ZK Proof State
  const [provingStatus, setProvingStatus] = useState<'idle' | 'proving' | 'key_gen' | 'success'>('idle');
  const [generatedProof, setGeneratedProof] = useState<ZKProof | null>(null);

  // Guild Form States
  const [contributeAmount, setContributeAmount] = useState<string>('50');

  // Credit Draw State
  const [drawAmount, setDrawAmount] = useState<string>('200');

  useEffect(() => {
    // Dynamic system clock simulation
    const updateClock = () => {
      const now = new Date();
      const hrs = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      setSimulatedTime(`${hrs}:${mins}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 30000);
    return () => clearInterval(interval);
  }, []);

  // Compute calculated values
  const activeSupplier = suppliers.find((s) => s.id === selectedSupplierId) || suppliers[0];
  const convertedAmountLocal = Math.round(parseFloat(tradeAmountUSDC || '0') * (activeSupplier.catalog[0].priceLocal / activeSupplier.catalog[0].priceUSDC));

  // Handle New Trade Submission (SEP-24 & Onchain locks)
  const handleInitiateNewTrade = () => {
    const amt = parseFloat(tradeAmountUSDC);
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid trade amount.');
      return;
    }
    if (appState.walletBalanceUSDC < amt && activeTab === 'new_trade' && fundingStep === 'input') {
      // Prompt for mobile money deposit first
      setFundingStep('sep24');
    } else {
      setFundingStep('sep24');
    }
  };

  const handleExecuteSEP24Deposit = () => {
    const amt = parseFloat(tradeAmountUSDC);
    onAddLedgerEvent(
      'SEP24_FUNDING',
      'StellarAnchor',
      'deposit_request',
      `SEP-24 Deposit initiated via ${selectedPayMethod} (${mobileNumber}). Amount: $${amt} USDC equivalent.`
    );
    setFundingStep('swap');

    setTimeout(() => {
      onAddLedgerEvent(
        'PATH_PAYMENT',
        'StellarDEX',
        'path_payment_strict_receive',
        `Swapped NGN to ${amt} USDC. Slippage: 0.05%, corridor path payment completed.`
      );
      setFundingStep('lock');

      setTimeout(() => {
        // Create actual trade escrow
        const txHash = 'SHA256_' + Math.random().toString(36).substring(2, 18).toUpperCase();
        const newTrade: Trade = {
          id: 'trade_' + Math.random().toString(36).substring(2, 8),
          traderName: 'Aisha Bello (You)',
          supplierId: selectedSupplierId,
          supplierName: activeSupplier.name,
          amountUSDC: amt,
          amountLocal: convertedAmountLocal,
          localCurrency: activeSupplier.localCurrency,
          status: 'LOCKED',
          createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          escrowTxHash: txHash,
          disputeWindowDays: 3,
          verificationMethod: 'QR_SCAN'
        };

        onAddTrade(newTrade);
        onUpdateWalletBalance(appState.walletBalanceUSDC - amt, appState.walletBalanceNGN);
        onAddLedgerEvent(
          'CONTRACT_CALL',
          'TradeEscrow',
          'lock_funds',
          `Soroban escrow initialised: LOCKED ${amt} USDC for merchant ${activeSupplier.name}. Refund disputable in 3 days. Tx: ${txHash}`
        );

        setFundingStep('success');
      }, 1500);
    }, 1500);
  };

  // Handle Scan & Escrow Release
  const handleReleaseEscrow = (trade: Trade) => {
    setReleasingTrade(trade);
    setReleaseStep('scan');
  };

  const simulateQRScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setReleaseStep('biometric');
    }, 1500);
  };

  const executeBiometricRelease = () => {
    setReleaseStep('broadcast');

    const triggerRelease = () => {
      if (!releasingTrade) return;

      const releaseTx = 'SHA256_REL_' + Math.random().toString(36).substring(2, 15).toUpperCase();

      onReleaseTrade(releasingTrade.id);
      onAddLedgerEvent(
        'ESCROW_RELEASE',
        'TradeEscrow',
        'release_payment',
        `Escrow released by buyer. Converted $${releasingTrade.amountUSDC} USDC to ${releasingTrade.localCurrency} ${releasingTrade.amountLocal} and routed to supplier's bank anchor. Tx: ${releaseTx}`
      );

      setReleaseStep('success');
    };

    if (isOffline) {
      // Simulate local signature
      alert('Offline signature created. Signing with private key locally. Polaris will queue this payload to broadcast the second network connection is detected!');
      onAddLedgerEvent(
        'CONTRACT_CALL',
        'TradeEscrow',
        'local_sign_offline',
        `Offline signature generated: Queue escrow release for trade ${releasingTrade?.id}. Payload stored in local device cache.`
      );
      setQueuedSigCount((c) => c + 1);
      // Wait a moment, auto reconnect and broadcast
      setTimeout(() => {
        setIsOffline(false);
        setQueuedSigCount(0);
        onAddLedgerEvent(
          'CONTRACT_CALL',
          'TradeEscrow',
          'broadcast_offline_queue',
          'Network connection restored! Broadcasting queued offline trade signature...'
        );
        triggerRelease();
      }, 4000);
    } else {
      setTimeout(triggerRelease, 1500);
    }
  };

  // Generate ZK Proof
  const generateReputationProof = () => {
    setProvingStatus('proving');
    onAddLedgerEvent(
      'CONTRACT_CALL',
      'TradeRep',
      'initialize_prover',
      'Generating local ZK membership proof parameters. Summing trade volumes without revealing counterparts.'
    );

    setTimeout(() => {
      setProvingStatus('key_gen');
      onAddLedgerEvent(
        'CONTRACT_CALL',
        'TradeRep',
        'generate_bls_sig',
        'Generating on-chain BLS12-381 signature credentials.'
      );

      setTimeout(() => {
        const zkHash = 'BLS12_381_PROOF_' + Math.random().toString(36).substring(2, 20).toUpperCase();
        const newProof: ZKProof = {
          id: 'zk_' + Math.random().toString(36).substring(2, 8),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          provenTier: appState.activeTier,
          totalVolumeUSDC: appState.completedCount * 180 + 350,
          disputeRate: 0,
          tradesCompleted: appState.completedCount,
          cryptographicHash: zkHash,
          verifiedOnChain: true
        };

        onAddZKProof(newProof);
        setGeneratedProof(newProof);
        onAddLedgerEvent(
          'ZK_VERIFY',
          'TradeRep',
          'verify_proof',
          `ZK Proof Verified: Tier: ${newProof.provenTier}, Volume: $${newProof.totalVolumeUSDC} USDC, completed trades: ${newProof.tradesCompleted}. Zero counterpart leaks.`
        );

        setProvingStatus('success');
      }, 1500);
    }, 1500);
  };

  // Draw Credit
  const handleDrawCredit = () => {
    const amt = parseFloat(drawAmount);
    if (isNaN(amt) || amt <= 0) return;

    let maxDraw = 500;
    if (appState.activeTier === 'Navigator') maxDraw = 2500;
    if (appState.activeTier === 'Polaris') maxDraw = 10000;

    if (amt > maxDraw) {
      alert(`Draw limit exceeded! Your current ${appState.activeTier} reputation tier allows up to $${maxDraw} USDC.`);
      return;
    }

    onDrawCredit(amt);
    onAddLedgerEvent(
      'CONTRACT_CALL',
      'CreditLine',
      'draw_funds',
      `Trader drew $${amt} USDC against verified ZK Reputation proof. Due in 30 days. Liquidity dispatched.`
    );
    alert(`Dispatched $${amt} USDC into your active balance! Goods financed. Repayment is scheduled over the next 30 days.`);
  };

  // Join/Contribute to Guild Pool
  const handleContributeGuild = (pool: GuildPool) => {
    const amt = parseFloat(contributeAmount);
    if (isNaN(amt) || amt <= 0) return;

    if (appState.walletBalanceUSDC < amt) {
      alert('Insufficient wallet balance to join this guild buying pool.');
      return;
    }

    onJoinGuildPool(pool.id, 'Aisha Bello (You)', amt);
    onUpdateWalletBalance(appState.walletBalanceUSDC - amt, appState.walletBalanceNGN);
    onAddLedgerEvent(
      'CONTRACT_CALL',
      'GuildPool',
      'deposit',
      `Joined Wholesale Guild Pool: Contributed $${amt} USDC. Member count: ${pool.membersCount + 1}`
    );
  };

  // Active locked trades
  const activeTrades = appState.trades.filter((t) => t.status === 'LOCKED');

  return (
    <div className="relative mx-auto w-[360px] h-[780px] bg-slate-950 rounded-[45px] p-3.5 border-[10px] border-slate-900 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col font-sans select-none z-10">
      {/* Phone Notch/Island */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-2xl z-30 flex items-center justify-center">
        <div className="w-12 h-1 bg-slate-950 rounded-full" />
      </div>

      {/* Screen Header / Status Bar */}
      <div className="flex justify-between items-center px-6 pt-2 pb-3 text-slate-400 font-mono text-[10px] z-20">
        <span className="font-bold text-slate-200">{simulatedTime}</span>
        <div className="flex items-center space-x-2">
          {isOffline ? (
            <WifiOff size={11} className="text-rose-500 animate-pulse" />
          ) : (
            <Wifi size={11} className="text-emerald-500" />
          )}
          <span className="text-[9px] uppercase font-bold tracking-wider">
            {isOffline ? 'Offline' : '5G'}
          </span>
          <Battery size={13} className="text-slate-400" />
        </div>
      </div>

      {/* Offline Alert Strip */}
      {isOffline && (
        <div className="bg-rose-950/80 border-y border-rose-900 px-4 py-1.5 text-[9px] text-rose-300 flex items-center justify-between font-mono animate-pulse z-10">
          <div className="flex items-center space-x-1.5">
            <AlertTriangle size={10} className="text-rose-400" />
            <span>Local Offline Escrow Active</span>
          </div>
          <span>SIG_OFFLINE</span>
        </div>
      )}

      {/* Phone Body Container (Scrollable screen) */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4 relative scrollbar-none pb-20">
        {/* Wallet Balances Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-4 shadow-xl relative overflow-hidden">
          {/* North Star decorative light */}
          <div className="absolute top-1 right-1 w-24 h-24 bg-amber-500/5 blur-3xl rounded-full pointer-events-none" />

          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-2">
              <Globe className="text-amber-500 animate-spin-slow" size={14} />
              <span className="text-[10px] uppercase font-black tracking-widest text-amber-500">POLARIS PAY RAIL</span>
            </div>
            {/* Offline Button Switch */}
            <button
              onClick={() => {
                setIsOffline(!isOffline);
                if (isOffline) setQueuedSigCount(0);
                onAddLedgerEvent(
                  'CONTRACT_CALL',
                  'StellarNetwork',
                  'network_toggle',
                  `Trader network state toggled: ${!isOffline ? 'OFFLINE_MODE (Local Signature)' : 'ONLINE_MODE (Standard Stellar Ingress)'}`
                );
              }}
              className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border transition-colors flex items-center space-x-1 relative ${
                isOffline
                  ? 'bg-rose-950/60 text-rose-400 border-rose-900'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <span>{isOffline ? 'Go Online' : 'Go Offline'}</span>
              {isOffline && queuedSigCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center leading-none">
                  {queuedSigCount}
                </span>
              )}
            </button>
          </div>

          <div className="mt-3">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Available Escrow Wallet</span>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span className="text-2xl font-black tracking-tight text-slate-100">
                ${appState.walletBalanceUSDC.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-slate-400 font-bold font-mono">USDC</span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/60 flex justify-between text-[10px]">
            <div className="flex items-center space-x-1 text-slate-400">
              <Wallet size={11} className="text-slate-500" />
              <span>Local NGN Bank: <strong>₦{(appState.walletBalanceNGN / 1000).toFixed(1)}k</strong></span>
            </div>
            <span className="text-amber-500 font-bold uppercase tracking-wider flex items-center">
              ★ {appState.activeTier} Tier
            </span>
          </div>
        </div>

        {/* SCREEN SWITCHER LOGIC */}

        {/* 1. HOME SCREEN */}
        {activeTab === 'home' && (
          <div className="space-y-4 animate-fade-in">
            {/* Active Journey cards */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Active Trade Escrows</span>
                <span className="text-[9px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded font-mono">
                  {activeTrades.length} locked
                </span>
              </div>

              {activeTrades.length === 0 ? (
                <div className="bg-slate-900/40 border border-dashed border-slate-800 p-6 rounded-2xl text-center space-y-2">
                  <span className="text-2xl block">🎒</span>
                  <div className="text-xs font-semibold text-slate-400">Your bag is empty</div>
                  <p className="text-[10px] text-slate-500 leading-normal max-w-[240px] mx-auto">
                    Travel cash-free. Lock funds in USDC, cross the border safely, and release only after inspecting goods.
                  </p>
                  <button
                    onClick={() => setActiveTab('new_trade')}
                    className="mt-1.5 bg-amber-500 text-slate-900 font-bold text-[10px] px-3 py-1.5 rounded-lg uppercase tracking-wide inline-flex items-center"
                  >
                    Lock New Trade
                  </button>
                </div>
              ) : (
                activeTrades.map((trade) => (
                  <div
                    key={trade.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 relative overflow-hidden hover:border-slate-700 transition-all cursor-pointer"
                    onClick={() => {
                      setReleasingTrade(trade);
                      setReleaseStep('scan');
                      setActiveTab('release');
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[9px] font-bold font-mono text-cyan-400 uppercase tracking-widest">Border Transit Card</span>
                        <h4 className="font-bold text-slate-200 text-xs mt-0.5">{trade.supplierName}</h4>
                      </div>
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900">
                        LOCKED
                      </span>
                    </div>

                    <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <div>
                        <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Lock Amount</span>
                        <span className="text-xs font-bold text-slate-200">${trade.amountUSDC} USDC</span>
                      </div>
                      <ArrowRightLeft size={10} className="text-slate-600" />
                      <div className="text-right">
                        <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Merchant Value</span>
                        <span className="text-xs font-bold text-cyan-400 font-mono">
                          {trade.localCurrency} {trade.amountLocal.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[9px] text-slate-500">
                      <span className="flex items-center"><Clock size={10} className="mr-1" /> Created: {trade.createdAt}</span>
                      <span className="text-amber-500 font-bold flex items-center hover:underline">
                        Release Escrow <ChevronRight size={10} className="ml-0.5" />
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Travel Directory Shortcut */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-2">
              <h4 className="text-xs font-bold text-slate-300">Verified Corridor Directory</h4>
              <p className="text-[10px] text-slate-500 leading-normal">
                Quick-scan or pick a trusted anchor merchant before travelling to buy.
              </p>
              <div className="space-y-1.5 pt-1">
                {suppliers.slice(0, 3).map((sup) => (
                  <div
                    key={sup.id}
                    onClick={() => {
                      setSelectedSupplierId(sup.id);
                      setActiveTab('new_trade');
                      setFundingStep('input');
                    }}
                    className="flex justify-between items-center p-2 bg-slate-950 rounded-xl border border-slate-800/80 hover:border-slate-700 cursor-pointer transition-all text-[11px]"
                  >
                    <span className="text-slate-300 font-medium">{sup.name}</span>
                    <span className="text-[9px] bg-slate-900 text-cyan-400 font-mono font-bold px-1.5 py-0.5 rounded border border-slate-800">
                      {sup.localCurrency}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Trade History */}
            {appState.trades.filter(t => t.status !== 'LOCKED').length > 0 && (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-300">Trade History</h4>
                  <span className="text-[9px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded font-mono border border-slate-800">
                    {appState.trades.filter(t => t.status !== 'LOCKED').length} trades
                  </span>
                </div>
                <div className="space-y-1.5 pt-1 max-h-[180px] overflow-y-auto">
                  {appState.trades.filter(t => t.status !== 'LOCKED').map((trade) => (
                    <div
                      key={trade.id}
                      className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 text-[10px]"
                    >
                      <div className="flex items-center space-x-2 min-w-0">
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          trade.status === 'RELEASED' ? 'bg-emerald-500' :
                          trade.status === 'DISPUTED' ? 'bg-red-500' : 'bg-slate-500'
                        }`} />
                        <div className="min-w-0">
                          <div className="text-slate-300 font-semibold truncate">{trade.supplierName}</div>
                          <div className="text-slate-500 text-[9px]">{trade.createdAt}</div>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <div className="font-bold text-slate-200">${trade.amountUSDC} USDC</div>
                        <div className={`text-[9px] font-bold ${
                          trade.status === 'RELEASED' ? 'text-emerald-400' :
                          trade.status === 'DISPUTED' ? 'text-red-400' : 'text-slate-400'
                        }`}>
                          {trade.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. NEW TRADE SCREEN */}
        {activeTab === 'new_trade' && (
          <div className="space-y-4 animate-fade-in">
            {fundingStep === 'input' && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
                <div className="border-b border-slate-800 pb-2.5">
                  <h3 className="text-xs font-black uppercase text-amber-500 tracking-wider">Lock Trade Escrow</h3>
                  <p className="text-[10px] text-slate-400 mt-1">Convert fiat and lock USDC on-chain to prepare for travel.</p>
                </div>

                {/* Supplier selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Select Wholesaler</label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full bg-slate-950 text-xs text-slate-100 border border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    {suppliers.map((sup) => (
                      <option key={sup.id} value={sup.id}>
                        {sup.name} ({sup.location})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Lock Amount ($ USDC)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-500">$</span>
                    <input
                      type="number"
                      value={tradeAmountUSDC}
                      onChange={(e) => setTradeAmountUSDC(e.target.value)}
                      placeholder="Amount to lock"
                      className="w-full bg-slate-950 text-xs text-slate-100 border border-slate-800 rounded-xl pl-7 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500 font-bold font-mono"
                    />
                  </div>
                </div>

                {/* Local Conversion preview */}
                <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Anchor Path Pay</span>
                    <span className="text-[11px] font-bold text-slate-300">
                      Est. {activeSupplier.localCurrency} Settlement:
                    </span>
                  </div>
                  <span className="text-sm font-black font-mono text-cyan-400">
                    {activeSupplier.localCurrency} {convertedAmountLocal.toLocaleString()}
                  </span>
                </div>

                {/* Disclaimer */}
                <div className="text-[9px] text-slate-500 leading-normal flex items-start space-x-1.5 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <Shield size={12} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    Funds lock inside the Soroban contract. Only released when you physically scan merchant's code or transport union logs arrival. Unreleased funds auto-dispute in 3 days.
                  </span>
                </div>

                <button
                  onClick={handleInitiateNewTrade}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-lg shadow-amber-950/40"
                >
                  <PlusCircle size={14} /> <span>Initiate Trade Lock</span>
                </button>
              </div>
            )}

            {fundingStep === 'sep24' && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4 animate-fade-in">
                <div className="border-b border-slate-800 pb-2.5 flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-black uppercase text-cyan-400 tracking-wider">SEP-24 Anchor Portal</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Deposit cash/mobile money to mint USDC.</p>
                  </div>
                  <span className="text-[9px] bg-slate-950 text-cyan-400 px-2 py-0.5 border border-cyan-900 rounded font-bold font-mono">
                    MTN/ORANGE
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-slate-500 font-bold uppercase">Funding Corridor</label>
                    <div className="bg-slate-950 p-2.5 rounded-xl text-xs font-semibold text-slate-300 border border-slate-800 flex justify-between">
                      <span>West Africa Hub</span>
                      <span>NGN ↔ USDC</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] text-slate-500 font-bold uppercase">Select Provider</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['MTN', 'ORANGE', 'BANK'] as const).map((method) => (
                        <button
                          key={method}
                          onClick={() => {
                            setSelectedPayMethod(method);
                            setMobileNumber(method === 'BANK' ? '234 81 2345 6789' : '229 97 12 34 56');
                          }}
                          className={`py-2 text-[10px] font-bold rounded-lg border transition-all ${
                            selectedPayMethod === method
                              ? 'bg-cyan-950/80 text-cyan-400 border-cyan-800'
                              : 'bg-slate-950 text-slate-400 border-slate-850'
                          }`}
                        >
                          {method === 'BANK' ? 'Bank Transfer' : method}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] text-slate-500 font-bold uppercase">
                      {selectedPayMethod === 'BANK' ? 'Account Number' : 'Mobile Number'}
                    </label>
                    <input
                      type="text"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      className="w-full bg-slate-950 text-xs text-slate-100 border border-slate-850 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-bold font-mono"
                    />
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-500">Deposit Amount:</span>
                      <span className="text-slate-300">₦{(parseFloat(tradeAmountUSDC) * 1600).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-slate-500">Receiving:</span>
                      <span className="text-cyan-400">${tradeAmountUSDC} USDC</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleExecuteSEP24Deposit}
                  className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black py-3 rounded-xl text-xs uppercase tracking-wider transition-all"
                >
                  Authorize MTN/Orange Pay
                </button>
              </div>
            )}

            {fundingStep === 'swap' && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4 animate-fade-in">
                <div className="w-12 h-12 rounded-full bg-cyan-950/60 border border-cyan-800 flex items-center justify-center mx-auto">
                  <ArrowRightLeft className="text-cyan-400 animate-spin" size={20} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-200 text-xs">Executing Path Payment Swap</h4>
                  <p className="text-[10px] text-slate-500 max-w-[200px] mx-auto">
                    Routing NGN through local anchor liquidity pools to fetch optimal USDC pricing on-chain.
                  </p>
                </div>
                <div className="font-mono text-[9px] text-slate-400 bg-slate-950 p-2 rounded-lg border border-slate-850">
                  QUERYING DEX PATHS: NGN ↔ XLM ↔ USDC...
                </div>
              </div>
            )}

            {fundingStep === 'lock' && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4 animate-fade-in">
                <div className="w-12 h-12 rounded-full bg-amber-950/60 border border-amber-800 flex items-center justify-center mx-auto">
                  <Shield className="text-amber-500 animate-pulse" size={20} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-200 text-xs">Calling Soroban TradeEscrow</h4>
                  <p className="text-[10px] text-slate-500 max-w-[200px] mx-auto">
                    Locking ${tradeAmountUSDC} USDC into secure escrow contract on-chain...
                  </p>
                </div>
                <div className="font-mono text-[9px] text-slate-400 bg-slate-950 p-2 rounded-lg border border-slate-850">
                  METHOD: lock_funds(merchant, amount, dispute_window)
                </div>
              </div>
            )}

            {fundingStep === 'success' && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4 animate-fade-in">
                <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-800 flex items-center justify-center mx-auto">
                  <Check className="text-emerald-500" size={20} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-200 text-xs">Escrow Successfully Funded!</h4>
                  <p className="text-[10px] text-slate-500">
                    Your $45,200 travel bag has locked another ${tradeAmountUSDC} USDC. You are ready to cross Cotonou/Accra borders safely.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setFundingStep('input');
                    setActiveTab('home');
                  }}
                  className="bg-slate-950 text-slate-300 hover:text-white font-bold text-[10px] px-4 py-2 rounded-lg border border-slate-800"
                >
                  Return to Home
                </button>
              </div>
            )}
          </div>
        )}

        {/* 3. RELEASE ESCROW SCREEN */}
        {activeTab === 'release' && (
          <div className="space-y-4 animate-fade-in">
            {releaseStep === 'select' && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
                <div className="border-b border-slate-800 pb-2.5">
                  <h3 className="text-xs font-black uppercase text-amber-500 tracking-wider">Release Escrow</h3>
                  <p className="text-[10px] text-slate-400 mt-1">Release funds to supplier once goods are verified.</p>
                </div>

                {activeTrades.length === 0 ? (
                  <div className="text-center py-6 text-slate-500">
                    <span className="text-xs">No escrows are currently locked.</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 font-bold uppercase block">Select Locked Escrow</label>
                    {activeTrades.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => handleReleaseEscrow(t)}
                        className="bg-slate-950 border border-slate-850 p-3 rounded-xl flex justify-between items-center hover:border-slate-700 transition-all cursor-pointer text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-200">{t.supplierName}</div>
                          <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                            Amount locked: ${t.amountUSDC} USDC
                          </div>
                        </div>
                        <span className="text-[10px] bg-amber-950 text-amber-400 font-bold px-2 py-0.5 rounded uppercase">
                          LOCKED
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {releaseStep === 'scan' && releasingTrade && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4 animate-fade-in">
                <div className="border-b border-slate-800 pb-2 flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-black text-slate-200 uppercase">QR Code Scanner</h3>
                    <p className="text-[10px] text-slate-500">Scan merchant invoice code to authorize release</p>
                  </div>
                  <button
                    onClick={() => setReleaseStep('select')}
                    className="text-slate-400 text-[10px] hover:text-white"
                  >
                    Cancel
                  </button>
                </div>

                {/* Simulated Camera Viewfinder */}
                <div className="bg-slate-950 rounded-2xl aspect-square border border-slate-850 overflow-hidden relative flex flex-col items-center justify-center">
                  {scanning ? (
                    <div className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center space-y-2 animate-pulse">
                      <Scan className="text-amber-500 animate-spin" size={40} />
                      <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-widest">
                        Reading QR Payload...
                      </span>
                    </div>
                  ) : (
                    <>
                      {/* Scanning frame overlay */}
                      <div className="w-48 h-48 border-2 border-dashed border-cyan-500 rounded-xl relative flex items-center justify-center animate-pulse">
                        <Scan className="text-cyan-500/30" size={100} />
                        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
                        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400" />
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400" />
                      </div>
                      <span className="text-[9px] text-slate-500 mt-4 text-center max-w-[200px]">
                        Point camera at supplier invoice QR to fetch contract coordinates.
                      </span>
                    </>
                  )}
                </div>

                <button
                  onClick={simulateQRScan}
                  disabled={scanning}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-slate-900 font-black py-3 rounded-xl text-xs uppercase tracking-wider transition-all"
                >
                  {scanning ? 'Scanning...' : 'Simulate QR Code Scan'}
                </button>
              </div>
            )}

            {releaseStep === 'biometric' && releasingTrade && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center space-y-5 animate-fade-in">
                <div className="border-b border-slate-800 pb-2.5">
                  <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider">Secure Biometric Verification</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Authorise Soroban contract unlock</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-mono">Invoice Match</span>
                  <div className="text-xs text-slate-300 font-bold">{releasingTrade.supplierName}</div>
                  <div className="text-sm font-black text-amber-500 font-mono mt-1">${releasingTrade.amountUSDC} USDC</div>
                </div>

                {/* Fingerprint Ripple button */}
                <button
                  onClick={executeBiometricRelease}
                  className="w-20 h-20 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center mx-auto hover:border-amber-500 hover:scale-105 active:scale-95 transition-all group shadow-xl relative"
                >
                  <div className="absolute inset-2 bg-gradient-to-tr from-amber-600/10 to-amber-400/10 rounded-full group-hover:animate-ping pointer-events-none" />
                  <Fingerprint size={36} className="text-amber-500 group-hover:text-amber-400 transition-colors stroke-[1.5]" />
                </button>

                <p className="text-[10px] text-slate-400 leading-normal max-w-[220px] mx-auto">
                  Hold fingerprint reader or tap to cryptographically sign transaction with your local hardware key.
                </p>
              </div>
            )}

            {releaseStep === 'broadcast' && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4 animate-fade-in">
                <div className="w-12 h-12 rounded-full bg-amber-950/60 border border-amber-800 flex items-center justify-center mx-auto">
                  <RotateCcw className="text-amber-500 animate-spin" size={20} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-200 text-xs">Broadcasting Release Transaction</h4>
                  <p className="text-[10px] text-slate-500 max-w-[200px] mx-auto">
                    Sending transaction signature to Soroban smart contract network...
                  </p>
                </div>
                <div className="font-mono text-[9px] text-slate-400 bg-slate-950 p-2 rounded-lg border border-slate-850">
                  METHOD: release_payment(release_signature)
                </div>
              </div>
            )}

            {releaseStep === 'success' && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4 animate-fade-in">
                <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-800 flex items-center justify-center mx-auto">
                  <Check className="text-emerald-500" size={20} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-200 text-xs">Escrow Dispatched Successfully!</h4>
                  <p className="text-[10px] text-slate-500">
                    The supplier's anchor is auto-converting USDC into local currency. They will receive funds in seconds.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setReleaseStep('select');
                    setReleasingTrade(null);
                    setActiveTab('home');
                  }}
                  className="bg-slate-950 text-slate-300 hover:text-white font-bold text-[10px] px-4 py-2 rounded-lg border border-slate-800"
                >
                  Return to Home
                </button>
              </div>
            )}
          </div>
        )}

        {/* 4. MY STAR REPUTATION SCREEN */}
        {activeTab === 'my_star' && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
              <div className="border-b border-slate-800 pb-2.5">
                <h3 className="text-xs font-black uppercase text-amber-500 tracking-wider">ZK Trade Reputation</h3>
                <p className="text-[10px] text-slate-400 mt-1">Accumulate history, mint zero-knowledge reputation tiers.</p>
              </div>

              {/* Tier status indicator */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-slate-950 font-black">
                    ★
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase font-mono block">Current Star Class</span>
                    <span className="text-xs font-bold text-slate-200">{appState.activeTier} Tier</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-slate-500 uppercase font-mono block">Completed Escrows</span>
                  <span className="text-xs font-bold text-cyan-400 font-mono">{appState.completedCount} trades</span>
                </div>
              </div>

              {/* Progress bar to next tier */}
              {appState.activeTier === 'Polaris' ? (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase">
                    <span>Max Tier Reached</span>
                    <span className="text-amber-500">Polaris ★</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div className="bg-gradient-to-r from-amber-500 to-amber-300 h-full w-full rounded-full" />
                  </div>
                  <p className="text-[9px] text-amber-500 font-bold text-center">You have reached the highest reputation tier!</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {(() => {
                    const nextTier = appState.activeTier === 'Rising' ? 'Navigator' : 'Polaris';
                    const target = appState.activeTier === 'Rising' ? 6 : 16;
                    const remaining = Math.max(0, target - appState.completedCount);
                    const pct = Math.min(100, Math.round((appState.completedCount / target) * 100));
                    return (
                      <>
                        <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase">
                          <span>Progress to {nextTier} Tier</span>
                          <span className="text-cyan-400">{appState.completedCount}/{target} trades</span>
                        </div>
                        <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                          <div
                            style={{ width: `${pct}%` }}
                            className="bg-gradient-to-r from-cyan-500 to-amber-500 h-full rounded-full transition-all duration-500"
                          />
                        </div>
                        <div className="flex justify-between text-[9px]">
                          <span className="text-slate-500">{pct}% complete</span>
                          <span className="text-amber-400 font-bold">
                            {remaining === 0
                              ? 'Upgrading tier...'
                              : `${remaining} trade${remaining !== 1 ? 's' : ''} to ${nextTier}`}
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {/* ZK Proof generator interaction */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3">
                <div className="flex items-center space-x-1.5">
                  <Shield size={14} className="text-violet-400" />
                  <span className="text-[11px] font-bold text-slate-300">Generate Cryptographic Proof</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-normal">
                  Generate a math proof of your active trading volume and 0% dispute rate. Share this proof anonymously with financiers to open larger credit limits.
                </p>

                {provingStatus === 'idle' && (
                  <button
                    onClick={generateReputationProof}
                    className="w-full bg-violet-600 hover:bg-violet-500 text-white font-black py-2.5 rounded-lg text-[10px] uppercase tracking-wide flex items-center justify-center space-x-1.5 transition-all shadow-md shadow-violet-950/40"
                  >
                    <span>Compute ZK Reputation Proof</span>
                  </button>
                )}

                {provingStatus === 'proving' && (
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-center space-y-1 animate-pulse">
                    <span className="text-[10px] font-mono text-violet-400 font-bold uppercase tracking-wider block">Running Local Prover</span>
                    <span className="text-[9px] text-slate-500">Executing ZK circuits via WebAssembly...</span>
                  </div>
                )}

                {provingStatus === 'key_gen' && (
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-center space-y-1 animate-pulse">
                    <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider block">Generating BLS12-381 Credentials</span>
                    <span className="text-[9px] text-slate-500">Signing on-chain verification credentials...</span>
                  </div>
                )}

                {provingStatus === 'success' && generatedProof && (
                  <div className="p-3 bg-violet-950/40 border border-violet-900 rounded-lg space-y-2 animate-fade-in">
                    <div className="flex items-center space-x-1.5 text-emerald-400 text-[10px] font-bold">
                      <Check size={11} /> <span>Proof Generated & Verified On-Chain!</span>
                    </div>
                    <div className="font-mono text-[8px] text-slate-400 select-all overflow-hidden truncate">
                      SIG: {generatedProof.cryptographicHash}
                    </div>
                    <button
                      onClick={() => {
                        setProvingStatus('idle');
                        setGeneratedProof(null);
                        setActiveTab('credit');
                      }}
                      className="w-full bg-slate-900 text-slate-200 border border-slate-800 text-[9px] py-1.5 rounded hover:text-white"
                    >
                      Go to Credit Tab to Draw against Proof
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 5. CREDIT SCREEN */}
        {activeTab === 'credit' && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
              <div className="border-b border-slate-800 pb-2.5">
                <h3 className="text-xs font-black uppercase text-violet-400 tracking-wider">Reputation Credit Lines</h3>
                <p className="text-[10px] text-slate-400 mt-1">Draw capital from financier pools using verified reputation.</p>
              </div>

              {/* Available Limits display */}
              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase block">Credit Borrow Limits by Class</label>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center p-2 bg-slate-950 rounded-xl border border-slate-850 text-xs">
                    <span className="text-slate-400">Rising Tier:</span>
                    <span className="font-bold text-slate-200">$500 Max</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-slate-950 rounded-xl border border-cyan-900/60 text-xs">
                    <span className="text-cyan-400 font-bold">Navigator Tier (You):</span>
                    <span className="font-bold text-cyan-400">$2,500 Max</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-slate-950 rounded-xl border border-slate-850 text-xs">
                    <span className="text-slate-400">Polaris Tier:</span>
                    <span className="font-bold text-slate-200">$10,000 Max</span>
                  </div>
                </div>
              </div>

              {/* Draw Capital action */}
              <div className="space-y-3 bg-slate-950 p-3 rounded-xl border border-slate-850">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-200">Draw Financing</span>
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 font-bold px-1.5 py-0.5 rounded">
                    12.5% Variable APR
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] text-slate-500 font-bold uppercase block">Amount ($ USDC)</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1.5 text-xs font-bold text-slate-500">$</span>
                    <input
                      type="number"
                      value={drawAmount}
                      onChange={(e) => setDrawAmount(e.target.value)}
                      placeholder="Amount to draw"
                      className="w-full bg-slate-900 text-xs text-slate-100 border border-slate-800 rounded-lg pl-6 pr-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-violet-500 font-bold font-mono"
                    />
                  </div>
                </div>

                <button
                  onClick={handleDrawCredit}
                  className="w-full bg-violet-600 hover:bg-violet-500 text-white font-black py-2 rounded-lg text-[10px] uppercase tracking-wide transition-all"
                >
                  Draw Liquidity Line
                </button>
              </div>

              {/* Outstanding Draws schedule */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Repayment Schedule</label>
                  <span className="text-[9px] text-slate-400">Repaid automatically through trade rails</span>
                </div>

                {appState.activeCreditDraws.length === 0 ? (
                  <div className="text-center py-4 bg-slate-955 rounded-xl border border-slate-850 text-[10px] text-slate-500">
                    No active financed credit lines.
                  </div>
                ) : (
                  appState.activeCreditDraws.map((draw, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-slate-950 border border-slate-850 rounded-xl flex justify-between items-center text-[10px]"
                    >
                      <div>
                        <div className="font-bold text-slate-200">${draw.amountUSDC} USDC Financed</div>
                        <span className="text-slate-500 text-[9px]">Due date: {draw.dueDate}</span>
                      </div>
                      <button
                        onClick={() => {
                          onRepayCredit(idx);
                          onUpdateWalletBalance(appState.walletBalanceUSDC - draw.amountUSDC, appState.walletBalanceNGN);
                          onAddLedgerEvent(
                            'CONTRACT_CALL',
                            'CreditLine',
                            'repay_loan',
                            `Trader settled active debt on-chain. Repaid $${draw.amountUSDC} USDC + 12.5% accrued yield.`
                          );
                          alert('Debt fully repaid! Your repayment tier score has been updated in the indexer.');
                        }}
                        className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold px-2 py-1 rounded text-[9px] uppercase tracking-wide transition-all"
                      >
                        Repay Debt
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* 6. GUILD SCREEN */}
        {activeTab === 'guild' && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
              <div className="border-b border-slate-800 pb-2.5">
                <h3 className="text-xs font-black uppercase text-cyan-400 tracking-wider">Wholesale Group Buying Pools</h3>
                <p className="text-[10px] text-slate-400 mt-1">Pool USDC with 15 sister-traders to import bulk goods cheaper.</p>
              </div>

              {appState.guildPools.length === 0 ? (
                <div className="bg-slate-900/40 border border-dashed border-slate-800 p-6 rounded-2xl text-center space-y-2">
                  <span className="text-2xl block">👥</span>
                  <div className="text-xs font-semibold text-slate-400">No guild pools joined yet</div>
                  <p className="text-[10px] text-slate-500 leading-normal max-w-[240px] mx-auto">
                    Join a wholesale buying pool to split bulk import costs with other traders and unlock better pricing.
                  </p>
                  <button
                    onClick={() => setActiveTab('home')}
                    className="mt-1.5 bg-cyan-500 text-slate-900 font-bold text-[10px] px-3 py-1.5 rounded-lg uppercase tracking-wide inline-flex items-center"
                  >
                    Browse Pools
                  </button>
                </div>
              ) : appState.guildPools.map((pool) => {
                const filledPct = Math.round((pool.currentUSDC / pool.targetUSDC) * 100);

                return (
                  <div
                    key={pool.id}
                    className="bg-slate-950 border border-slate-850 rounded-xl p-3.5 space-y-3 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-200 text-xs">{pool.name}</h4>
                        <span className="text-[9px] text-slate-500 block">{pool.origin} ➔ {pool.destination} route</span>
                      </div>
                      <span className="text-[9px] font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-900 px-2 py-0.5 rounded uppercase">
                        {pool.status}
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-400 leading-normal">{pool.description}</p>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] text-slate-500 font-bold uppercase">
                        <span>Pool filled: {filledPct}%</span>
                        <span>${pool.currentUSDC}/${pool.targetUSDC} USDC</span>
                      </div>
                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-850">
                        <div
                          style={{ width: `${filledPct}%` }}
                          className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full rounded-full"
                        />
                      </div>
                    </div>

                    {/* Member contributions snippet */}
                    <div className="text-[9px] text-slate-500 bg-slate-900 p-2 rounded-lg border border-slate-850/60 max-h-[70px] overflow-y-auto space-y-1">
                      <span className="font-bold uppercase text-[8px] block tracking-wider">Active Contributions</span>
                      {pool.contributions.map((con, i) => (
                        <div key={i} className="flex justify-between text-slate-400">
                          <span>{con.traderName}</span>
                          <span className="font-bold text-slate-200">${con.amountUSDC} USDC</span>
                        </div>
                      ))}
                    </div>

                    {/* Group Buy CTA */}
                    {pool.status === 'OPEN' && (
                      <div className="flex items-center space-x-2 pt-1">
                        <div className="relative w-20">
                          <span className="absolute left-2 top-1 text-xs font-bold text-slate-500">$</span>
                          <input
                            type="number"
                            value={contributeAmount}
                            onChange={(e) => setContributeAmount(e.target.value)}
                            className="w-full bg-slate-900 text-xs text-slate-100 border border-slate-800 rounded px-5 py-1 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-bold font-mono"
                          />
                        </div>
                        <button
                          onClick={() => handleContributeGuild(pool)}
                          className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black py-1.5 rounded text-[10px] uppercase tracking-wide transition-all"
                        >
                          Contribute to Pool
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Screen Footer Tab Bar Navigation */}
      <div className="absolute bottom-4 left-3.5 right-3.5 bg-slate-900 border border-slate-800 rounded-2xl p-1.5 flex justify-between items-center z-20 shadow-2xl">
        <button
          onClick={() => {
            setActiveTab('home');
            setFundingStep('input');
          }}
          className={`flex-1 py-2 flex flex-col items-center space-y-0.5 rounded-xl transition-all ${
            activeTab === 'home' ? 'bg-slate-950 text-amber-500' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Home size={15} />
          <span className="text-[8px] font-bold">Home</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('new_trade');
            setFundingStep('input');
          }}
          className={`flex-1 py-2 flex flex-col items-center space-y-0.5 rounded-xl transition-all ${
            activeTab === 'new_trade' ? 'bg-slate-950 text-amber-500' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <PlusCircle size={15} />
          <span className="text-[8px] font-bold">New Trade</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('release');
            setReleaseStep('select');
          }}
          className={`flex-1 py-2 flex flex-col items-center space-y-0.5 rounded-xl transition-all ${
            activeTab === 'release' ? 'bg-slate-950 text-amber-500' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <QrCode size={15} />
          <span className="text-[8px] font-bold">Release</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('my_star');
            setProvingStatus('idle');
          }}
          className={`flex-1 py-2 flex flex-col items-center space-y-0.5 rounded-xl transition-all ${
            activeTab === 'my_star' ? 'bg-slate-950 text-amber-500' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Award size={15} />
          <span className="text-[8px] font-bold">My Star</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('credit');
          }}
          className={`flex-1 py-2 flex flex-col items-center space-y-0.5 rounded-xl transition-all ${
            activeTab === 'credit' ? 'bg-slate-950 text-amber-500' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Wallet size={15} />
          <span className="text-[8px] font-bold">Credit</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('guild');
          }}
          className={`flex-1 py-2 flex flex-col items-center space-y-0.5 rounded-xl transition-all ${
            activeTab === 'guild' ? 'bg-slate-950 text-amber-500' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Users size={15} />
          <span className="text-[8px] font-bold">Guilds</span>
        </button>
      </div>
    </div>
  );
};

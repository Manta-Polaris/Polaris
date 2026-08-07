import React, { useState } from 'react';
import { CreditLine, ZKProof } from '../types';
import { TrendingUp, Award, ShieldAlert, Coins, Plus, Check, Info, BarChart2 } from 'lucide-react';

interface CreditMarketplaceProps {
  creditLines: CreditLine[];
  zkProofs: ZKProof[];
  onFundPool: (lineId: string, amount: number) => void;
  onAddLedgerEvent: (type: 'CONTRACT_CALL' | 'SEP24_FUNDING' | 'PATH_PAYMENT' | 'ZK_VERIFY' | 'ESCROW_RELEASE', contract: string, method: string, details: string) => void;
}

export const CreditMarketplace: React.FC<CreditMarketplaceProps> = ({
  creditLines,
  zkProofs,
  onFundPool,
  onAddLedgerEvent
}) => {
  const [fundAmount, setFundAmount] = useState<string>('5000');
  const [fundingLineId, setFundingLineId] = useState<string>('');
  const [showTooltip, setShowTooltip] = useState<boolean>(false);
  const [poolSortBy, setPoolSortBy] = useState<'default' | 'util_asc' | 'util_desc' | 'rate_asc' | 'rate_desc'>('default');

  const handleFund = (lineId: string) => {
    const val = parseFloat(fundAmount);
    if (isNaN(val) || val <= 0) return;
    onFundPool(lineId, val);
    setFundingLineId('');
    onAddLedgerEvent(
      'CONTRACT_CALL',
      'CreditLine',
      'deposit_liquidity',
      `Financier deposited ${val.toLocaleString()} USDC into credit line pool. Corridor: ${creditLines.find(c => c.id === lineId)?.corridor}`
    );
    alert(`Successfully deposited $${val.toLocaleString()} USDC into the credit pool. Smart contract updated with your liquidity coordinates!`);
  };

  // Compute aggregate stats for ZK Proofs
  const activeZKProofsCount = zkProofs.length;
  const verifiedProofsCount = zkProofs.filter((p) => p.verifiedOnChain).length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-full">
      {/* Header */}
      <div className="bg-slate-950 border-b border-slate-800 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Coins className="text-violet-500" size={18} />
            <span className="text-xs uppercase font-bold tracking-wider text-violet-500">POLARIS DEFI LAYER</span>
          </div>
          <h2 className="text-lg font-bold text-slate-100">Credit Marketplace & Underwriting</h2>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400">Repayment Rail:</span>
          <span className="text-xs bg-emerald-950 text-emerald-400 font-bold px-3 py-1 rounded-full border border-emerald-900">
            99.2% Average Repayment Rate
          </span>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[600px] md:max-h-[800px]">
        {/* Underwriting Intro Card */}
        <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800/80">
          <div className="flex items-start space-x-3">
            <div className="bg-violet-950 p-2 rounded-lg text-violet-400 mt-0.5">
              <Award size={16} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-200 text-sm">ZK-Reputation Underwriting</span>
                <span className="text-[10px] bg-violet-950 text-violet-400 px-2 py-0.5 rounded font-mono uppercase">BLS12-381 proofs</span>
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Rather than extracting private personal records, Polaris enables informal traders to prove creditworthiness using mathematically verified trade histories. Borrowers remain fully anonymous while proving their trade tier, volume, and low dispute rate on-chain.
              </p>
            </div>
          </div>
        </div>

        {/* Corridor Credit Pools Grid */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="font-bold text-slate-200 text-sm">Corridor Liquidity Pools</h3>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Sort:</span>
              {([
                { key: 'default',   label: 'Default' },
                { key: 'util_desc', label: 'Util ↓' },
                { key: 'util_asc',  label: 'Util ↑' },
                { key: 'rate_asc',  label: 'Rate ↓' },
                { key: 'rate_desc', label: 'Rate ↑' },
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setPoolSortBy(key)}
                  className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-all ${
                    poolSortBy === key
                      ? 'bg-violet-600 text-white border-violet-500'
                      : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...creditLines].sort((a, b) => {
              if (poolSortBy === 'util_desc') return b.utilizationRate - a.utilizationRate;
              if (poolSortBy === 'util_asc')  return a.utilizationRate - b.utilizationRate;
              if (poolSortBy === 'rate_asc')  return a.riskTierRates.Navigator - b.riskTierRates.Navigator;
              if (poolSortBy === 'rate_desc') return b.riskTierRates.Navigator - a.riskTierRates.Navigator;
              return 0;
            }).map((line) => (
              <div
                key={line.id}
                className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-slate-700 transition-colors flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Title Corridor */}
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-xs text-slate-400">Trade Route Corridor</div>
                      <h4 className="font-bold text-slate-200 text-sm mt-0.5">{line.corridor}</h4>
                    </div>
                    <span className="text-[10px] bg-emerald-950 text-emerald-400 font-bold px-2.5 py-0.5 rounded-full">
                      APRL: {(12.5 + Math.random() * 3).toFixed(1)}% Yield
                    </span>
                  </div>

                  {/* Funding Metrics */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 text-center">
                    <div>
                      <div className="text-[9px] text-slate-500 font-bold uppercase">Liquidity</div>
                      <div className="text-xs font-bold text-slate-200 mt-0.5">
                        ${line.totalFundedUSDC.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-500 font-bold uppercase">Util. Rate</div>
                      <div className="text-xs font-bold text-amber-500 mt-0.5">
                        {line.utilizationRate}%
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-500 font-bold uppercase">Repaid</div>
                      <div className="text-xs font-bold text-emerald-500 mt-0.5">
                        {line.repaymentRate}%
                      </div>
                    </div>
                  </div>

                  {/* Risk Tier Rates */}
                  <div className="space-y-1.5 text-[10px] text-slate-400">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">Interest Rates by ZK Reputation</span>
                    <div className="flex justify-between">
                      <span>Rising Tier Interest:</span>
                      <span className="text-slate-200 font-bold">{line.riskTierRates.Rising}% APR</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Navigator Tier Interest:</span>
                      <span className="text-cyan-400 font-bold">{line.riskTierRates.Navigator}% APR</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Polaris Tier Interest:</span>
                      <span className="text-amber-500 font-bold">{line.riskTierRates.Polaris}% APR</span>
                    </div>
                  </div>

                  {/* Repayment Trend Sparkline */}
                  <div className="pt-2">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Repayment Performance Curve</span>
                    <div className="h-8 flex items-end justify-between px-1 bg-slate-900 border border-slate-800 rounded-lg overflow-hidden pt-2">
                      {line.repaymentCurve.map((point, index) => (
                        <div
                          key={index}
                          style={{ height: `${point}%` }}
                          className="w-[10%] bg-violet-600/60 hover:bg-violet-500 transition-all rounded-t-sm"
                          title={`Period ${index + 1}: ${point}% repaid`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Fund CTA */}
                <div className="mt-4 pt-3 border-t border-slate-900/60">
                  {fundingLineId === line.id ? (
                    <div className="flex items-center space-x-2">
                      <div className="relative flex-1">
                        <span className="absolute left-2.5 top-2 text-[10px] font-bold text-slate-500">$</span>
                        <input
                          type="number"
                          value={fundAmount}
                          onChange={(e) => setFundAmount(e.target.value)}
                          placeholder="Amount"
                          className="w-full bg-slate-900 text-xs text-slate-100 border border-slate-800 rounded-lg pl-6 pr-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-violet-500"
                        />
                      </div>
                      <button
                        onClick={() => handleFund(line.id)}
                        className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] uppercase"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setFundingLineId('')}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-2 py-1.5 rounded-lg text-[10px]"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setFundingLineId(line.id)}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold py-2 rounded-xl text-xs uppercase tracking-wide flex items-center justify-center space-x-1"
                    >
                      <Plus size={14} /> <span>Supply Pool Liquidity</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ZK Proof Verifications & Portfolio Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ZK Verifier Console */}
          <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <BarChart2 className="text-violet-400" size={16} />
                <h3 className="font-bold text-slate-200 text-sm">ZK Reputation Verifications</h3>
              </div>
              <span className="text-[9px] bg-violet-950 text-violet-400 border border-violet-900 px-2 py-0.5 rounded font-bold font-mono">
                BLS12-381
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Live proofs generated by mobile traders when drawing credit. These are submitted and verified on-chain to unlock financing pools instantly.
            </p>

            {zkProofs.length === 0 ? (
              <div className="text-center py-6 text-slate-500">
                <div className="text-xs font-semibold">No ZK proofs submitted yet</div>
                <p className="text-[10px] text-slate-600 mt-1">
                  Go to the **Mobile Trader App**, earn trade points, and click **Generate Credit Proof** in the "My Star" tab.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 overflow-y-auto max-h-[180px] pr-1">
                {zkProofs.map((proof) => (
                  <div
                    key={proof.id}
                    className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between hover:border-violet-800 transition-colors"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] text-slate-400 font-bold font-mono">Proof #{proof.id.substring(0, 6)}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          proof.provenTier === 'Polaris'
                            ? 'bg-amber-950 text-amber-400'
                            : proof.provenTier === 'Navigator'
                            ? 'bg-cyan-950 text-cyan-400'
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          {proof.provenTier} Tier
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 text-[10px] text-slate-400 mt-1">
                        <span>Trades: <strong className="text-slate-200">{proof.tradesCompleted}</strong></span>
                        <span>Volume: <strong className="text-slate-200">${proof.totalVolumeUSDC.toLocaleString()}</strong></span>
                        <span>Disputes: <strong className="text-slate-200">{proof.disputeRate}%</strong></span>
                      </div>
                      <div className="text-[8px] text-slate-600 font-mono mt-0.5 truncate max-w-[200px]">
                        BLS12-381_PK_SIG: {proof.cryptographicHash}
                      </div>
                    </div>

                    <div className="text-right">
                      {proof.verifiedOnChain ? (
                        <span className="inline-flex items-center text-xs text-emerald-500 font-bold bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-900">
                          <Check size={12} className="mr-1" /> VERIFIED
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs text-slate-500 font-bold bg-slate-800 px-2 py-1 rounded-lg">
                          PENDING
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Aggregate Portfolio Risk View */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 text-xs">ZK-Verified Risk Profile</span>
                <button
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <Info size={12} />
                </button>
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">Aggregate tier distribution of verified borrowers</p>
            </div>

            {/* Simulated bar chart representation of Risk Profile */}
            <div className="space-y-3 my-4">
              {/* Polaris Tier */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-amber-500 font-bold">Polaris Tier (AAA)</span>
                  <span className="text-slate-300">45%</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div className="bg-gradient-to-r from-amber-600 to-amber-400 h-full w-[45%]" />
                </div>
              </div>

              {/* Navigator Tier */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-cyan-400 font-bold">Navigator Tier (AA)</span>
                  <span className="text-slate-300">40%</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div className="bg-gradient-to-r from-cyan-500 to-cyan-300 h-full w-[40%]" />
                </div>
              </div>

              {/* Rising Tier */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-400 font-bold">Rising Tier (BBB)</span>
                  <span className="text-slate-300">15%</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div className="bg-gradient-to-r from-slate-600 to-slate-400 h-full w-[15%]" />
                </div>
              </div>
            </div>

            <div className="text-[9px] text-slate-500 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 leading-normal">
              <strong>Proof Guarantee:</strong> All credit lines are backed by real-time escrows. Default risks are mitigated through group-guild pools and transport validation triggers on-chain.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

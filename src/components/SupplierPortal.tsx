import React, { useState } from 'react';
import { Supplier, Trade, Currency } from '../types';
import { Store, ArrowRight, DollarSign, QrCode, FileText, CheckCircle2, UserCheck, HelpCircle, Search, AlertTriangle, X, ChevronDown, ChevronUp } from 'lucide-react';

interface SupplierPortalProps {
  suppliers: Supplier[];
  trades: Trade[];
  onTriggerSettlement: (tradeId: string) => void;
  onAddLedgerEvent: (type: 'CONTRACT_CALL' | 'SEP24_FUNDING' | 'PATH_PAYMENT' | 'ZK_VERIFY' | 'ESCROW_RELEASE', contract: string, method: string, details: string) => void;
}

export const SupplierPortal: React.FC<SupplierPortalProps> = ({
  suppliers,
  trades,
  onTriggerSettlement,
  onAddLedgerEvent
}) => {
  const [activeSupplierId, setActiveSupplierId] = useState<string>('sup_1');
  const [selectedInvoiceTrade, setSelectedInvoiceTrade] = useState<Trade | null>(null);
  const [tradeSearch, setTradeSearch] = useState<string>('');
  const [tradeStatusFilter, setTradeStatusFilter] = useState<'ALL' | 'LOCKED' | 'RELEASED' | 'DISPUTED'>('ALL');
  const [disputeModal, setDisputeModal] = useState<Trade | null>(null);
  const [disputeConfirmPending, setDisputeConfirmPending] = useState<boolean>(false);
  const [qrHighContrast, setQrHighContrast] = useState<boolean>(false);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [isLoadingTrades, setIsLoadingTrades] = useState<boolean>(true);

  // Simulate initial data fetch
  React.useEffect(() => {
    const t = setTimeout(() => setIsLoadingTrades(false), 1200);
    return () => clearTimeout(t);
  }, []);

  // Mock dispute details — keyed by trade id, fallback for any unknown trade
  const MOCK_DISPUTES: Record<string, { reason: string; raisedBy: string; timestamp: string }> = {
    default: {
      reason: 'Buyer claims goods were not delivered as described. Partial shipment received — 3 of 6 cartons missing on arrival at Dantokpa Market checkpoint.',
      raisedBy: 'Aisha Bello (Buyer)',
      timestamp: new Date(Date.now() - 1000 * 60 * 47).toLocaleString(),
    },
  };

  const getDisputeDetails = (trade: Trade) =>
    MOCK_DISPUTES[trade.id] ?? { ...MOCK_DISPUTES.default, timestamp: trade.createdAt };

  const activeSupplier = suppliers.find((s) => s.id === activeSupplierId) || suppliers[0];

  // Filter trades meant for this supplier
  const supplierTrades = trades.filter((t) => t.supplierId === activeSupplier.id);

  // Search + status filter applied to table
  const filteredTrades = supplierTrades.filter((t) => {
    const matchesSearch =
      tradeSearch.trim() === '' ||
      t.traderName.toLowerCase().includes(tradeSearch.toLowerCase()) ||
      t.escrowTxHash.toLowerCase().includes(tradeSearch.toLowerCase());
    const matchesStatus = tradeStatusFilter === 'ALL' || t.status === tradeStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const lockedEscrowsCount = supplierTrades.filter((t) => t.status === 'LOCKED').length;
  const lockedAmountUSDC = supplierTrades
    .filter((t) => t.status === 'LOCKED')
    .reduce((sum, t) => sum + t.amountUSDC, 0);

  const settledCount = supplierTrades.filter((t) => t.status === 'RELEASED').length;
  const settledAmountLocal = supplierTrades
    .filter((t) => t.status === 'RELEASED')
    .reduce((sum, t) => sum + t.amountLocal, 0);

  const handleSettle = (trade: Trade) => {
    onTriggerSettlement(trade.id);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-full">
      {/* Header with Switcher */}
      <div className="bg-slate-950 border-b border-slate-800 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Store className="text-amber-500" size={18} />
            <span className="text-xs uppercase font-bold tracking-wider text-amber-500">POLARIS SUPPLIER NETWORK</span>
          </div>
          <h2 className="text-lg font-bold text-slate-100">Merchant Terminal & Settlement Desk</h2>
        </div>

        {/* Supplier Profile Switcher */}
        <div className="flex items-center space-x-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 font-bold px-2 uppercase">Merchant:</span>
          <select
            value={activeSupplierId}
            onChange={(e) => {
              setActiveSupplierId(e.target.value);
              const sup = suppliers.find(s => s.id === e.target.value);
              if (sup) {
                onAddLedgerEvent(
                  'CONTRACT_CALL',
                  'TradeEscrow',
                  'query_merchant',
                  `Merchant console switched to ${sup.name} (${sup.location})`
                );
              }
            }}
            className="bg-slate-950 text-xs text-slate-100 border-none rounded-lg py-1.5 px-3 focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
          >
            {suppliers.map((sup) => (
              <option key={sup.id} value={sup.id}>
                {sup.name} ({sup.localCurrency})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content Dashboard */}
      <div className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[600px] md:max-h-[800px]">
        {/* Merchant Info Banner */}
        <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-200 font-bold text-sm">{activeSupplier.name}</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">{activeSupplier.location}, {activeSupplier.country}</p>
            <div className="flex items-center space-x-2 mt-2">
              <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-300 border border-slate-700 font-mono">
                Escrow ID: {activeSupplier.escrowAddress.substring(0, 12)}...
              </span>
              <span className="text-xs text-amber-500 font-bold">★ {activeSupplier.rating}</span>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center space-x-4">
            <div className="text-center px-1">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Corridor Anchor</div>
              <div className="text-xs text-cyan-400 font-mono font-bold mt-0.5">
                USDC ↔ {activeSupplier.localCurrency}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Locked Escrow Trades</div>
            <div className="text-2xl font-black text-amber-500 mt-1">{lockedEscrowsCount}</div>
            <div className="text-[10px] text-slate-500 mt-1">Awaiting delivery or QR release</div>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pending Settlement</div>
            <div className="text-2xl font-black text-slate-100 mt-1">${lockedAmountUSDC.toLocaleString()} <span className="text-xs font-normal text-slate-400">USDC</span></div>
            <div className="text-[10px] text-slate-500 mt-1">Settle immediately upon buyer release</div>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Completed (This Month)</div>
            <div className="text-2xl font-black text-emerald-500 mt-1">{settledCount}</div>
            <div className="text-[10px] text-slate-500 mt-1">Successful peer trade escrows</div>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Volume Settled</div>
            <div className="text-2xl font-black text-cyan-400 mt-1">
              {activeSupplier.localCurrency} {settledAmountLocal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Converted on-chain via local anchor</div>
          </div>
        </div>

        {/* Storefront Invoicing Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Store Catalog & QR Invoicing */}
          <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <FileText className="text-cyan-400" size={16} />
                <h3 className="font-bold text-slate-200">Storefront Catalog & QR Invoicing</h3>
              </div>
              <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-900 px-2.5 py-0.5 rounded-full font-bold">
                Scan-to-Pay Enabled
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Generate local invoice QR codes. When a trader is physically present or ordering remotely, they can scan this catalog item to lock funds immediately.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {activeSupplier.catalog.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-900 border border-slate-800/80 p-3.5 rounded-xl hover:border-slate-700 transition-all flex justify-between items-center group cursor-pointer"
                  onClick={() => {
                    // Create mock trade scenario
                    onAddLedgerEvent(
                      'CONTRACT_CALL',
                      'TradeEscrow',
                      'invoice_generation',
                      `Generated QR invoice for ${item.name}. Amount: ${item.priceUSDC} USDC / ${activeSupplier.localCurrency} ${item.priceLocal}`
                    );
                    alert(`QR Invoice for "${item.name}" printed! Have the Trader open "New Trade" page, select "${activeSupplier.name}" and enter $${item.priceUSDC} USDC to fund this escrow.`);
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{item.image}</span>
                    <div>
                      <div className="font-semibold text-slate-200 text-xs group-hover:text-amber-400 transition-colors">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {activeSupplier.localCurrency} {item.priceLocal.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className="text-xs text-slate-300 font-bold">${item.priceUSDC}</span>
                    <span className="text-[9px] bg-slate-800 text-cyan-400 px-1.5 py-0.5 rounded font-bold uppercase mt-1 flex items-center gap-1">
                      <QrCode size={10} /> QR Invoice
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* QR Code Detail Panel */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-between">
            <div className="text-center space-y-1 w-full">
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-200 text-xs">Dynamic Escrow QR</div>
                <button
                  onClick={() => setQrHighContrast((v) => !v)}
                  className={`text-[9px] font-bold px-2 py-0.5 rounded border transition-all uppercase tracking-wide ${
                    qrHighContrast
                      ? 'bg-yellow-400 text-slate-900 border-yellow-400'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                  }`}
                  title="Toggle high-contrast QR"
                >
                  {qrHighContrast ? 'High Contrast ON' : 'High Contrast'}
                </button>
              </div>
              <p className="text-[10px] text-slate-500">Scan code to pay merchant directly into trade escrow</p>
            </div>

            <div className={`p-4 rounded-xl my-4 flex items-center justify-center border-4 ${
              qrHighContrast
                ? 'bg-black border-yellow-400'
                : 'bg-white border-amber-500'
            }`}>
              {/* Simulated QR Code */}
              <div className="relative">
                <svg className={`w-28 h-28 ${qrHighContrast ? 'text-yellow-400' : 'text-slate-900'}`} viewBox="0 0 100 100">
                  <path d="M 0 0 h 30 v 10 h -20 v 20 h -10 Z M 70 0 h 30 v 30 h -10 v -20 h -20 Z M 0 70 h 10 v 20 h 20 v 10 h -30 Z M 90 70 v 20 h -20 v 10 h 30 v -30 Z" fill="currentColor"/>
                  <rect x="15" y="15" width="20" height="20" fill="currentColor"/>
                  <rect x="65" y="15" width="20" height="20" fill="currentColor"/>
                  <rect x="15" y="65" width="20" height="20" fill="currentColor"/>
                  <rect x="45" y="45" width="10" height="10" fill="currentColor"/>
                  <path d="M 40 15 h 5 v 20 h -5 Z M 45 65 h 10 v 5 h -10 Z M 75 45 h 10 v 5 h -10 Z M 45 45 h 5 v 5 h -5 Z" fill="currentColor"/>
                </svg>
                {/* Polaris Star center badge */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className={`p-1.5 rounded-full ${qrHighContrast ? 'bg-yellow-400 text-black' : 'bg-amber-500 text-slate-900'}`}>
                    <Store size={14} className="stroke-[2.5]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full">
              <div className="text-[10px] text-center text-slate-400 bg-slate-900 p-2 rounded-lg border border-slate-800">
                <div className="font-semibold text-[9px] uppercase tracking-wide text-amber-500">Scan Payload</div>
                <div className="font-mono text-[9px] text-slate-300 mt-0.5 select-all overflow-hidden truncate">
                  stellar:escrow?addr={activeSupplier.escrowAddress}&currency=USDC
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Incoming Trades & Settlements Table */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-slate-200">Incoming Trades & On-chain Escrows</h3>
            <span className="text-[10px] text-slate-500 font-mono">Filter: Live Indexer</span>
          </div>

          {/* Search + Status Filter Row */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={tradeSearch}
                onChange={(e) => setTradeSearch(e.target.value)}
                placeholder="Search trader name or tx hash..."
                className="w-full bg-slate-900 text-xs text-slate-100 border border-slate-800 rounded-xl pl-8 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder:text-slate-600"
              />
            </div>
            <div className="flex gap-1.5 shrink-0">
              {(['ALL', 'LOCKED', 'RELEASED', 'DISPUTED'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setTradeStatusFilter(status)}
                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide border transition-all ${
                    tradeStatusFilter === status
                      ? status === 'LOCKED'
                        ? 'bg-amber-950 text-amber-400 border-amber-900'
                        : status === 'RELEASED'
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-900'
                        : status === 'DISPUTED'
                        ? 'bg-red-950 text-red-400 border-red-900'
                        : 'bg-slate-700 text-slate-100 border-slate-600'
                      : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {isLoadingTrades ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800">
                    <th className="pb-3 font-semibold">Trader</th>
                    <th className="pb-3 font-semibold">Amount locked</th>
                    <th className="pb-3 font-semibold">Local Conversion</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Fulfillment / Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {[1, 2, 3].map((i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full bg-slate-800" />
                          <div className="space-y-1.5">
                            <div className="h-2.5 w-28 bg-slate-800 rounded" />
                            <div className="h-2 w-20 bg-slate-800/60 rounded" />
                          </div>
                        </div>
                      </td>
                      <td className="py-4"><div className="h-2.5 w-16 bg-slate-800 rounded" /></td>
                      <td className="py-4"><div className="h-2.5 w-20 bg-slate-800 rounded" /></td>
                      <td className="py-4"><div className="h-4 w-14 bg-slate-800 rounded" /></td>
                      <td className="py-4"><div className="h-6 w-28 bg-slate-800 rounded-lg" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : supplierTrades.length === 0 ? (
            <div className="text-center py-10 text-slate-500 flex flex-col items-center space-y-2">
              <Store size={28} className="text-slate-800" />
              <div className="font-semibold text-slate-400">No active incoming escrows</div>
              <p className="text-xs text-slate-500 max-w-sm">
                Have the trader open the **Trader Wallet (Mobile)**, select **New Trade**, pick **{activeSupplier.name}**, and lock some USDC.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800">
                    <th className="pb-3 font-semibold">Trader</th>
                    <th className="pb-3 font-semibold">Amount locked</th>
                    <th className="pb-3 font-semibold">Local Conversion</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Fulfillment / Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredTrades.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center">
                        {tradeStatusFilter === 'DISPUTED' ? (
                          <div className="flex flex-col items-center space-y-2">
                            <span className="text-2xl">🤝</span>
                            <div className="text-xs font-semibold text-slate-400">No disputes on record</div>
                            <p className="text-[10px] text-slate-500 max-w-[260px] leading-normal">
                              All trades are settling cleanly. Disputes are raised when a buyer flags a delivery issue within the 3-day window.
                            </p>
                            <button
                              onClick={() => setTradeStatusFilter('ALL')}
                              className="mt-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10px] px-3 py-1.5 rounded-lg uppercase tracking-wide transition-all"
                            >
                              View All Trades
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-xs">No trades match your search or filter.</span>
                        )}
                      </td>
                    </tr>
                  ) : filteredTrades.map((trade) => (
                    <React.Fragment key={trade.id}>
                    <tr
                      className="hover:bg-slate-900/40 cursor-pointer"
                      onClick={() => setExpandedRowId(expandedRowId === trade.id ? null : trade.id)}
                    >
                      <td className="py-4 font-semibold text-slate-200">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-300 border border-slate-700">
                            {trade.traderName.charAt(0)}
                          </div>
                          <div>
                            <div>{trade.traderName}</div>
                            <div className="text-[9px] text-slate-500 font-mono">
                              Tx: {trade.escrowTxHash.substring(0, 10)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className="text-slate-100 font-bold">${trade.amountUSDC.toLocaleString()}</span>
                        <span className="text-slate-400 text-[10px] ml-1">USDC</span>
                      </td>
                      <td className="py-4">
                        <span className="text-cyan-400 font-mono font-bold">
                          {trade.localCurrency} {trade.amountLocal.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-4">
                        {trade.status === 'DISPUTED' ? (
                          <button
                            onClick={() => setDisputeModal(trade)}
                            className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-400 border border-red-900 hover:bg-red-900 transition-colors cursor-pointer"
                            title="View dispute details"
                          >
                            {trade.status}
                          </button>
                        ) : (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              trade.status === 'LOCKED'
                                ? 'bg-amber-950 text-amber-400 border border-amber-900'
                                : 'bg-emerald-950 text-emerald-400 border border-emerald-900'
                            }`}
                          >
                            {trade.status}
                          </span>
                        )}
                      </td>
                      <td className="py-4">
                        {trade.status === 'LOCKED' ? (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                handleSettle(trade);
                              }}
                              className="bg-emerald-600 hover:bg-emerald-500 text-slate-900 font-bold px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wide flex items-center transition-all shadow-lg shadow-emerald-900/20"
                            >
                              Instant Settlement <ArrowRight size={10} className="ml-1" />
                            </button>
                            <button
                              onClick={() => {
                                alert(`Triggered Transport Union pickup confirmation for escrow trade #${trade.id.substring(0, 8)}... Awaiting buyer release code confirmation.`);
                                onAddLedgerEvent(
                                  'CONTRACT_CALL',
                                  'TradeEscrow',
                                  'request_transport_release',
                                  `Transport Union console triggered verification request for Escrow ${trade.id.substring(0, 8)}`
                                );
                              }}
                              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-2 py-1.5 rounded-lg text-[10px]"
                              title="Request delivery confirmation from Transport partner"
                            >
                              Dispatch Pickup
                            </button>
                          </div>
                        ) : trade.status === 'RELEASED' ? (
                          <div className="text-emerald-500 font-bold text-[10px] flex items-center space-x-1">
                            <CheckCircle2 size={12} />
                            <span>SETTLED VIA {trade.localCurrency} ANCHOR</span>
                          </div>
                        ) : (
                          <span className="text-red-500 text-[10px]">DISPUTE PENDING</span>
                        )}
                      </td>
                      <td className="py-4 text-right">
                        {expandedRowId === trade.id
                          ? <ChevronUp size={13} className="text-slate-500 ml-auto" />
                          : <ChevronDown size={13} className="text-slate-600 ml-auto" />
                        }
                      </td>
                    </tr>
                    {expandedRowId === trade.id && (
                      <tr className="bg-slate-900/60">
                        <td colSpan={6} className="px-4 pb-4 pt-2">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[10px]">
                            <div>
                              <div className="text-slate-500 uppercase tracking-wider font-bold mb-0.5">Full Tx Hash</div>
                              <div className="text-slate-300 font-mono break-all">{trade.escrowTxHash}</div>
                            </div>
                            <div>
                              <div className="text-slate-500 uppercase tracking-wider font-bold mb-0.5">Verification</div>
                              <div className="text-slate-300">{trade.verificationMethod.replace('_', ' ')}</div>
                            </div>
                            <div>
                              <div className="text-slate-500 uppercase tracking-wider font-bold mb-0.5">Dispute Window</div>
                              <div className="text-slate-300">{trade.disputeWindowDays} days</div>
                            </div>
                            <div>
                              <div className="text-slate-500 uppercase tracking-wider font-bold mb-0.5">Created</div>
                              <div className="text-slate-300">{trade.createdAt}</div>
                            </div>
                            {trade.releasedAt && (
                              <div>
                                <div className="text-slate-500 uppercase tracking-wider font-bold mb-0.5">Released</div>
                                <div className="text-emerald-400">{trade.releasedAt}</div>
                              </div>
                            )}
                            <div>
                              <div className="text-slate-500 uppercase tracking-wider font-bold mb-0.5">Supplier ID</div>
                              <div className="text-slate-300 font-mono">{trade.supplierId}</div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Dispute Detail Modal */}
      {disputeModal && (() => {
        const details = getDisputeDetails(disputeModal);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-red-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
              {/* Modal header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertTriangle size={16} className="text-red-400" />
                  <span className="text-sm font-black text-red-400 uppercase tracking-wider">Dispute Filed</span>
                </div>
                <button
                  onClick={() => setDisputeModal(null)}
                  className="text-slate-500 hover:text-slate-200 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Trade info */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Trader</span>
                  <span className="text-slate-200 font-bold">{disputeModal.traderName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount</span>
                  <span className="text-slate-200 font-bold">${disputeModal.amountUSDC} USDC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tx Hash</span>
                  <span className="text-slate-400 font-mono text-[10px]">{disputeModal.escrowTxHash.substring(0, 14)}...</span>
                </div>
              </div>

              {/* Dispute details */}
              <div className="space-y-2">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Dispute Reason</div>
                <p className="text-xs text-slate-300 leading-relaxed bg-red-950/20 border border-red-900/40 rounded-xl p-3">
                  {details.reason}
                </p>
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-500">Raised by: <strong className="text-slate-300">{details.raisedBy}</strong></span>
                  <span className="text-slate-500">{details.timestamp}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => { setDisputeModal(null); setDisputeConfirmPending(false); }}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 rounded-xl text-[10px] uppercase tracking-wide transition-all"
                >
                  Close
                </button>
                {disputeConfirmPending ? (
                  <div className="flex-1 flex gap-1.5">
                    <button
                      onClick={() => setDisputeConfirmPending(false)}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 rounded-xl text-[10px] uppercase transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        onAddLedgerEvent(
                          'CONTRACT_CALL',
                          'TradeEscrow',
                          'escalate_dispute',
                          `Dispute escalated to on-chain arbitration for trade ${disputeModal.id.substring(0, 8)}. Funds frozen pending mediator ruling.`
                        );
                        setDisputeModal(null);
                        setDisputeConfirmPending(false);
                      }}
                      className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded-xl text-[10px] uppercase tracking-wide transition-all"
                    >
                      Confirm
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDisputeConfirmPending(true)}
                    className="flex-1 bg-red-950 hover:bg-red-900 text-red-400 border border-red-900 font-bold py-2 rounded-xl text-[10px] uppercase tracking-wide transition-all"
                  >
                    Escalate to Arbitration
                  </button>
                )}
              </div>
              {disputeConfirmPending && (
                <p className="text-[9px] text-red-400 text-center font-bold animate-pulse">
                  This will freeze funds and notify the on-chain mediator. Are you sure?
                </p>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
};

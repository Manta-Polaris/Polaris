import React, { useEffect, useState, useRef } from 'react';
import { LedgerEvent } from '../types';
import { Terminal, Shield, Network, Zap, CheckCircle, RefreshCw, Copy, Check } from 'lucide-react';

interface NetworkLedgerProps {
  events: LedgerEvent[];
  onClear: () => void;
}

export const NetworkLedger: React.FC<NetworkLedgerProps> = ({ events, onClear }) => {
  const [ledgerNumber, setLedgerNumber] = useState(5891402);
  const [blockTime, setBlockTime] = useState(4.2);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copyToast, setCopyToast] = useState<boolean>(false);
  const [eventTypeFilter, setEventTypeFilter] = useState<'ALL' | 'CONTRACT_CALL' | 'SEP24_FUNDING' | 'PATH_PAYMENT' | 'ZK_VERIFY' | 'ESCROW_RELEASE'>('ALL');
  const [now, setNow] = useState(() => Date.now());
  const eventTimesRef = useRef<Record<string, number>>({});
  const logEndRef = useRef<HTMLDivElement>(null);

  // Track when each event first appears
  useEffect(() => {
    events.forEach((evt) => {
      if (!eventTimesRef.current[evt.id]) {
        eventTimesRef.current[evt.id] = Date.now();
      }
    });
  }, [events]);

  // Tick every 30s so relative labels stay fresh
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  const toRelative = (evtId: string, fallback: string): string => {
    const ts = eventTimesRef.current[evtId];
    if (!ts) return fallback;
    const secs = Math.floor((now - ts) / 1000);
    if (secs < 60) return 'just now';
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const handleCopy = (txHash: string, evtId: string) => {
    navigator.clipboard.writeText(txHash).then(() => {
      setCopiedId(evtId);
      setCopyToast(true);
      setTimeout(() => {
        setCopiedId(null);
        setCopyToast(false);
      }, 1500);
    });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setLedgerNumber((prev) => prev + 1);
      setBlockTime(4.0 + Math.random() * 1.5);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [events]);

  return (
    <div className="relative bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-full font-mono text-xs">
      {/* Copy toast */}
      {copyToast && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 bg-slate-800 border border-emerald-700 text-emerald-400 text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center space-x-1.5 shadow-lg pointer-events-none">
          <Check size={11} />
          <span>Tx hash copied!</span>
        </div>
      )}
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-slate-300 font-bold tracking-tight">SOROBAN & STELLAR LEDGER</span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-1.5 text-slate-400">
            <Network size={13} className="text-cyan-400" />
            <span>Ledger: <strong className="text-slate-200">#{ledgerNumber}</strong></span>
          </div>
          <div className="hidden sm:flex items-center space-x-1.5 text-slate-400">
            <Zap size={13} className="text-amber-400 animate-pulse" />
            <span>Block Time: <strong className="text-slate-200">{blockTime.toFixed(1)}s</strong></span>
          </div>
          <button
            onClick={onClear}
            className="text-slate-400 hover:text-white hover:bg-slate-800 px-2 py-1 rounded transition-colors text-[10px]"
          >
            Clear Log
          </button>
        </div>
      </div>

      {/* Filter chips */}
      <div className="px-4 py-2 border-b border-slate-800/60 flex items-center gap-1.5 flex-wrap bg-slate-900/40">
        {([
          { key: 'ALL',           label: 'All',         color: 'bg-slate-700 text-slate-200 border-slate-600' },
          { key: 'CONTRACT_CALL', label: 'Soroban',     color: 'bg-indigo-950 text-indigo-400 border-indigo-900' },
          { key: 'ZK_VERIFY',     label: 'ZK Verify',   color: 'bg-violet-950 text-violet-400 border-violet-900' },
          { key: 'PATH_PAYMENT',  label: 'Path Pay',    color: 'bg-cyan-950 text-cyan-400 border-cyan-900' },
          { key: 'ESCROW_RELEASE',label: 'Escrow',      color: 'bg-emerald-950 text-emerald-400 border-emerald-900' },
          { key: 'SEP24_FUNDING', label: 'SEP-24',      color: 'bg-amber-950 text-amber-400 border-amber-900' },
        ] as const).map(({ key, label, color }) => {
          const count = key === 'ALL' ? events.length : events.filter(e => e.type === key).length;
          return (
            <button
              key={key}
              onClick={() => setEventTypeFilter(key)}
              className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-all flex items-center gap-1 ${
                eventTypeFilter === key
                  ? color
                  : 'bg-slate-900 text-slate-600 border-slate-800 hover:text-slate-400'
              }`}
            >
              {label}
              <span className={`text-[8px] font-black ${eventTypeFilter === key ? 'opacity-80' : 'opacity-50'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Terminal View */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 max-h-[300px] md:max-h-[450px]">
        {events.length === 0 ? (
          <div className="text-slate-500 text-center py-8 flex flex-col items-center space-y-2">
            <Terminal size={24} className="text-slate-700 animate-pulse" />
            <span>Listening for on-chain events and smart contract calls...</span>
            <span className="text-[10px] text-slate-600">Fund a trade, join a guild, or generate ZK-proofs to see Soroban contracts execute.</span>
          </div>
        ) : (
          (() => {
            const filteredEvents = eventTypeFilter === 'ALL'
              ? events
              : events.filter(e => e.type === eventTypeFilter);

            if (filteredEvents.length === 0) {
              return (
                <div className="text-slate-600 text-center py-6 text-[10px]">
                  No events match the selected filter.
                </div>
              );
            }

            return filteredEvents.map((evt) => {
            let badgeBg = 'bg-slate-800 text-slate-300';
            let label = evt.type;
            if (evt.type === 'CONTRACT_CALL') {
              badgeBg = 'bg-indigo-950/80 text-indigo-400 border border-indigo-900';
              label = 'SOROBAN CALL';
            } else if (evt.type === 'ZK_VERIFY') {
              badgeBg = 'bg-violet-950/80 text-violet-400 border border-violet-900';
              label = 'ZK VERIFIER';
            } else if (evt.type === 'PATH_PAYMENT') {
              badgeBg = 'bg-cyan-950/80 text-cyan-400 border border-cyan-900';
              label = 'PATH PAYMENT';
            } else if (evt.type === 'ESCROW_RELEASE') {
              badgeBg = 'bg-emerald-950/80 text-emerald-400 border border-emerald-900';
              label = 'ESCROW ACTION';
            } else if (evt.type === 'SEP24_FUNDING') {
              badgeBg = 'bg-amber-950/80 text-amber-400 border border-amber-900';
              label = 'SEP-24 ANCHOR';
            }

            return (
              <div
                key={evt.id}
                className="p-3 bg-slate-900/50 border border-slate-900 rounded-xl hover:border-slate-800 transition-colors space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${badgeBg}`}>
                      {label}
                    </span>
                    <span
                      className="text-slate-400 text-[10px] cursor-default"
                      title={evt.timestamp}
                    >
                      {toRelative(evt.id, evt.timestamp)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-[10px]">
                    <span className="text-emerald-500 flex items-center">
                      <CheckCircle size={10} className="mr-1" /> Verified
                    </span>
                  </div>
                </div>

                <div className="text-slate-200">
                  <span className="text-slate-500 font-bold">{evt.contract} → {evt.method}()</span>
                  <p className="text-slate-300 mt-1 pl-2 border-l-2 border-slate-700 leading-relaxed text-xs">
                    {evt.details}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                  <span className="flex items-center space-x-1.5">
                    <span>Tx: <strong className="text-slate-400">{evt.txHash.substring(0, 16)}...</strong></span>
                    <button
                      onClick={() => handleCopy(evt.txHash, evt.id)}
                      className="text-slate-600 hover:text-slate-300 transition-colors p-0.5 rounded"
                      title="Copy full tx hash"
                    >
                      {copiedId === evt.id
                        ? <Check size={11} className="text-emerald-400" />
                        : <Copy size={11} />
                      }
                    </button>
                  </span>
                  <span className="text-slate-600 hover:text-slate-400 cursor-pointer">View on Stellarexp...</span>
                </div>
              </div>
            );
          });
          })()
        )}
        <div ref={logEndRef} />
      </div>

      {/* Network Stats Footer */}
      <div className="bg-slate-900/40 border-t border-slate-800 px-4 py-2 flex justify-between text-slate-500 text-[10px]">
        <div className="flex items-center space-x-3">
          <span>Stellar Mainnet Core</span>
          <span className="text-slate-700">|</span>
          <span className="flex items-center text-cyan-500">
            <RefreshCw size={10} className="animate-spin mr-1" /> Soroban VM Active
          </span>
        </div>
        <div className="flex items-center space-x-1 text-slate-400">
          <Shield size={10} className="text-emerald-500" />
          <span>BLS12-381 ZK Engine Ready</span>
        </div>
      </div>
    </div>
  );
};

# Polaris

Polaris is a trade escrow platform built on Stellar that helps Africa's informal traders move money across borders safely, build a portable trade reputation, and unlock credit — all backed by blockchain-powered escrow and smart contracts.

Cross-border trade in informal markets runs on trust that doesn't travel. A trader with years of reliable deals in one corridor has no way to prove it to a new buyer, a new lender, or a new market. Polaris fixes that by turning every completed trade into verifiable, on-chain reputation, and by using programmable escrow so payment only releases when both sides hold up their end.

## Why Polaris

- **Payment risk** — buyers and sellers in informal cross-border trade often have no recourse if the other side doesn't deliver or doesn't pay.
- **Invisible reputation** — a trader's track record lives in memory and word of mouth, not anywhere a new counterparty or lender can check it.
- **Locked-out credit** — without formal records, reliable traders can't access financing, even when their trade history would justify it.

Polaris addresses each of these with a single connected system: escrow for the transaction, reputation for the track record, and credit for the payoff.

## Core features

**Escrow payment rail** — Funds are locked in a Soroban smart contract at the start of a trade and released automatically when delivery conditions are met, with a dispute process for when they aren't.

**Guild group-buying pools** — Traders pool orders together to hit supplier minimums and negotiate better terms, with shared visibility into pool status and participation.

**ZK trade-reputation credit marketplace** — Completed trades build a reputation score that traders can prove using zero-knowledge proofs — showing lenders they're creditworthy without exposing the underlying trade details.

**Supplier Portal** — A searchable, filterable view of trades for suppliers managing multiple buyers and orders at once.

**Soroban Ledger feed** — A live, filterable feed of on-chain escrow events, with copyable transaction hashes for audit and reference.

**Offline-ready signing** — Trades can be signed offline and queued, so connectivity gaps in the field don't block a transaction.

## Tech stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Smart contracts:** Soroban (Rust), on Stellar
- **Reputation layer:** Zero-knowledge proofs over on-chain trade history

## Project status

Polaris is an active prototype. The frontend and core interaction flows — escrow, guild pools, ledger feed, reputation tiers, and disputes — are in place and evolving. Smart contract integration and the credit marketplace are ongoing work.

## Getting started

```bash
git clone https://github.com/Manta-Polaris/polaris.git
cd polaris
npm install
npm run dev
```

## Contributing

Polaris is open source and open to contributors. Issues and pull requests are welcome — check open issues for good starting points.

## License

[Add license here]
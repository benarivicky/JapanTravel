# Abuse Report — Cryptojacking Botnet Payout Wallet on MoneroOcean

**Report date:** 2026-07-08
**Reporter:** Amit Kuzi — owner/operator of the compromised host (amitkuzi@gmail.com)
**Nature:** Unauthorized cryptomining (cryptojacking) via remote code execution on my server. This report requests suspension of the payout wallet and preservation of records.

---

## 1. The wallet to act on

```
492zTyp9mMSZK9FbXJzruWUZNmovsaES4CuEgAUw8MhhF9QrfYMbdUWPATRGDyDJCW4Yqc1fJTFkGPvKR9Xm4riNJTtnewy
```

- Type: Monero (XMR) mainnet standard address (95-char, `4…`).
- Role: the **payout/login address** configured in the malware that was planted on my server. On MoneroOcean the mining address *is* the account, so this address identifies the operator's pool account.

## 2. Proof the wallet is an active botnet account (independently verifiable)

MoneroOcean's own public API reports the following for this address (query it yourself — see Appendix). Snapshot taken 2026-07-08:

| Metric | Value | What it means |
|---|---|---|
| Live hashrate | **~822,608 H/s (≈0.82 MH/s), rx/0** | Far beyond one machine. On RandomX a typical PC/server does ~1–5 kH/s, so this implies **several hundred infected hosts** mining to one wallet. |
| Total hashes | **103,296,471,045** (~103 billion) | Long-running, large-scale operation. |
| Valid shares | **2,921,852** | Sustained submission over time. |
| Amount due (held by pool, unpaid) | **70,580,769,348 atomic = 0.0706 XMR** | Below payout threshold — **still sitting in the pool balance, not yet withdrawn.** |
| Amount paid | **0** (txnCount 0) | No payout has occurred yet — this is the window where suspending/forfeiting the balance is most effective. |
| Last share | unix **1783517483** (≈2026-07-08) | **Mining right now.** |

A single hashrate string like this, fed by one wallet, aggregating hundreds of hosts, is the signature of a cryptojacking botnet rather than legitimate mining.

## 3. Proof it was planted on my server without authorization

- My host `japantravel-app` (a Next.js web app) was compromised via remote code execution. The attacker ran reconnaissance commands, then downloaded and launched an XMRig miner.
- The miner's config file (recovered from the host at `/var/tmp/config.json`) points to **exactly this wallet and this pool**:
  - `"url": "gulf.moneroocean.stream:10016"`
  - `"user": "492zTyp9mMSZK9FbXJzruWUZNmovsaES4CuEgAUw8MhhF9QrfYMbdUWPATRGDyDJCW4Yqc1fJTFkGPvKR9Xm4riNJTtnewy"`
  - `"pass": "x"`, `"coin": "XMR"`, `"donate-level": 0`
- The pool worker identifier observed (`x`) matches the config's `pass` field, tying my host's mining activity to the wallet's pool account.

## 4. Indicators of Compromise (IOCs)

| Type | Value |
|---|---|
| Payout wallet | `492zTyp9mMSZK9FbXJzruWUZNmovsaES4CuEgAUw8MhhF9QrfYMbdUWPATRGDyDJCW4Yqc1fJTFkGPvKR9Xm4riNJTtnewy` |
| Mining pool / port | `gulf.moneroocean.stream:10016` (stratum) |
| Stratum server IP (observed outbound) | `45.155.102.89:10016` |
| Miner binary | `/var/tmp/system-check` — 8,005,121 bytes (XMRig, RandomX) |
| Config / log | `/var/tmp/config.json`, `/var/tmp/system-check.log` |
| Payload delivery host | `github.com` → `raw.githubusercontent.com` (185.199.111.133) |
| Worker / pass | worker-id `worker1`; pool worker `x` |
| Victim host | `japantravel-app` (Next.js 15.3.3), behind Caddy |

## 5. Timeline (UTC)

- **2026-07-07 01:56** — attacker recon: `uname`, `env` (leaked all my environment variables), `ls -R` of the app directory. Output surfaced in the app's error logs as `NEXT_REDIRECT` digests.
- **2026-07-07 13:25:28** — XMRig (`system-check`, 7,817 KB) and `config.json` downloaded from GitHub to `/var/tmp`; miner launched.
- **2026-07-08** — detected (container at ~400% CPU); miner killed, host rebuilt and hardened. Wallet confirmed still mining pool-side.

## 6. What I am requesting

**To MoneroOcean (pool operator):**
1. **Suspend/withhold payout** to the wallet above and **blacklist** it for botnet mining, per your abuse policy.
2. **Preserve records** associated with this account for law enforcement: login IP addresses, worker list, share history, and any payout destination(s).
3. Confirm receipt and any action taken.

**To GitHub (payload host):** take down the repository/account hosting the `system-check` XMRig binary and `config.json`, and preserve account records (the account that hosted the payload is the strongest lead to the operator's identity). Report via https://github.com/contact/report-abuse with this document and the 2026-07-07 13:25 UTC timeframe.

**To the hosting provider of 45.155.102.89:** informational abuse notice (this is the pool's stratum server, not the operator).

## 7. Important note on scope (what is and isn't possible)

- **The Monero network cannot ban an address.** Monero is decentralized; no protocol authority can freeze or block a wallet. Per the official Monero response guidance: *"You can contact the pool and ask them to suspend payment to this certain address… Many pools blacklist addresses used for botnet mining."* The **mining pool** is therefore the only party that can act on the wallet — which is why this report is addressed to MoneroOcean.
- **The wallet is not traceable on-chain.** Monero's ring signatures, stealth addresses, and confidential amounts mean the address reveals no balance, no transaction history, and no counterparties. Identity can realistically only come from **off-chain records** (pool login IPs, GitHub account data), obtainable by **law enforcement via legal process**.

## 8. Appendix — independent verification

Anyone can confirm the wallet's live activity without special access:

- `https://api.moneroocean.stream/miner/492zTyp9mMSZK9FbXJzruWUZNmovsaES4CuEgAUw8MhhF9QrfYMbdUWPATRGDyDJCW4Yqc1fJTFkGPvKR9Xm4riNJTtnewy/stats`
- `https://api.moneroocean.stream/miner/492zTyp9mMSZK9FbXJzruWUZNmovsaES4CuEgAUw8MhhF9QrfYMbdUWPATRGDyDJCW4Yqc1fJTFkGPvKR9Xm4riNJTtnewy/stats/allWorkers`
- Dashboard: `https://moneroocean.stream/#/dashboard` (paste the address)

---

*Prepared by the host owner as a cryptojacking victim. All figures above are reproducible from the public API at the time of writing.*

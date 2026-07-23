# Security Incident — Cryptominer in japantravel-app

**Detected:** 2026-07-08 · **Compromise:** 2026-07-07 (recon 01:56 UTC, miner deployed 13:25 UTC)
**Severity:** Critical — remote code execution + credential exposure

## What happened
The `japantravel-app` container was running an XMRig Monero cryptominer at ~400% CPU
(disguised as `/var/tmp/system-check`, child of the Next.js `next-server` process).
It was downloaded from GitHub/raw.githubusercontent.com and connected to a mining pool.

Container logs show the attacker first ran reconnaissance commands (`uname`, `env`, `ls`,
`cat`) whose output surfaced as `NEXT_REDIRECT` digests, then pulled and launched the miner.
The `env` dump means **every environment variable was exfiltrated**.

## Indicators of Compromise (IOCs)
- Malicious files (removed): `/var/tmp/system-check` (8 MB XMRig), `/var/tmp/config.json`, `/var/tmp/system-check.log`
- Mining pool: `gulf.moneroocean.stream:10016` — outbound to `45.155.102.89:10016`
- Monero wallet: `492zTyp9mMSZK9FbXJzruWUZNmovsaES4CuEgAUw8MhhF9QrfYMbdUWPATRGDyDJCW4Yqc1fJTFkGPvKR9Xm4riNJTtnewy`
- Download hosts: github.com / raw.githubusercontent.com (GitHub-hosted payload)

## Likely entry vector
`src/app/api/link-preview/route.ts` fetched any user-supplied URL server-side with no
internal-address filtering (SSRF). Combined with an old Next.js (15.3.3), this is the
plausible path to RCE. Exact exploit not fully reconstructed from logs.

## Remediation applied
1. Killed miner, removed its files.
2. Rebuilt image and recreated the container from clean state.
3. Upgraded Next.js 15.3.3 → 15.5.20.
4. Added SSRF guard to link-preview (blocks private/reserved/metadata IPs, revalidates every redirect hop).
5. Hardened the container: `no-new-privileges`, `cap_drop: ALL`, `read_only` rootfs,
   `noexec` tmpfs for `/tmp` `/var/tmp` `/app/.next/cache` (noexec is what now stops a
   dropped binary from running).

## Still required (owner action)
- **Rotate all leaked secrets** — `GOOGLE_MAPS_API_KEY` and any Firebase Admin / GCP
  service-account credentials the container held. The `NEXT_PUBLIC_*` Firebase keys are
  public by design but review Firestore rules regardless.
  (`GOOGLE_AI_API_KEY` was also in the leaked env dump but the Google AI / Genkit feature
  has since been removed from the app — the key is gone from all config, so revoke the old
  key in GCP and no replacement is needed.)
- Review Firestore/Storage for unauthorized access around 2026-07-07.
- Consider adding egress firewall rules (the app only needs Google APIs + arbitrary HTTP
  for previews — a miner reaching a stratum pool on :10016 should be blockable).
- Follow up on remaining `npm audit` criticals in the Genkit/gRPC/Handlebars tree.

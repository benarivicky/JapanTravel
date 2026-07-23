# Abuse Report — Where to send it + ready-to-send drafts

Companion to [ABUSE-REPORT-moneroocean.md](ABUSE-REPORT-moneroocean.md). All channels below are **free**.

## Recipient list (send in this priority order)

| # | Recipient | Address / channel | Purpose |
|---|-----------|-------------------|---------|
| 1 | **MoneroOcean** (pool operator) | No public email. Use: GitHub issue at https://github.com/moneroocean · Discord https://discord.com/invite/jXaR2kA · X/Twitter @MoneroOcean | Suspend payout to the wallet + blacklist it + preserve records |
| 2 | **GitHub Abuse/Trust & Safety** | Web form: https://github.com/contact/report-abuse (category: *malware or exploits*) | Take down the repo/account hosting the miner; preserve records (best identity lead) |
| 3 | **CERT-IL** (מערך הסייבר הלאומי) | 119@cyber.gov.il · phone **119** (24/7) | National incident report + the only body that can pursue identity via legal process |
| 4 | **Hostkey B.V.** (stratum server host) | abuse@hostkey.nl | Informational notice re 45.155.102.89 (pool infra, not the operator) |

> Attach or paste the full brief ([ABUSE-REPORT-moneroocean.md](ABUSE-REPORT-moneroocean.md)) to each. Drafts below are self-contained if you'd rather send them as-is.

---

## Draft 1 — MoneroOcean (GitHub issue title + body, or Discord message)

**Title:** Abuse report — cryptojacking botnet payout wallet, request payout suspension

> Hello MoneroOcean team,
>
> I am the owner of a server that was compromised via remote code execution and used, without my authorization, to mine XMR to your pool. I'm requesting action on the operator's payout wallet.
>
> **Wallet:** `492zTyp9mMSZK9FbXJzruWUZNmovsaES4CuEgAUw8MhhF9QrfYMbdUWPATRGDyDJCW4Yqc1fJTFkGPvKR9Xm4riNJTtnewy`
>
> This is the exact address hard-coded in the XMRig config planted on my host (`gulf.moneroocean.stream:10016`, worker `x`). Your public API shows it aggregating **~822 kH/s across what appears to be several hundred hosts** (`totalHashes` ~103 billion, **amtDue 0.0706 XMR, amtPaid 0** — nothing withdrawn yet), still submitting shares today. This is a cryptojacking botnet, not legitimate mining. Verify:
> `https://api.moneroocean.stream/miner/492zTyp9mMSZK9FbXJzruWUZNmovsaES4CuEgAUw8MhhF9QrfYMbdUWPATRGDyDJCW4Yqc1fJTFkGPvKR9Xm4riNJTtnewy/stats`
>
> **I request that you:**
> 1. Suspend/withhold payout to this address and blacklist it for botnet mining, per your abuse policy.
> 2. Preserve, for law enforcement, the account's login IP addresses, worker list, and share/payout history.
> 3. Confirm receipt and any action taken.
>
> A full incident brief with IOCs and timeline is available on request. Thank you.
> — Amit Kuzi (amitkuzi@gmail.com)

---

## Draft 2 — GitHub Abuse (paste into https://github.com/contact/report-abuse)

> **Category:** Malware or exploits
>
> On 2026-07-07 13:25 UTC, a server I own was exploited and made to download an XMRig cryptominer and its config from GitHub (host `github.com` redirecting to `raw.githubusercontent.com`). The files:
> - `system-check` — XMRig binary, exactly 8,005,121 bytes
> - `config.json` — miner config containing the Monero wallet `492zTyp9mMSZK9FbXJzruWUZNmovsaES4CuEgAUw8MhhF9QrfYMbdUWPATRGDyDJCW4Yqc1fJTFkGPvKR9Xm4riNJTtnewy` and pool `gulf.moneroocean.stream:10016`
>
> I do not have the exact repository path (my host's log recorded only the hostname), but the `config.json` embeds the wallet string above, which should let you locate the hosting repo/account via code search. I request that GitHub:
> 1. Remove the repository/account hosting this malware.
> 2. Preserve the account's records (email, signup/access IPs) for law enforcement — this is the strongest lead to the operator's identity.
>
> This is part of an active cryptojacking botnet (~822 kH/s, several hundred victims). I'm filing a parallel report with CERT-IL (Israel). Contact: Amit Kuzi, amitkuzi@gmail.com.

---

## Draft 3 — CERT-IL / מערך הסייבר הלאומי (email to 119@cyber.gov.il)

**נושא:** דיווח על אירוע סייבר — פריצה לשרת והרצת כורה מטבעות (cryptojacking), בקשה להכוונה

> שלום,
>
> ברצוני לדווח על אירוע סייבר. שרת בבעלותי (אפליקציית ווב מבוססת Next.js, בשם japantravel-app) נפרץ באמצעות הרצת קוד מרחוק, ובתאריך 07.07.2026 בשעה 13:25 (UTC) הותקן והופעל עליו כורה מטבעות מסוג XMRig שכרה מטבע Monero לטובת התוקף, ללא ידיעתי ורשותי. במהלך הפריצה נחשפו כל משתני הסביבה של השרת, כולל מפתחות API (בוצעה החלפת מפתחות).
>
> **פרטי התוקף / IOCs:**
> - ארנק Monero (כתובת תשלום של התוקף): `492zTyp9mMSZK9FbXJzruWUZNmovsaES4CuEgAUw8MhhF9QrfYMbdUWPATRGDyDJCW4Yqc1fJTFkGPvKR9Xm4riNJTtnewy`
> - Pool כרייה: gulf.moneroocean.stream:10016 (שרת stratum: 45.155.102.89, מתארח ב-Hostkey B.V.)
> - הפוגען הורד מ-GitHub / raw.githubusercontent.com (בינארי XMRig בגודל 8,005,121 בתים)
> - הארנק פעיל כרגע ומצרף ~822 kH/s ממאות מכונות נגועות (ניתן לאימות ב-API הציבורי של MoneroOcean)
>
> **בקשתי:** הכוונה לגבי המשך הטיפול, ופתיחת ערוץ מול הגורמים הרלוונטיים (MoneroOcean, GitHub) לצורך שימור רשומות וחשיפת זהות התוקף בהליך חוקי. מצורף תיעוד אירוע מלא עם ראיות.
>
> בברכה,
> עמית קוזי — amitkuzi@gmail.com

---

## Draft 4 — Hostkey B.V. (email to abuse@hostkey.nl) — informational

> **Subject:** Abuse notice — cryptojacking pool traffic to 45.155.102.89:10016
>
> Hello,
>
> For your awareness: a server I own was compromised and forced to mine cryptocurrency, connecting outbound to **45.155.102.89:10016** (the `gulf.moneroocean.stream` stratum endpoint) on 2026-07-07. I understand this IP is the mining pool's infrastructure, not the attacker's, so this is informational — the abusive party is the pool account holder, whom I'm also reporting to the pool operator and to law enforcement.
>
> IOCs: XMRig miner (8,005,121 bytes), pool `gulf.moneroocean.stream:10016`, Monero wallet `492zTyp9mMSZK9FbXJzruWUZNmovsaES4CuEgAUw8MhhF9QrfYMbdUWPATRGDyDJCW4Yqc1fJTFkGPvKR9Xm4riNJTtnewy`.
>
> Regards, Amit Kuzi — amitkuzi@gmail.com

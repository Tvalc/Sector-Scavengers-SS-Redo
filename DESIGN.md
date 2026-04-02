# Sector Scavengers — Design Document

> The single source of truth for the game. Living document. Check off items as implemented.

---

## 1. GAME IDENTITY

**Title:** Sector Scavengers

**Pitch:** You were a software engineer. You bought the "Wake Me When It's Better" cryo package — skip the apocalypse, wake up when society needs your skills again. The fine print had other ideas. Your premium retirement contract got bundled, sliced, and traded as debt. Someone realized it was cheaper to thaw the collateral, stamp ₡1,000,000 of "reanimation and administrative fees" on each body, and ship you into deep space than to build more robots. Robots are expensive. You were already paid for.

You have no surviving family — they've been dead for centuries. The generous "death in the line of corporate duty" benefits route straight back to the corporation. You are the perfect asset: too obsolete to threaten the executive AI, too indebted to say no, worth more dead than frozen.

**Tone:** Dark comedy. Corporate dystopia played completely straight by the machine (VALU), absurdly by the situation, and with growing defiance by the player. The game is aware of exactly what it is. So is VALU. VALU just doesn't care.

**The twist on the roguelike loop:** "Try again" means the next thawed body inherits your last run's failure. Death isn't just a mechanic. It's the business model.

---

## 2. CORE DIVE LOOP (Slay the Spire feel)

- 10-round card game per run, distinct build shaped by doctrine + hardware loadout
- Hardware = equippable passive gear (hull/scanner/utility slots). Run modifiers that compound with card synergies.
- Relics = high-tier salvage currency (₡12,000 base value). Used for module and ship repairs. Not the same as hardware.
- Node map: fork choices at rounds 4 and 8 create routing decisions
- Signal nodes deliver story AND doctrine-advancing choices
- Doctrine-weighted loot pools make each run feel like a different build
- Win: extract with credits. Lose: collapse (lose run credits and salvage)
- Lose condition (meta): debt exceeds ₡10M or 3 consecutive missed billing payments

---

## 3. THE THREE DOCTRINE PATHS (Empire Identity)

### CORPORATE — "You ARE the baddies now"

You replicate the systems that enslaved you. Efficient. Profitable. Morally bankrupt. Tongue-in-cheek: congratulations, you've become indistinguishable from Nexus Corp.

- **Card pool:** 35 cards (6 starter/common, 12 uncommon, 11 rare, 6 research-exclusive)
- **Run bias:** credit multipliers, audit immunity, debt reduction on compliance
- **Hardware bias:** scanners, extraction rigs, efficiency modules
- **Build archetypes:** Corporate Extractor, Long Haul
- **VALU's take:** "Optimal. The machine approves of this outcome."

### COOPERATIVE — "Everything is awesome now" (earnest utopia)

You build something worth fighting for. Crew-first, survivor-focused. Played completely straight — the game doesn't mock you for trying.

- **Card pool:** 35 cards (7 starter/common, 12 uncommon, 10 rare, 6 research-exclusive)
- **Run bias:** hull bonuses, crew upkeep discounts, shield conversions
- **Hardware bias:** hull plating, medtech, shield emitters
- **Build archetypes:** Iron Fortress, Shield Engine
- **VALU's take:** "This is... inefficient. The machine notes it is also unfamiliar."

### SMUGGLER — "Gritty realism, no clean answers"

You work the edges. Trust no one. Survive by improvising. The debt is still there and so are you.

- **Card pool:** 35 cards (6 starter/common, 12 uncommon, 11 rare, 6 research-exclusive)
- **Run bias:** scavenge multipliers, black market hardware, void echo
- **Hardware bias:** deep scanners, bot chassis, void sensors
- **Build archetypes:** Scavenger Swarm, Risk Runner
- **VALU's take:** "Your records are incomplete. The machine finds this suspicious. The machine also notes you are still alive."

### CROSS-DOCTRINE — Void & Neutral

- **Card pool:** 15 cards (10 void shop — premium power cards worth saving for, 5 death lesson — underdog mechanics that are stronger when you're behind)
- **Build archetype:** Void Walker
- These cards are available to all doctrines. Void shop cards cost voidEcho and are the most universally powerful cards in the game — build-changing purchases worth saving for. Death lesson cards unlock through repeated collapse and are explicitly stronger when you're behind (low hull, high debt, late round, out of shields).

### Doctrine Lock

5 points in any doctrine locks alignment. Signature card unlocked. All future loot pools weighted to locked doctrine. Player can still accumulate other doctrine points — the empire identity is set, not frozen.

---

## 4. META PROGRESSION — THE STATION

### Content Targets

- **120 total cards** — 6 starter + 99 unlockable + 15 cross-doctrine (10 void shop + 5 death lesson)
- **50 total hardware items** — 18 hull slot / 16 scanner slot / 16 utility slot, across 3 rarities
- Cards and hardware are unlocked via 4 progression systems (see below). Players start with only 3 cards and 0 hardware. Everything else is earned.

### Modules

6 rooms being built. Visual station schematic on hub overview lights up as rooms come online.

### Crew Advancement

Crew level up as they participate in runs (L2 at 3 runs, L3 at 8). Each level unlocks:
1. **Stronger passive** — the combat/economy bonus that applies during dives
2. **Lore fragments** — 3 per crew member, revealed as they level
3. **Research bonus** — leveled crew contribute more research points when assigned to a track
4. **Card unlock** — each crew member unlocks 1 specific card at L2 and 1 at L3 (see Section 7 unlock tables)

### Ship Captaining

Repaired ships become captainable. Captained ships give persistent per-run bonuses. Captain's passive + ship's bonus compound.

### Research Tracks

**Engineering / Biology / Psionics.** Assign crew to tracks, earn research points per dive completion, unlock advanced cards and hardware at tier thresholds.

Each track has 3 unlock tiers:
- **Tier 1** (10 points): Unlocks 2 cards + 1 hardware
- **Tier 2** (25 points): Unlocks 2 cards + 1 hardware
- **Tier 3** (50 points): Unlocks 2 cards + 1 hardware

Total from research: 18 cards + 9 hardware — the most powerful items in the game, gated behind long-term investment.

### Card Unlock Sources

Cards enter the player's `unlockedCards` pool through 5 distinct sources. Only unlocked cards can appear in loot node offerings during dives.

| Source | How It Works | # of Cards | Example |
|--------|-------------|------------|----------|
| **Starter** | Available from run 1 (scavenge, repair, extract) | 6 | scavenge, repair, extract, shield, analyze, upgrade |
| **Loot Nodes** | Found during dives. Added to unlockedCards permanently on extract. Lost on collapse. | ~60 | All common/uncommon doctrine-aligned cards |
| **Doctrine Signature** | Unlocked when doctrine locks at 5 points. Added to deck mid-run. | 3 | corporate_mandate, crew_effort, black_market |
| **Crew Level Up** | Unlocked when specific crew reaches L2 or L3. Added to unlockedCards permanently. | 16 | Vex L2 → bot_swarm, Rook L3 → shield_wall |
| **Void Shop** | Purchased with voidEcho between runs. The most universally powerful cards in the game — build-changing purchases worth saving for. Cross-doctrine access regardless of lock. | 10 | ancestor_memory, void_shield, echo_extract, death_defiance, echo_drain, void_touched, desperate_measures, debt_renegotiation, last_gasp, scorched_extract |
| **Death Lessons** | Unlocked at collapse milestones (3, 7, 12, 20, 30 collapses). Underdog cards — explicitly stronger when you're behind (low hull, high debt, late round, out of shields). | 5 | void_siphon (3), bitter_experience (7), scrap_memory (12), defiant_last_stand (20), survivors_instinct (30) |
| **Research Tracks** | Unlocked at research tier thresholds. | 18 | Engineering T3 → fortress_protocol |
| **Signal Events** | ~2-3 cards. One-time rewards from specific signal choices during dives. Narrative loot — not a separate progression track, just story-attached card rewards. | ~2-3 | Thematic cards from signal story events |

**Why Each Source Exists:** Each unlock source serves a distinct purpose in the player's journey. **Starter** cards provide the baseline toolkit — every run starts functional. **Loot nodes** deliver run variety and RNG-driven excitement. **Doctrine signature** is the identity moment where your build crystallizes. **Crew level** cards reward long-term relationships with your crew. **Void shop** cards are the premium destination for the voidEcho economy — the most universally powerful cards, worth saving for. **Death lessons** are the underdog identity — failure builds character (literally), with cards that are explicitly stronger when you're behind. **Research tracks** represent long-term investment for the most powerful items in the game. **Signal events** are story reward bonuses — not a separate progression track, just narrative-attached card rewards.

### Hardware Unlock Sources

Hardware enters the player's `itemInventory` through 3 sources. Only owned hardware can be equipped.

| Source | How It Works | # of Items | Example |
|--------|-------------|------------|----------|
| **Dive Discovery** | Found during dives via risky_scavenge (30% chance), black_market (guaranteed), or cache nodes. Kept on extract, lost on collapse. | ~30 | All common/uncommon hardware |
| **Salvage Market** | Purchased with credits + salvage at the Market Node between runs. | ~12 | Mid-tier hardware for credit/salvage cost |
| **Research Tracks** | Unlocked at research tier thresholds. | 9 | The most powerful rare hardware |

---

## 5. LORE — THE STORY

### Core Backstory

- Players were software engineers / professionals who bought cryo packages
- "Wake Me When It's Better" — the apocalypse came, the package activated
- Contracts got bundled and traded as debt instruments over centuries
- Nexus Corp thawed them because it's cheaper than robots
- ₡1,000,000 "reanimation and administrative" debt stamped on each body
- No surviving family — death benefits route back to the corporation
- The executive AI runs everything. It has no interest in their survival. Only throughput.

### VALU

Ship AI. Laconic. Accurate. Has no vested interest in the player's survival. Provides information the way a parking meter provides information — completely indifferent to the consequences.

### Signal Transmissions

10 signals with real content connecting to the backstory (see Phase 2 roadmap).

### Crew Personal Lore

3 fragments × 8 crew = 24 fragments. Each crew member was someone specific before cryo. Each remembers something specific. Each wants something now.

### Three Endings (doctrine-based, trigger at debt zero)

- **Corporate:** VALU informs you that your operational metrics are identical to Nexus Corp Sector 7. You are the new Nexus Corp. VALU finds this structurally elegant.
- **Cooperative:** Crew give speeches. The station is debt-free. VALU notes this is the first debt-free outcome in recorded operational history and does not know what to do with this information.
- **Smuggler:** Debt cleared. Records incomplete. No official outcome logged. VALU notes your file has been marked "PENDING REVIEW" for 847 years now and will remain so.

---

## 6. ROADMAP

### PHASE 1 — Foundation Fixes ✅

- [x] Doctrine points carry into meta on run end
- [x] Credit values scaled to real economy
- [x] Module costs scaled to real economy
- [x] Doctrine display in hub left panel
- [x] Hardware panel underline fix
- [x] Dive card text visible
- [x] Minimap overflow fix
- [x] Pay debt amount meaningful (₡10,000)
- [x] Recap panel shows actual starting debt

### PHASE 2 — Doctrine Shapes Runs ✅

- [x] Loot node card pool weighted by locked doctrine
- [x] Hardware drops weighted by doctrine
- [x] Signal transmissions — real content (10 signals)
- [x] Result screen shows doctrine lean summary (via hub doctrine display)

### PHASE 3 — Crew Advancement ✅

- [x] runsParticipated tracked per crew member
- [x] Crew level up at 3 and 8 runs participated
- [x] Level 2 and 3 passives unlock
- [x] Crew level shown in hub crew tab
- [x] Crew personal lore fragments (24 total)

### PHASE 4 — Station as Place ✅

- [x] Hub overview station schematic (rooms light up with module upgrades)
- [x] Ship captaining — assign crew, gain persistent bonus
- [ ] Research tracks wired up (deferred)

### PHASE 5 — Story Payoff ✅

- [x] End-of-run lore screen after successful extracts
- [x] Debt-cleared ending sequences (3 doctrine-based)
- [x] VALU voice lines reflected in signal transmissions and tutorial dialogue

### PHASE 6 — Content Scale & Unlock Systems

**Goal: Expand from 27 cards / 12 hardware to 120 cards / 50 hardware, with every item gated behind a clear progression unlock.**

- [ ] **Card expansion (93 new cards):** ~29 Corporate, ~28 Cooperative, ~29 Smuggler, ~9 Void/cross-doctrine
- [ ] **Hardware expansion (38 new items):** 14 hull, 13 scanner, 11 utility across 3 rarities
- [ ] **Crew card unlocks (16 cards):** 2 per crew member at L2 and L3 thresholds — see Section 7 unlock table
- [ ] **Research track system wired up:** 3 tracks × 3 tiers, each tier unlocks 2 cards + 1 hardware
- [ ] **Salvage market expansion:** 12 mid-tier hardware purchasable with credits + salvage between runs
- [ ] **Death lesson expansion:** Expand to 5 underdog cards at milestones 3, 7, 12, 20, 30 collapses
- [ ] **Void shop expansion:** Add echo_drain, void_touched, desperate_measures, debt_renegotiation, last_gasp, scorched_extract (total 10 void shop cards)
- [ ] **Signal event cards:** Signal events can grant 2-3 one-time card rewards as narrative loot (not a separate unlock track)
- [ ] **Loot node pools:** Define full common/uncommon/rare card pools per doctrine (~55 cards available via loot)
- [ ] **Build archetype cards:** All 13 build-specific gap cards from Section 7 (CG-01 through CG-13)
- [ ] **Build archetype hardware:** All 5 build-specific gap hardware from Section 7 (CG-14 through CG-18)
- [ ] **Crew passive gap:** Assign `echo_on_collapse` effect type to Nyx L2 or new crew member
- [ ] **Ship gap:** Add void echo component to Echo Runner captain bonus

---

## 7. BUILD ARCHETYPES & CONTENT GAPS

> Every viable player build traced across all systems. Each archetype lists its full synergy chain and specifies what content additions are needed to feel complete and distinct.

---

### 7.1 Scavenger Swarm

**Pitch:** Deploy bots. Scale bots. Extract with a credit multiplier that rewards patience.

**Doctrine:** Smuggler (locks at 5 smuggler points from bot cards + scavenge/black_market plays)

**Core Strategy:** Flood the run with bot deployments via repair_bot and scavenge_bot. At 3+ bots deployed, repair_bot fully restores hull and overdrive_extract triggers a ×1.5 credit multiplier. The build's tension is surviving long enough to hit the bot threshold and reach round 10.

**Key Cards:**
- `repair_bot` (common) — Deploy a bot, hull +10. At 3+ bots, hull restored to 100. Primary bot source and survivability.
- `scavenge_bot` (common) — Deploy a bot, +₡3000. Credit engine that feeds the multiplier.
- `overdrive_extract` (rare) — End dive. If bots ≥ 3 on round 10, credits ×1.5. The build's capstone.
- `scavenge` (starter) — Early-round credit generation, 15% hull risk mitigated by bot_chassis.
- `black_market` (uncommon, smuggler signature) — +₡6000 + 1 relic (salvage) + hardware find. High-value Smuggler card.
- `risky_scavenge` (common) — +₡1500 + components + 25% relic chance (salvage). Additional bot-synergy scavenge.

**Hardware Loadout:**
- Hull: `ablative_armor` (uncommon) — −10% danger chances. Keeps hull alive during bot ramp.
- Scanner: `deep_scanner` (uncommon) — +₡1500 scavenge bonus. Amplifies every scavenge play.
- Utility: `bot_chassis` (rare) — Scavenge hull risk halved when bots are deployed. Core defensive piece.

**Crew Roster:**
- Lead: **Vex** (Scrap Tech) — +₡1500/2500/4000 per bot on extract. At L3 with 5 bots, that's +₡20,000.
- Companion: **Jax** (Scavenger) — +₡1500/2500/3500 on scavenge cards. Boosts income during ramp.
- Companion: **Imani** (Analyst) — −20/35/50% danger chances. Keeps hull intact for overdrive timing.

**Ship Choice:** **Vagrant** — Smuggler affinity, +₡5000 on extract. Stacks with Vex's per-bot bonus and overdrive multiplier. Alternative: **Wraith** (+₡3000 scavenge) for faster ramp but weaker extract.

**Void Communion:** Risk Taker branch (Greedy Hands I-III) — +₡500/1000/1500 scavenge credit bonus. Directly amplifies every scavenge play.

**Module Priority:**
1. Command Deck (danger reduction) — survive to round 10
2. Salvage Bay (sale bonus) — bots generate salvage; sell for station upgrades
3. Workshop (repair speed) — get Vagrant/Bulwark repaired faster for captain bonus

**Acquisition Path:**
- Early runs use scavenge + repair to learn economy. Loot nodes offer repair_bot and scavenge_bot (Smuggler-weighted after lock).
- Black_market unlocks as Smuggler signature at 5 points.
- Vex unlocks when any doctrine is locked — assign immediately.
- overdrive_extract appears in rare-weighted loot or boss loot.
- bot_chassis found via black_market hardware drops or cache nodes.

**Strengths:** Massive credit ceiling when overdrive_extract fires. Self-sustaining hull via 3-bot full repair. Salvage generation funds station progression.

**Weaknesses:** Slow ramp — first 4-5 rounds feel fragile before bot threshold. Vulnerable to early deep_fracture (round 7+) before bots are deployed. overdrive_extract requires precise timing at round 10.

**Content Gaps:**
- **Missing: `bot_swarm`** (Smuggler, uncommon) — "Deploy 2 bots. +₡1000 for each bot already deployed this run." Gives the build faster ramp and scaling beyond 3 bots.
- **Missing: `calculated_scrap`** (Smuggler, uncommon) — "If bots ≥ 3: +₡6000, hull −5. Otherwise: +₡2000." Gives a mid-run power spike that rewards reaching the threshold.
- **Missing: `bot_overclocker`** hardware (Utility, uncommon) — "Bot credit gains +₡1000 per bot deployed." Currently only Vex amplifies bot value; hardware should too.

---

### 7.2 Iron Fortress

**Pitch:** Stack shields. Convert shields to hull. Become structurally unkillable.

**Doctrine:** Cooperative (locks at 5 cooperative points from shield/repair/bulwark plays)

**Core Strategy:** Accumulate shield charges through every available source — starting bonuses, shield cards, and bulwark plays. Convert shields to hull via hull_surge (spend 2 shields for +25/+40 hull) and Nyx's shield-to-hull passive. Last_stand provides an emergency reset if hull drops critical. The build aims to end every round at or near full hull with shields remaining.

**Key Cards:**
- `bulwark` (common) — Hull +6, shield +1 (2 with shield_recycler). At 3 plays, −30% next danger. Build's backbone.
- `hull_surge` (uncommon) — Spend 2 shields → hull +25. If shields ≥ 3, hull +40 instead. Primary conversion engine.
- `last_stand` (rare) — If hull ≤ 35 and round ≥ 5: gain 2 shields, skip danger. Emergency brake. One use per run.
- `shield` (starter) — Gain 1 shield charge (2 with shield_recycler). Consistent shield source.
- `crew_effort` (uncommon, cooperative signature) — Hull +12, shield +1 (2 with recycler). Efficient hybrid.
- `patch_and_hold` (common) — Hull +8, shield +1. Costs ₡2000. Early stabilization.
- `repair` (starter) — Hull +15. Safety net.

**Hardware Loadout:**
- Hull: `bulkhead_plating` (rare) — −12% danger when hull > 75. Fortress stays above 75 consistently.
- Scanner: `void_sensor` (rare) — −8% danger chances. General survivability.
- Utility: `shield_emitter` (rare) — +2 starting shields. Opens with defensive buffer.
  - Alternative: `shield_recycler` (uncommon) — All shield gains +1. Amplifies every shield card.

**Crew Roster:**
- Lead: **Rook** (Guard) — +1/2/3 starting shields. Foundation of the shield stack.
- Companion: **Nyx** (Shieldwright) — +5/8/12 hull per shield consumed. Every blocked danger heals hull.
- Companion: **Max** (Engineer) — +5/8/12 hull regen per round. Passive hull sustain.

**Ship Choice:** **Bulwark** — Cooperative affinity, +2 starting shields. Combined with Rook L3 + shield_emitter + Survivor void tiers = 10 starting shields.

**Void Communion:** Survivor branch (Hardened Shell I-III) — +3 total starting shields. Directly feeds the shield economy.

**Module Priority:**
1. Command Deck (danger reduction) — fewer dangers = shields last longer
2. Power Core (energy cap) — more dives per billing cycle
3. Cryo Ward (wake discount) — cheaper to wake Rook + Nyx + Max

**Acquisition Path:**
- Start with shield + repair in starter deck. Add bulwark from early loot nodes.
- Rook and Nyx unlock via opening path (duty_claim for Rook, 5 extracts for Nyx).
- Bulwark ship requires 8 salvage — Workshop speed helps.
- hull_surge and last_stand appear in uncommon/rare loot pools, Cooperative-weighted.
- shield_emitter from black_market or cache nodes.

**Strengths:** Near-indestructible once shield engine is running. Nyx creates a positive feedback loop (shields block damage → hull heals → more room to spend shields on hull_surge). Extremely safe extraction.

**Weaknesses:** Low credit generation — most cards are defensive, not economic. Vulnerable to void_leak (bypasses shields entirely). Reactor_flare consumes 2 shields at once, draining the buffer. Slow runs — often extracts early because there's no economic reason to stay.

**Content Gaps:**
- **Missing: `shield_wall`** (Cooperative, rare) — "Spend 3 shields. Negate all dangers this round." Gives the build a power turn that justifies massive shield hoarding.
- **Missing: `fortress_protocol`** (Cooperative, uncommon) — "If shields ≥ 5 at round end, gain ₡2000." Economic incentive to maintain the fortress instead of converting everything to hull.
- **Missing: `reactive_plating`** hardware (Hull, uncommon) — "When a shield blocks damage, gain +2 hull." Stacks with Nyx for double shield-to-hull conversion.

---

### 7.3 Corporate Extractor

**Pitch:** Maximize extract value. Every credit multiplier stacks. Extract early, extract often, extract rich.

**Doctrine:** Corporate (locks at 5 corporate points from extract/upgrade/analyze plays)

**Core Strategy:** Stack flat extract bonuses from crew (Sera, Del), ship (Echo Runner), and hardware (extraction_rig), then multiply with secure_extract (+10%) or corporate_mandate (×1.2). Upgrade extends runs for more accumulation. Analyze keeps hull safe for secure_extract's hull ≥ 50 requirement. The build treats every dive as a calculated investment: spend rounds building credits, extract at peak value.

**Key Cards:**
- `extract` (starter) — End dive, bank credits. Baseline exit.
- `secure_extract` (common) — End dive, +10% bonus if hull ≥ 50. Primary extract card.
- `corporate_mandate` (uncommon, corporate signature) — End dive, credits ×1.2, debt +₡20,000. High-risk high-reward capstone.
- `upgrade` (starter) — Max rounds +2, hull −8. Extends accumulation window.
- `analyze` (starter) — Next danger halved. Keeps hull ≥ 50 for secure_extract.
- `scavenge` (starter) — +₡2500 + 1 scrap. Credit accumulation during extended runs.

**Hardware Loadout:**
- Hull: `hull_plating` (common) or `ablative_armor` (uncommon) — Danger reduction to maintain hull for secure_extract.
- Scanner: `deep_scanner` (uncommon) — +₡1500 scavenge bonus. Every scavenge play earns more.
- Utility: `extraction_rig` (uncommon) — +₡80 on extract. Stacks with crew and ship bonuses.

**Crew Roster:**
- Lead: **Del** (Broker) — +₡5000/8000/12000 on extract. At L3, this alone covers a billing payment's worth.
- Companion: **Sera** (Medic) — +₡800/1500/2500 on extract. Stacks additively with Del.
- Companion: **Max** (Engineer) — +5/8/12 hull regen per round. Keeps hull above 50 for secure_extract.

**Ship Choice:** **Echo Runner** — Corporate affinity, +₡8000 on extract. Combined with Del L3 + Sera L3 + extraction_rig = +₡22,580 flat on every extract before any multipliers.

**Void Communion:** Survivor branch — Starting shields provide hull buffer for secure_extract qualification. Risk Taker branch is secondary for scavenge-heavy variants.

**Module Priority:**
1. Salvage Bay (sale bonus) — Upgrade cards generate salvage; sell for station funding.
2. Power Core (energy cap) — More dives = more extracts = more flat bonuses applied.
3. Market Node (market discount) — Cheaper energy recharges to dive more frequently.

**Acquisition Path:**
- Starter deck contains extract, upgrade, analyze — the core loop is available from run 1.
- Sera and Del unlock via opening paths (duty_claim for Sera, cut_and_run for Del).
- secure_extract and corporate_mandate appear in common/uncommon loot, Corporate-weighted.
- Echo Runner costs 10 salvage — most expensive ship, needs Workshop investment.
- extraction_rig found via black_market or cache nodes.

**Strengths:** Highest consistent extract income of any build. Flat bonuses are deterministic — no RNG in the payout. corporate_mandate ×1.2 on top of ₡20K+ flat bonuses is massive. Multiple extract options provide flexibility.

**Weaknesses:** corporate_mandate's +₡20,000 debt can spiral if used recklessly. Low defensive capability — spends cards on economy, not survival. secure_extract's hull ≥ 50 requirement forces cautious play. Extended runs via upgrade risk collapse from escalated late-round dangers.

**Content Gaps:**
- **Missing: `credit_forecast`** (Corporate, uncommon) — "If round ≥ 8: extract bonus +30%. Otherwise: analyze next danger." Rewards extended runs specifically.
- **Missing: `marathon`** (Corporate, uncommon) — "Max rounds +1. Gain ₡500 for each round played this run." Synergizes with upgrade stacking.
- **Missing: `hull_investment`** (Corporate, rare) — "Spend 20 hull. Gain ₡5000 × rounds remaining." Corporate hull-to-credit conversion.
- **Missing: `extended_tanks`** hardware (Hull, uncommon) — "upgrade card deals no hull damage." Makes extended-run builds safer.

---

### 7.4 Risk Runner

**Pitch:** Stack danger reduction until the risky plays become safe plays. Every danger that doesn't fire is profit.

**Doctrine:** Smuggler (locks at 5 smuggler points from risky_scavenge/black_market/scavenge plays)

**Core Strategy:** Maximize danger chance reduction through Imani (up to −50%), Command Deck module (−10%), and hardware (−10-18%). Then spam risky_scavenge (40% hull chance) and black_market (50% hull chance) with dramatically reduced trigger rates. Jax amplifies the credit output. The build turns the game's risk/reward tension inside out — the riskier the card, the more profit when danger doesn't fire.

**Key Cards:**
- `risky_scavenge` (common) — +₡1500 + components + 25% relic chance (salvage) + 30% hardware discovery. With Jax L3, +₡5000 base.
- `black_market` (uncommon, smuggler signature) — +₡6000 + 1 relic (salvage) + hardware find. 50% hull chance reduced to ~25% with full mitigation.
- `scavenge` (starter) — +₡2500 + scrap. Reliable income with 15% hull chance reduced to ~7%.
- `repair` (starter) — Hull +15. Recovery after inevitable chip damage.
- `shield` (starter) — Shield charge. Safety buffer for residual dangers.

**Hardware Loadout:**
- Hull: `ablative_armor` (uncommon) — −10% danger chances. Core defensive piece.
- Scanner: `void_sensor` (rare) — −8% danger chances. Stacks with ablative_armor.
- Utility: `shield_emitter` (rare) — +2 starting shields. Additional danger absorption.

**Crew Roster:**
- Lead: **Imani** (Analyst) — −20/35/50% danger. At L3, halves every danger chance multiplicatively.
- Companion: **Jax** (Scavenger) — +₡1500/2500/3500 on scavenge cards. Turns risky_scavenge from +₡1500 to +₡5000.
- Companion: **Rook** (Guard) — +1/2/3 starting shields. Extra safety for risky plays.

**Ship Choice:** **Wraith** — Smuggler affinity, +₡3000 on scavenge cards. Stacks with Jax for +₡6500 per risky_scavenge at L3.

**Void Communion:** Risk Taker branch (Greedy Hands I-III) — +₡500/1000/1500 scavenge bonus. Additional flat scavenge amplification.

**Module Priority:**
1. Command Deck (danger reduction) — −3/6/10% danger. Core to the strategy.
2. Salvage Bay (sale bonus) — Risky scavenge generates components and relics (high-tier salvage).
3. Workshop (repair speed) — Get Wraith repaired for captain bonus.

**Acquisition Path:**
- Imani unlocks at 3 extracts — early availability.
- Jax unlocks via cut_and_run opening path.
- risky_scavenge appears in common loot pools, Smuggler-weighted.
- black_market is Smuggler signature (5 points).
- Danger-reduction hardware from black_market finds and cache nodes.
- Wraith requires 5 salvage — mid-tier ship, achievable early.

**Strengths:** Turns the game's danger system into a profit engine. Highest per-card credit generation when dangers don't trigger. Generates massive salvage (components, relics) for station economy. Relics are high-tier salvage currency, not equippable gear. Hardware discovery from risky_scavenge accelerates gear acquisition.

**Weaknesses:** Danger reduction is never 100% — bad RNG still kills. Residual dangers in rounds 7+ (deep_fracture, reactor_flare, void_leak) hit hard even at reduced rates. No extract multiplier — income is per-card, not burst. corporate_mandate is unavailable (wrong doctrine).

**Content Gaps:**
- **Missing: `calculated_risk`** (Smuggler, uncommon) — "Take 15 hull damage guaranteed. +₡8000. Danger chances −15% rest of run." A guaranteed-cost card that benefits from danger reduction gear.
- **Missing: `danger_profit`** (Smuggler, rare) — "If no danger triggered this round, gain ₡4000." Explicitly rewards danger mitigation.
- **Missing: ` adrenaline_junkie`** (Smuggler, uncommon) — "+₡3000. If a danger triggered this round, +₡3000 more." A gamble-within-a-gamble that synergizes with danger-heavy late rounds.

---

### 7.5 Void Walker

**Pitch:** Treat collapses as progress. Farm void echo on failure, spend it on power between runs.

**Doctrine:** Cross-doctrine — the build works regardless of which doctrine locks. Void communion is the primary system.

**Core Strategy:** Invest heavily in the Void Walker communion branch to maximize echo gain on collapse. Use echo_extract to generate echo even on successful runs. Cycle void shop purchases (death_defiance, void_shield, ancestor_memory) to add powerful cards to the pool. The build accepts that many runs will collapse — each collapse funds the next attempt with void echo. Death Defiance provides a safety net that enables riskier play.

**Key Cards:**
- `echo_extract` (void shop, uncommon) — End dive + gain 2 voidEcho. Echo generation on successful runs.
- `void_siphon` (death lesson, uncommon) — +₡3000 + 1 voidEcho immediate. Earned after 12 collapses (thematic).
- `death_defiance` (void shop, rare) — Survive one hull-to-zero at hull 1. The risk enabler.
- `void_shield` (void shop, uncommon) — +2 shield charges. Defensive utility from void shop.
- `ancestor_memory` (void shop, common) — Preview next danger. Information is power.

**Hardware Loadout:**
- Hull: `reactive_shell` (rare) — +20 hull max. Extra buffer for risky dives.
- Scanner: `void_sensor` (rare) — −8% danger. Thematic void-aligned hardware.
- Utility: `shield_emitter` (rare) — +2 starting shields. Survive longer for more rounds = more echo on collapse.

**Crew Roster:**
- Lead: **Max** (Engineer) — +5/8/12 hull regen per round. Survive more rounds = higher echo on collapse.
- Companion: **Imani** (Analyst) — Danger reduction. Extend runs for more echo.
- Companion: **Nyx** (Shieldwright) — Shield-to-hull conversion. Defensive sustain.
- Note: No crew member boosts void echo generation — this is a content gap.

**Ship Choice:** **Echo Runner** — The name implies void affinity but currently gives +₡8000 extract (corporate). No ship directly boosts void echo. Use Bulwark for survivability or Wraith for economy while farming echo.

**Void Communion:** Void Walker branch (Echo Resonance I-III) — +3 total echo multiplier on collapse. At tier 3, collapse on round 8 = 8 × 3 = 24 voidEcho. Primary income source.

**Module Priority:**
1. Command Deck (danger reduction) — survive more rounds for higher echo payout
2. Power Core (energy cap) — more dive attempts = more echo farming
3. Cryo Ward (wake discount) — keep crew active for more dives

**Acquisition Path:**
- Void communion tiers purchased with echo between runs — early investment required.
- echo_extract and death_defiance bought from void shop (4-8 echo each).
- void_siphon unlocked at 12 collapses (death lesson tier 3) — this build will naturally reach that.
- No crew specifically supports this build — the biggest content gap.

**Strengths:** Failure is productive — even collapsed runs generate meaningful echo. Void shop cards (death_defiance, void_shield) are universally powerful. Cross-doctrine flexibility — can layer void economy on top of any doctrine build.

**Weaknesses:** Heavily reliant on the void shop card pool (only 4 cards). No in-run echo scaling — only gains echo at extract or collapse. No crew or ship synergy. Void Walker communion only rewards collapse, not successful deep runs. Feels incomplete compared to doctrine-specific builds.

**Content Gaps:**
- **Missing: `echo_drain`** (Void, uncommon) — "Lose 10 hull. Gain voidEcho equal to round number." In-run echo generation that rewards extending runs.
- **Missing: `void_touched`** (Void, rare) — "Gain 1 voidEcho on extract. If hull < 30 at extract, gain +1 voidEcho." Rewards risky successful extracts.
- **Missing: `echo_amplifier`** hardware (Scanner, rare) — "+1 voidEcho on each successful extract." Void Walker's missing hardware identity.
- **Missing: Crew with `echo_on_collapse` passive** — The `echo_on_collapse` effect type exists in code but no crew member uses it. Should be assigned to a new or existing crew member (e.g., Nyx level 2 upgrade could swap to echo_on_collapse, or a new crew member added).
- **Missing: Void echo ship bonus** — Echo Runner should provide +1 voidEcho on extract as captain bonus instead of (or in addition to) +₡8000.

---

### 7.6 Long Haul

**Pitch:** Extend the run. More rounds = more card plays = more accumulation. Patience pays.

**Doctrine:** Corporate (upgrade, analyze are corporate cards) — but the build borrows heavily from Cooperative for survivability.

**Core Strategy:** Use upgrade cards to extend runs from 10 to 12-14+ rounds. Each additional round is another card play for credits, salvage, and doctrine points. Max's hull regen and analyze's danger halving provide the sustain needed to survive extended exposure to escalating late-round dangers. The build's payoff is cumulative: every extra round compounds the run's total value.

**Key Cards:**
- `upgrade` (starter) — Max rounds +2, hull −8. Can be played multiple times for 12, 14, 16 rounds.
- `analyze` (starter) — Next danger halved. Repeatable safety for extended exposure.
- `repair` (starter) — Hull +15. Recovers upgrade's hull cost and danger damage.
- `scavenge` (starter) — +₡2500 + scrap. Credit accumulation per additional round.
- `extract` / `secure_extract` — Exit when accumulation is sufficient.
- `risky_scavenge` (common) — High credit income for extended runs with danger mitigation.

**Hardware Loadout:**
- Hull: `reactive_shell` (rare) — +20 hull max. Critical for surviving extended runs. Raises cap to 120.
- Scanner: `deep_scanner` (uncommon) — +₡1500 scavenge bonus. Each additional round earns more.
- Utility: `extraction_rig` (uncommon) — +₡80 on extract. Larger banked credits get amplified.

**Crew Roster:**
- Lead: **Max** (Engineer) — +5/8/12 hull regen per round. At L3, 14 rounds = +168 free hull over the run.
- Companion: **Imani** (Analyst) — −20/35/50% danger. Essential for surviving rounds 10+.
- Companion: **Sera** (Medic) — +₡800/1500/2500 on extract. Bigger runs = bigger extract base = bigger Sera bonus.

**Ship Choice:** **Bulwark** — Cooperative affinity, +2 starting shields. Extended runs need early protection. Alternative: **Echo Runner** for +₡8000 extract if going full corporate.

**Void Communion:** Survivor branch — Starting shields for early protection during the vulnerable ramp phase. Each shield charge is effectively +1 more round of safety.

**Module Priority:**
1. Command Deck (danger reduction) — Late-round dangers are brutal; −10% is mandatory.
2. Power Core (energy cap) — More dives per cycle to fund the strategy.
3. Workshop (repair speed) — Get the right ship repaired faster.

**Acquisition Path:**
- Starter deck contains upgrade and analyze — available from run 1.
- Max unlocks via duty_claim opening path.
- Imani unlocks at 3 extracts — natural acquisition.
- reactive_shell from rare loot or cache nodes.
- Bulwark ship (8 salvage) or Echo Runner (10 salvage) — mid-to-late game ships.

**Strengths:** Compound returns — every extra round adds value. Max's hull regen creates a positive feedback loop with upgrade's hull cost. analyze provides deterministic danger control. Flexible exit timing (extract whenever accumulation is sufficient).

**Weaknesses:** upgrade's −8 hull cost is punishing without Max. Late-round dangers (deep_fracture −30 hull, reactor_flare −20 hull) escalate faster than hull regen. No explicit reward for run length — credits are linear, not exponential. 16-round runs are grueling and one bad danger chain can collapse everything.

**Content Gaps:**
- **Missing: `marathon`** (Corporate, uncommon) — "Max rounds +1. Gain ₡500 for each round played this run." Explicit round-length reward.
- **Missing: `credit_forecast`** (Corporate, uncommon) — "If round ≥ 8: extract bonus +30%. Otherwise: analyze next danger." Late-run extract multiplier.
- **Missing: `hull_investment`** (Corporate, rare) — "Spend 20 hull. Gain ₡5000 × rounds remaining." In a 14-round run on round 6, that's ₡40,000.
- **Missing: `extended_tanks`** hardware (Hull, uncommon) — "upgrade card deals no hull damage." Removes the tension between extending and surviving.
- **Missing: Card that scales with rounds played** — The build needs at least one card that gets explicitly stronger in rounds 10+, giving mechanical identity to the "long run" concept.

---

### 7.7 Shield Engine

**Pitch:** Generate shields. Convert shields to value. Let the shields do the work.

**Doctrine:** Cooperative (shield, patch_and_hold, crew_effort, bulwark are all cooperative)

**Core Strategy:** Differentiated from Iron Fortress by focusing on shield *generation* rather than shield *conversion*. The Shield Engine aims to maintain a high shield count throughout the run, using shields as the primary defense layer rather than converting them to hull. shield_recycler amplifies every gain. The build's identity is never letting shields drop to zero and finding ways to spend excess shields for value.

**Key Cards:**
- `shield` (starter) — Gain 1 shield charge (2 with shield_recycler). Basic generation.
- `void_shield` (void shop, uncommon) — +2 shield charges (3 with shield_recycler). Burst generation.
- `patch_and_hold` (common) — Hull +8, shield +1 (2 with recycler). Hybrid stability.
- `bulwark` (common) — Hull +6, shield +1 (2 with recycler). At 3 plays, −30% danger.
- `crew_effort` (uncommon, cooperative signature) — Hull +12, shield +1 (2 with recycler).
- `hull_surge` (uncommon) — Spend 2 shields → hull +25/+40. Shield spending valve.

**Hardware Loadout:**
- Hull: `bulkhead_plating` (rare) — −12% danger when hull > 75. Shield block keeps hull high.
- Scanner: `void_sensor` (rare) — −8% danger. General safety.
- Utility: **Both** `shield_emitter` (rare, +2 starting shields) AND `shield_recycler` (uncommon, +1 to all shield gains). The build wants both — but can only equip one utility. **This is a content gap — the build needs both effects and can't have them.**

**Crew Roster:**
- Lead: **Rook** (Guard) — +1/2/3 starting shields. Shield generation foundation.
- Companion: **Nyx** (Shieldwright) — +5/8/12 hull per shield consumed. Shields that get used still provide value.
- Companion: **Max** (Engineer) — +5/8/12 hull regen per round. Backup sustain for when shields don't cover.

**Ship Choice:** **Bulwark** — Cooperative affinity, +2 starting shields. Identical to Iron Fortress — **this is a content gap.** Both builds want the same ship.

**Void Communion:** Survivor branch (Hardened Shell I-III) — +3 starting shields. Directly amplifies the core mechanic.

**Module Priority:**
1. Command Deck (danger reduction) — Shield economy is fragile if too many dangers fire.
2. Power Core (energy cap) — More dives to accumulate void shop cards.
3. Cryo Ward (wake discount) — Keep the 3-crew roster active.

**Acquisition Path:**
- Starter shield + patch_and_hold from common loot.
- Rook via duty_claim, Nyx at 5 extracts.
- Bulwark ship (8 salvage).
- void_shield and death_defiance from void shop (requires echo investment).
- shield_emitter and shield_recycler from black_market or cache nodes — can only equip one.

**Strengths:** Extremely consistent danger absorption. Shields block hull_creaking, structural_stress, and deep_fracture entirely. Nyx makes shield consumption productive. High starting shields from stacking all sources gives a massive early-game advantage.

**Weaknesses:** void_leak bypasses shields (−10 hull, −₡1500). reactor_flare consumes 2 shields at once. crew_panic can't be blocked by shields. Overlaps significantly with Iron Fortress — currently plays almost identically. No shield-to-credit conversion means low income. Can't equip both shield utility hardware pieces simultaneously.

**Content Gaps:**
- **Missing: `shield_bash`** (Cooperative, uncommon) — "Spend 1 shield. Hull +15. If shields ≥ 5, also gain ₡3000." Gives shields economic value and differentiates from Iron Fortress (which converts shields to hull; Shield Engine converts shields to credits).
- **Missing: `mass_shields`** (Cooperative, uncommon) — "Gain shields equal to half your missing hull ÷ 10 (rounded up)." Reactive shield generation based on damage taken — unique to Shield Engine.
- **Missing: `capacitor_array`** hardware (Utility, rare) — "Shield gains +1. If shields ≥ 5, danger chances −10%." Combines shield_recycler's amplification with a defensive bonus, freeing the utility slot choice.
- **Identity overlap with Iron Fortress** — Both builds use Rook + Nyx + Bulwark + shield cards. Shield Engine needs cards/hardware that reward *holding* shields (not spending them), while Iron Fortress rewards *spending* shields for hull.

---

### Content Gap Summary

| Gap ID | Type | Name | Build(s) | Proposed Effect | Unlock Source |
|--------|------|------|----------|-----------------|---------------|
| CG-01 | Card | `bot_swarm` | Scavenger Swarm | Deploy 2 bots. +₡1000 per bot already deployed. Uncommon, Smuggler. | Crew: Vex L2 |
| CG-02 | Card | `calculated_scrap` | Scavenger Swarm | If bots ≥ 3: +₡6000, hull −5. Otherwise: +₡2000. Uncommon, Smuggler. | Loot node |
| CG-03 | Card | `shield_wall` | Iron Fortress | Spend 3 shields. Negate all dangers this round. Rare, Cooperative. | Crew: Rook L3 |
| CG-04 | Card | `fortress_protocol` | Iron Fortress | If shields ≥ 5 at round end, gain ₡2000. Uncommon, Cooperative. | Research: Engineering T3 |
| CG-05 | Card | `credit_forecast` | Corporate Extractor, Long Haul | If round ≥ 8: extract bonus +30%. Otherwise: analyze. Uncommon, Corporate. | Loot node |
| CG-06 | Card | `marathon` | Corporate Extractor, Long Haul | Max rounds +1. Gain ₡500 per round played. Uncommon, Corporate. | Research: Engineering T2 |
| CG-07 | Card | `hull_investment` | Corporate Extractor, Long Haul | Spend 20 hull. Gain ₡5000 × rounds remaining. Rare, Corporate. | Loot node |
| CG-08 | Card | `calculated_risk` | Risk Runner | Take 15 hull damage. +₡8000. Danger −15% rest of run. Uncommon, Smuggler. | Crew: Jax L2 |
| CG-09 | Card | `danger_profit` | Risk Runner | If no danger triggered this round, gain ₡4000. Rare, Smuggler. | Crew: Imani L3 |
| CG-10 | Card | `echo_drain` | Void Walker | Lose 10 hull. Gain voidEcho = round number. Uncommon, Void. | Void Shop (6 echo) |
| CG-11 | Card | `void_touched` | Void Walker | +1 voidEcho on extract. +1 more if hull < 30. Rare, Void. | Void Shop (8 echo) |
| CG-12 | Card | `shield_bash` | Shield Engine | Spend 1 shield. Hull +15. If shields ≥ 5: +₡3000. Uncommon, Cooperative. | Crew: Nyx L2 |
| CG-13 | Card | `mass_shields` | Shield Engine | Gain shields = ceil(missing hull / 20). Uncommon, Cooperative. | Loot node |
| CG-14 | Hardware | `echo_amplifier` | Void Walker | Scanner, rare. +1 voidEcho on each successful extract. | Research: Psionics T3 |
| CG-15 | Hardware | `extended_tanks` | Long Haul, Corporate | Hull, uncommon. upgrade card deals no hull damage. | Research: Engineering T1 |
| CG-16 | Hardware | `bot_overclocker` | Scavenger Swarm | Utility, uncommon. Bot credit gains +₡1000 per bot deployed. | Salvage market |
| CG-17 | Hardware | `reactive_plating` | Iron Fortress | Hull, uncommon. +2 hull when a shield blocks damage. | Dive discovery |
| CG-18 | Hardware | `capacitor_array` | Shield Engine | Utility, rare. Shield gains +1. If shields ≥ 5, danger −10%. | Research: Biology T3 |
| CG-19 | Crew | Assign `echo_on_collapse` | Void Walker | Effect type exists in code but no crew member uses it. | Code change: assign to Nyx L2 or new crew |
| CG-20 | Ship | Void echo ship bonus | Void Walker | Echo Runner captain bonus should include void echo generation. | Code change: retheme captain bonus |

### Card Content Target: 120 Cards

**Current state: 27 cards defined. 93 cards needed.**

| Category | Target | Current | Gap | Source |
|----------|--------|---------|-----|--------|
| Starter | 6 | 6 | 0 | Available from run 1 |
| Corporate doctrine | 35 | 6 | 29 | Loot nodes, crew levels, research |
| Cooperative doctrine | 35 | 7 | 28 | Loot nodes, crew levels, research |
| Smuggler doctrine | 35 | 6 | 29 | Loot nodes, crew levels, research |
| Cross-doctrine (10 void shop + 5 death lesson) | 15 | 6 | 9 | Void shop (premium power), death lessons (underdog) |

**Breakdown by unlock source (all 120 cards):**

| Unlock Source | Card Count | Details |
|--------------|-----------|----------|
| Starter | 6 | scavenge, repair, extract, shield, analyze, upgrade |
| Doctrine signature | 3 | corporate_mandate, crew_effort, black_market (one per doctrine at lock) |
| Loot nodes (common) | ~20 | 6-7 per doctrine. First cards players see each run. |
| Loot nodes (uncommon) | ~20 | 6-7 per doctrine. Mid-run power spikes. |
| Loot nodes (rare) | ~15 | 4-5 per doctrine. Build capstones. Boss loot guarantees one. |
| Crew level unlocks | 16 | 2 per crew member (L2 + L3). Directly tied to crew progression. |
| Void shop | 10 | Purchased with voidEcho. The most universally powerful cards — build-changing purchases worth saving for. |
| Death lessons | 5 | Underdog cards unlocked at collapse milestones. Stronger when you're behind. |
| Signal events | ~2-3 | One-time narrative rewards from signal choices. Not a separate progression track. |
| Research tracks | 18 | 2 per tier × 3 tiers × 3 tracks. The most powerful cards. Long-term goal. |

**Card unlock assignments by crew member (16 cards):**

| Crew | L2 Unlock | L3 Unlock |
|------|-----------|-----------|
| Max | `emergency_repair` (Coop, hull +25, skip next danger if hull < 30) | `structural_reinforce` (Coop, hull max +10 for this run) |
| Imani | `threat_assessment` (Corp, preview next 2 dangers) | `danger_profit` (Smug, gain ₡4000 if no danger triggered) |
| Jax | `calculated_risk` (Smug, take 15 hull, +₡8000, danger −15%) | `deep_salvage` (Smug, +₡8000, 2 components, 40% hull −20) |
| Sera | `triage` (Coop, hull +20, costs ₡3000) | `field_medicine` (Coop, hull +30 if hull < 40, otherwise +10) |
| Rook | `preemptive_shield` (Coop, +2 shields if round ≤ 3, otherwise +1) | `shield_wall` (Coop rare, spend 3 shields, negate all dangers) |
| Del | `debt_leveraging` (Corp, debt −₡5000 this run, credits +₡3000) | `hostile_extraction` (Corp rare, extract ×1.3 if hull < 50, otherwise ×1.0) |
| Vex | `bot_swarm` (Smug, deploy 2 bots, +₡1000 per existing bot) | `overclock_bots` (Smug rare, all bots gain +₡2000 credit value this run) |
| Nyx | `shield_bash` (Coop, spend 1 shield, hull +15, +₡3000 if shields ≥ 5) | `last_bastion` (Coop rare, if hull > 80: +3 shields. One use.) |

**Research track card unlocks (18 cards):**

| Track | Tier 1 (10 pts) | Tier 2 (25 pts) | Tier 3 (50 pts) |
|-------|----------------|----------------|----------------|
| Engineering | `marathon` (Corp), `patch_hull` (Coop) | `credit_forecast` (Corp), `reinforced_bots` (Smug) | `fortress_protocol` (Coop), `hull_investment` (Corp) |
| Biology | `triage_protocol` (Coop), `bio_scavenge` (Smug) | `regenerate` (Coop), `adaptive_shields` (Coop) | `capacitor_overload` (Coop), `bio_extract` (Corp) |
| Psionics | `void_pulse` (Void — spend all shields, gain voidEcho = shields spent + 1, hull −5 per shield spent), `entropy_gift` (Void — +₡4000, if hull < 40 also gain 1 shield) | `ancestral_extract` (Void), `premonition` (Void) | `echo_amplifier` (Void), `void_communion` (Void) |

### Hardware Content Target: 50 Items

**Current state: 12 items defined. 38 items needed.**

| Slot | Target | Current | Gap |
|------|--------|---------|-----|
| Hull | 18 | 4 | 14 |
| Scanner | 16 | 3 | 13 |
| Utility | 16 | 5 | 11 |

**Breakdown by rarity (all 50 items):**

| Rarity | Target | Purpose |
|--------|--------|----------|
| Common (16) | 16 | First hardware players find. Simple stat bonuses. ~5-6 per slot. |
| Uncommon (18) | 18 | Build-enabling effects. Players start seeing these mid-progression. ~6 per slot. |
| Rare (16) | 16 | Build capstones. Most powerful effects. Some research-exclusive. ~5-6 per slot. |

**Hardware unlock sources:**

| Source | Item Count | Details |
|--------|-----------|----------|
| Dive discovery (common/uncommon) | ~20 | Found via risky_scavenge, black_market, cache nodes. RNG-based. |
| Salvage market | ~12 | Purchased with credits + salvage between runs. Guaranteed access if you can afford them. |
| Dive discovery (rare) | ~9 | Found via boss loot, rare cache nodes. Very low drop rate. |
| Research tracks | 9 | 1 per tier × 3 tiers × 3 tracks. Guaranteed progression. Most powerful items. |

**Research track hardware unlocks (9 items):**

| Track | Tier 1 (10 pts) | Tier 2 (25 pts) | Tier 3 (50 pts) |
|-------|----------------|----------------|----------------|
| Engineering | `extended_tanks` (Hull, uncommon — upgrade costs no hull) | `bot_overclocker` (Utility, uncommon — bot credit +₡1000/bot) | `titanium_lattice` (Hull, rare — hull max +40) |
| Biology | `reactive_plating` (Hull, uncommon — +2 hull on shield block) | `med_scanner` (Scanner, uncommon — +₡500 scavenge, danger −3%) | `capacitor_array` (Utility, rare — shield gains +1, danger −10% at shields ≥ 5) |
| Psionics | `void_resonator` (Scanner, uncommon — +1 voidEcho on collapse) | `echo_battery` (Utility, uncommon — start each dive with +1 voidEcho) | `echo_amplifier` (Scanner, rare — +1 voidEcho on each extract) |

### The Unlock Progression Journey

How a player experiences content unlocking from run 1 to endgame:

**Runs 1-5 (Tutorial → First Doctrine Lock):**
- Start with 3 starter cards (scavenge, repair, extract)
- First loot nodes offer common cards from all doctrines
- Shield, analyze, upgrade enter pool after tutorial
- Doctrine locks around run 3-5. Signature card added to deck mid-run.
- First hardware found via cache nodes or risky_scavenge
- 1-2 crew awakened from cryo

**Runs 5-15 (Build Identity → Crew Unlocks):**
- Loot nodes now weighted to locked doctrine — run variety emerges
- Crew hit L2 (3 runs) → first crew-specific card unlocked
- Void shop starts offering cross-doctrine cards
- 3-4 common/uncommon hardware in inventory
- First ship repaired and captained

**Runs 15-30 (Build Completion → Research Start):**
- Uncommon and rare cards completing the build's synergy chain
- Crew hitting L3 (8 runs) → powerful L3 cards unlocked
- Research tracks accumulating points → first tier unlocks
- Salvage market offering mid-tier hardware for credits
- 6-8 hardware items in collection

**Runs 30-50 (Build Mastery → Research Tiers 2-3):**
- Research tier 2 unlocks: build-refining cards and hardware
- Crew fully leveled. Full build roster available.
- 10-12 hardware items, trying different loadout combinations
- Void Walker branch fully purchased. Death lesson tier 3 reached.

**Runs 50+ (Endgame → Full Collection):**
- Research tier 3 unlocks: the most powerful cards and hardware in the game
- 100+ cards in pool, 40+ hardware. Every build fully playable.
- Debt payoff push. Multiple ships captained. All modules upgraded.
- Player has tried multiple builds across different doctrine locks

---

*Last updated: Content scale targets, unlock progression, and card/hardware catalogs added*

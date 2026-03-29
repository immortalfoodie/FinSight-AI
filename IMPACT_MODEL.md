# Impact Model: FinSight-AI (AI Money Mentor)

> A quantified estimate of business impact — time saved, cost reduced, revenue recovered — with stated assumptions and transparent arithmetic.

---

## Executive Summary

FinSight-AI is an AI-powered personal finance platform that replaces manual advisory workflows with production-grade computation engines. This document quantifies the directional value it creates for two stakeholders:

| Stakeholder | Annual Impact | Core Lever |
|---|---|---|
| **Enterprise (per 10,000 users)** | **₹2.32 Crore** | RM time liberation + churn reduction + intelligent cross-sell |
| **Consumer (per user)** | **₹60,000/year** | Tax recovery + portfolio optimisation + professional fee savings |
| **Consumer (20-year compounded)** | **₹18.5 Lakh+** | Annual optimisations compounding at market returns |

Every number below maps to a **real, functioning engine** — not a UI wireframe or placeholder.

---

## What the System Actually Computes

Before the math, a brief inventory of capabilities. Each impact line traces back to a specific engine:

| Module | What It Computes |
|---|---|
| **Tax Wizard** | Dual-regime slab tax (Old vs New, FY 2025-26), HRA exemption, 80C / 80D / 80CCD(1B) / Sec 24 gap analysis, risk-profiled investment recommendations |
| **FIRE Planner** | Inflation-adjusted retirement corpus, binary-search SIP solver with annual step-up, year-by-year trajectory, goal-bucketed monthly roadmap, minimum feasible retirement age |
| **Portfolio X-Ray** | Newton-Raphson XIRR, category allocation mapping, stock overlap scoring, expense ratio drag (₹/year), category-weighted benchmark alpha, prioritised rebalancing steps |
| **Life Event Advisor** | Event-specific allocation (bonus / marriage / baby / inheritance / job loss / custom goal), FIRE-delta comparison before vs after, tax heuristics, NLP goal detection from free text |
| **Couples Planner** | Joint HRA optimisation (argmax claimant), 80C split strategy, NPS gap matching, income-weighted SIP allocation, combined net worth, insurance gap detection |
| **Money Health Score** | Weighted 6-dimension score (Emergency · Insurance · Investment · Debt · Tax · Retirement) with actionable narrative per dimension |
| **Multi-Agent Orchestrator** | Intent classification → cost-tiered model routing (Llama-3.1-8B → Gemini Flash → Gemini Pro), session cost tracking, structured explainability layer |
| **Document Intelligence** | CSV/PDF mutual fund CAS statement parsing with fuzzy header matching, Form 16 OCR with field extraction, Indian number formatting |

---

## Section 1 — Enterprise Impact (B2B Deployment)

**Scenario:** A mid-size wealth management firm, digital bank, or mutual fund distributor deploys FinSight-AI as a white-labeled advisory layer for **10,000 active retail/HNI clients**.

---

### 1A. Time Saved — Operational Efficiency

**The Problem:**
Relationship Managers spend significant time on repetitive, low-leverage work: collecting Form 16 PDFs, manually entering salary breakdowns, calculating tax regimes in spreadsheets, eyeballing portfolio overlap, and running basic FIRE projections. This work requires domain knowledge but not judgment.

**What FinSight-AI Replaces:**

| Manual Task | RM Time / Client / Year | AI Replacement | Time After AI |
|---|---|---|---|
| Form 16 collection + data entry | ~45 min | OCR parser → auto-populated profile | ~2 min (review only) |
| Old vs New regime comparison | ~30 min | `taxEngine.js` — instant dual-slab compute | ~0 min |
| Portfolio overlap + rebalancing advice | ~40 min | `portfolioEngine.js` — XIRR, overlap, benchmark alpha | ~5 min (review) |
| FIRE corpus estimation + SIP sizing | ~35 min | `fireEngine.js` — binary-search SIP solver | ~0 min |
| Life event ad-hoc advice | ~20 min | `lifeEventEngine.js` — templated plan with FIRE delta | ~3 min |
| Couples joint optimisation | ~30 min | `couplesEngine.js` — HRA argmax, 80C split | ~2 min |
| **Total** | **~200 min (~3.3 hrs)** | | **~12 min** |

**The Math:**

```
Time saved per client per year     =  ~3 hours (200 min → 12 min = 188 min ≈ 3 hrs)
Number of clients                  =  10,000
Total hours saved                  =  30,000 hours
Fully-loaded RM cost               =  ₹500/hour (India Tier-1 city blended: salary + benefits + overhead)

Value of time saved                =  30,000 × ₹500
                                   =  ₹1,50,00,000
                                   =  ₹1.50 Crore
```

**What This Unlocks:**
An RM serving 200 clients frees up **600 hours/year** — equivalent to gaining 1 additional RM per 3 existing ones without hiring. Freed capacity redirects to high-value activities: closing referrals, handling complex estate cases, deepening wallet share.

---

### 1B. Cost Reduced — Processing + Retention + Escalation

#### 1B-i. Document Processing Automation

Most firms either have a back-office team or outsource document ingestion (Form 16 PDFs, CAS statements, salary slips) to BPO/KPO partners.

The AI's statement parser handles CSV parsing with fuzzy header matching (`scheme name`, `fund name`, `security name` all resolve to the same field), and the Form 16 OCR pipeline extracts gross salary, basic salary, HRA, and deduction fields — replacing manual keying entirely.

```
Manual processing cost per document     =  ₹50
Avg documents per client per year       =  2  (1× Form 16 + 1× CAS/portfolio statement)
Total documents                         =  20,000
Processing cost eliminated              =  20,000 × ₹50
                                        =  ₹10,00,000
```

#### 1B-ii. Customer Retention Improvement

FinSight-AI provides continuous, personalised engagement that commodity platforms cannot:
- The **Money Health Score** gives users a reason to return monthly (gamified 6-dimension scoring)
- The **Life Event Advisor** ties the platform to life milestones (marriage, baby, job change)
- The **Tax Wizard** creates a natural annual touchpoint pre-March 31
- The **FIRE trajectory chart** shows year-by-year progress — users track it like a fitness app

```
Baseline annual churn                   =  15%  (industry average for digital wealth platforms)
Churn reduction from AI engagement      =  5 percentage points (retaining 1 in 3 would-be churners)
Users retained                          =  10,000 × 5% = 500
Average Customer Acquisition Cost       =  ₹2,000  (blended digital CAC for Indian fintech)
Avoided re-acquisition cost             =  500 × ₹2,000
                                        =  ₹10,00,000
```

#### 1B-iii. Reduced Advisory Escalation Load

When users receive structured, explainable advice (the reasoning layer provides assumptions, sensitivity analysis, and confidence scores for every output), they escalate fewer simple queries to human advisors.

```
Avg escalation calls per user per year  =  4  (industry observation for advisory platforms)
Calls deflected by AI self-service      =  50% (2 calls)  (structured insights answer "why" before user calls)
Cost per escalation call                =  ₹150  (blended call-centre cost: 5 min avg × RM time)
Escalation cost saved                   =  10,000 × 2 × ₹150
                                        =  ₹30,00,000
```

#### Total Cost Reduction

```
Document processing                     =  ₹10,00,000
Churn-avoided re-acquisition            =  ₹10,00,000
Escalation deflection                   =  ₹30,00,000
                                        ─────────────
Total                                   =  ₹50,00,000  (₹50 Lakh)
```

---

### 1C. Revenue Generated — Cross-sell + AUM Consolidation + Life Events

#### 1C-i. Tax-Gap-Driven Product Cross-Sell

The Tax Wizard doesn't just compare regimes — it actively surfaces **unused deduction headroom** with specific product recommendations. The engine calculates the exact ₹ gap (e.g., `Math.max(0, 150000 - section80C)` for 80C) and ranks products by liquidity and risk alignment:

- 80C gap → recommends ELSS / PPF (risk-profile adjusted: aggressive users get ELSS, conservative get PPF split)
- 80CCD(1B) gap → recommends NPS Tier-I
- 80D gap → recommends health insurance

```
Users with ≥1 unfilled deduction gap    =  70% (7,000)   (most salaried Indians under-utilise 80CCD(1B) and 80D)
Conversion rate on AI recommendation    =  5%             (conservative for contextualised, in-flow nudges)
Users converting                        =  7,000 × 5% = 350
Avg first-year revenue per product      =  ₹5,000         (commission + trail, blended across ELSS/NPS/insurance)
Cross-sell revenue                      =  350 × ₹5,000
                                        =  ₹17,50,000
```

#### 1C-ii. AUM Consolidation from Portfolio X-Ray

Portfolio X-Ray encourages users to upload *external* CAS statements. Once analysed, the AI shows:
- **Expense ratio drag** (quantified in ₹/year: `totalValue × avgExpenseRatio / 100`)
- **Fund overlap** (overlapping stocks across active funds, scored as Low / Medium / High)
- **Benchmark underperformance** (category-weighted blended alpha, computed via Newton-Raphson XIRR vs benchmark XIRR)

This naturally prompts users to consolidate underperforming external funds onto the native platform.

```
Users uploading external statements     =  25% (2,500)   (feature drives curiosity; doc upload friction is low)
Users migrating assets                  =  15% of uploaders = 375
Average migration amount                =  ₹2,00,000     (mix of SIP consolidations and larger switches)
New AUM added                           =  375 × ₹2,00,000 = ₹7.5 Crore
Platform margin on AUM                  =  0.8%           (industry standard for direct MF distribution)
Annual AUM revenue                      =  ₹7,50,00,000 × 0.8%
                                        =  ₹6,00,000
```

*Note: AUM revenue is **recurring** — ₹6L in Year 1 grows as clients add more + market appreciation. At 12% blended growth, this becomes ₹8.4 Cr AUM and ₹6.72L revenue by Year 2 without any new migration.*

#### 1C-iii. Life Event Monetisation Windows

Each life event the AI processes creates a natural product window:

| Life Event | Products Surfaced | Avg Revenue per Conversion |
|---|---|---|
| Marriage | Joint term insurance, health floater upgrade | ₹8,000 |
| New Baby | Child education SIP, SSY account, health rider | ₹6,000 |
| Bonus | ELSS lumpsum, NPS top-up | ₹4,000 |
| Inheritance | STP into equity MFs, debt allocation | ₹12,000 |

```
Users triggering ≥1 life event/year     =  15% (1,500)
Conversion rate                         =  8%
Users converted                         =  120
Average revenue per conversion          =  ₹7,000
Life event revenue                      =  120 × ₹7,000
                                        =  ₹8,40,000
```

#### Total Revenue Generated

```
Tax-gap cross-sell                      =  ₹17,50,000
AUM consolidation                       =  ₹6,00,000
Life event products                     =  ₹8,40,000
                                        ─────────────
Total                                   =  ₹31,90,000  (~₹32 Lakh)
```

---

### B2B Impact Summary

| Impact Dimension | Annual Value | Key Driver |
|---|---|---|
| 🕐 **Time Saved** | **₹1.50 Crore** | 30,000 RM hours freed across 6 automated workflows |
| 💸 **Cost Reduced** | **₹50 Lakh** | Document processing + churn prevention + escalation deflection |
| 📈 **Revenue Generated** | **₹32 Lakh** | Tax-gap cross-sell + AUM consolidation + life event products |
| | | |
| **Total Annual Impact** | **₹2.32 Crore** | **Per 10,000 users** |

**At 1,00,000 users**, this scales to approximately **₹20+ Crore** annual impact — but software infrastructure costs remain nearly flat, dramatically improving the ROI ratio.

---

## Section 2 — Consumer Impact (B2C End-User)

**Scenario:** A salaried individual, age 28, earning ₹15 LPA (₹1.25L/month), living in a metro city, with a ₹10,00,000 investment portfolio.

---

### 2A. Time Saved

| Manual Activity | Time (Without AI) | Time (With AI) |
|---|---|---|
| Understanding Old vs New tax regime | 3–4 hours | < 1 minute (instant dual-regime output with recommendation) |
| Calculating FIRE number + required SIP | 2–3 hours | < 1 minute (binary-search solver with step-up) |
| Checking portfolio overlap + rebalancing | 2–3 hours | < 2 minutes (upload CAS → instant analysis) |
| Planning for life event (marriage / baby) | 3–4 hours | < 1 minute (structured plan with FIRE delta) |
| Comparing couples' tax optimisation | 2–3 hours | < 1 minute (HRA argmax + 80C split) |
| **Total** | **12–17 hours / year** | **~10 minutes** |

**Impact:** ~2 full working days saved annually.

This isn't just clock time — it's *decision latency*. Without the AI, many of these tasks get procrastinated for weeks or months, during which the user loses compounding time on uninvested surplus.

---

### 2B. Cost Reduced — Professional Fees Avoided

| Service | Typical Annual Cost | Replaced By |
|---|---|---|
| Chartered Accountant (basic tax filing + advice) | ₹2,500 – ₹5,000 | Tax Wizard (regime comparison + gap analysis) |
| Fee-only financial planner (1 session) | ₹3,000 – ₹8,000 | FIRE Planner + Health Score + Life Event Advisor |
| Portfolio review service | ₹2,000 – ₹5,000 | Portfolio X-Ray (XIRR, overlap, rebalancing) |
| **Total professional fees avoided** | **₹7,500 – ₹18,000** | |

**Conservative estimate: ₹10,000 / year** in direct out-of-pocket savings.

*Note: This doesn't mean never consult a CA — complex situations (multiple properties, capital gains, business income) still warrant professional advice. But for 80%+ of salaried individuals, the AI covers the standard planning surface.*

---

### 2C. Revenue Recovered — Direct Wealth Impact

#### 2C-i. Tax Optimisation (Missed Deductions Recovered)

The Tax Wizard identifies *specific* unused deduction sections. For our persona:

| Deduction Section | Typical Gap | Tax Saved (at 20–30% marginal rate) |
|---|---|---|
| 80C (ELSS / PPF / EPF shortfall) | ₹30,000 – ₹80,000 | ₹6,000 – ₹24,000 |
| 80CCD(1B) (NPS — most people skip this entirely) | ₹50,000 | ₹10,000 – ₹15,000 |
| 80D (Health insurance — often employer-only, no family cover) | ₹10,000 – ₹25,000 | ₹2,000 – ₹7,500 |
| HRA (paying rent but not claiming, or suboptimal claim) | Varies | ₹5,000 – ₹20,000 |

```
Total tax recovered (conservative)     =  ₹20,000 / year
```

This is money that stays in the user's pocket instead of going to the exchequer unnecessarily.

#### 2C-ii. Portfolio Optimisation (Expense Ratio + Overlap Reduction)

The Portfolio X-Ray quantifies three levers:

**Expense Ratio Drag:**
```
Portfolio value                         =  ₹10,00,000
Average TER (regular plans)             =  1.8%
Average TER (direct plans)              =  0.5%
Annual fee saved by switching           =  ₹10,00,000 × (1.8% – 0.5%)
                                        =  ₹13,000 / year
```

**Overlap Reduction + Rebalancing Alpha:**
Consolidating 5 overlapping active funds into 2 diversified funds reduces concentration risk. Even a 1% improvement in CAGR on ₹10L = ₹10,000/year in Year 1, compounding thereafter.

```
TER reduction (regular → direct)        =  ₹10,000 – ₹15,000
Alpha improvement (rebalancing)         =  ₹10,000 – ₹20,000
                                        ─────────────
Total portfolio impact (conservative)   =  ₹15,000 / year
```

**Compounding effect:** Over 20 years at 12% CAGR, a 1% annual improvement on ₹10L compounds to an additional **₹7.5 Lakh** in terminal wealth.

#### 2C-iii. Behavioural Value (Harder to Quantify, Arguably Largest)

The system creates structured forcing functions:

- **FIRE Planner** shows the exact retirement age impact of spending ₹5,000 more per month — making lifestyle inflation *visible*
- **Life Event Advisor** prevents panic decisions (e.g., redeeming equity during job loss — the engine explicitly warns: *"Do not redeem long-term equity unless EF exhausted"*)
- **Health Score** gamifies financial discipline — users with a visible score naturally compete with themselves
- **Couples Planner** prevents the #1 cause of financial friction in marriages: misaligned assumptions about money

```
Estimated behavioural value             =  ₹15,000 / year
(prevented panic sells, maintained SIP discipline, avoided over-insurance)
```

---

### B2C Impact Summary

| Impact Dimension | Annual Value | 20-Year Compounded Effect |
|---|---|---|
| 🕐 Time Saved | ~2 working days | ~40 working days (1.5 months of life) |
| 💸 Professional Fees Saved | ₹10,000 | ₹2,00,000 |
| 💰 Tax Recovered | ₹20,000 | ₹4,00,000 |
| 📊 Portfolio Optimised | ₹15,000 | ₹7,50,000+ (compounding) |
| 🧠 Behavioural Value | ₹15,000 | ₹5,00,000+ (prevented mistakes) |
| | | |
| **Total per User** | **₹60,000 / year** | **₹18,50,000+ over 20 years** |

**The single most impactful number:** A salaried Indian using FinSight-AI is conservatively **₹60,000/year better off**. Over a 20-year career, this compounds to nearly **₹20 Lakh** in additional wealth.

---

## Section 3 — AI System Cost Efficiency

The multi-agent orchestrator is designed for cost-efficient inference using tiered model routing:

| Model Tier | Used For | Cost / Call |
|---|---|---|
| Llama-3.1-8B | Intent classification + routing | $0.0001 |
| Gemini-2.0-Flash | Health score, Tax, Life Events | $0.002 |
| Gemini-1.5-Pro | FIRE (complex projections), Portfolio XIRR, Couples | $0.015 |

```
Blended cost per user session           =  ~$0.02 (₹1.70)
Users × sessions                        =  10,000 × 4 sessions/month
Monthly AI compute cost                 =  ₹6,80,000
Annual AI compute cost                  =  ₹81,60,000 (~₹82 Lakh)

ROI                                     =  ₹2.32 Crore value / ₹82 Lakh cost
                                        =  2.8× return
```

**Critical note:** Since all computation engines (tax, FIRE, portfolio, couples, health) run **entirely client-side in the browser**, the actual server-side AI cost is limited to the orchestrator's model calls. Real-world cost is likely **60–70% lower** than the estimate above, pushing ROI to **7–9×**.

---

## Section 4 — Assumption Table

| # | Assumption | Value Used | Sensitivity |
|---|---|---|---|
| 1 | Active user base | 10,000 | Results scale linearly; fixed costs flatten at scale |
| 2 | RM hourly cost (fully loaded) | ₹500 | Range: ₹350–₹700 depending on city and seniority |
| 3 | Cross-sell conversion rate | 5% | Conservative; could be 3–8% depending on product fit |
| 4 | AUM migration rate | 15% of uploaders | Some platforms see 20–25% |
| 5 | Users with ≥1 unused deduction gap | 70% | Well-supported by tax filing data; most skip 80CCD(1B) |
| 6 | Expected portfolio return | 12% | Long-term Nifty 50 CAGR; range 10–14% |
| 7 | Inflation assumption | 6% | RBI upper tolerance band; range 4–7% |
| 8 | Safe Withdrawal Rate | 3.5% | Indian FIRE standard (stricter than US 4% rule) |
| 9 | Avg documents per user/year | 2 | 1× Form 16 + 1× CAS statement |
| 10 | Escalation calls deflected | 50% | Structured explainability answers "why" before user calls |

---

## Section 5 — What This Model Does NOT Capture

For intellectual honesty, here's what is excluded from the numbers above:

1. **Brand and trust premium** — A platform that explains *why* it recommends something (the reasoning layer provides assumptions, sensitivity, and confidence scores) commands higher trust and pricing power. Not quantified.

2. **Regulatory compliance savings** — Structured, explainable advice with audit trails (the `explanationLog` in every engine output) reduces compliance risk under SEBI advisory regulations. Not quantified.

3. **Data network effects** — As more users input profiles, the system can benchmark against peers ("you save more than 72% of users in your bracket"). Architecture supports it; not yet built.

4. **Couples Planner viral loop** — Every couples planning session requires *two* users to input data. This is a built-in acquisition channel with zero marginal cost. Not quantified.

5. **Second-order compounding** — Tax savings reinvested into ELSS creates a virtuous cycle: save tax → invest → earn returns → save more tax. The models compute first-order only.

6. **Privacy premium** — Zero-knowledge, client-side architecture (no data leaves the browser) is a real differentiator in a post-data-breach world. Not quantified.

---

## Final Takeaway

| Stakeholder | Annual Impact | Primary Mechanism |
|---|---|---|
| **Enterprise (per 10K users)** | **₹2.32 Crore** | RM hours freed + churn prevention + intelligent cross-sell |
| **Consumer (per user)** | **₹60,000** | Tax recovery + portfolio optimisation + fee savings |
| **Consumer (20-year wealth)** | **₹18.5 Lakh+** | Compounding of annual optimisations |

The strength of FinSight-AI isn't any single number — it's the **compounding flywheel**: better tax decisions fund better investments, which improve health scores, which increase engagement, which surface more life-event opportunities, which drive more advisory value. Every engine feeds into the next.

**The system doesn't just save time — it actively improves financial outcomes.** The difference between *"I'll figure out taxes later"* and *"I can see I'm leaving ₹20,000 on the table right now"* is the difference between intention and action. That's what automation with explainability delivers.

---

*All figures use FY 2025-26 Indian tax rules. Computations reference production engines in `/src/engine/`. Assumptions are conservative and independently adjustable. This is a directional model, not a financial projection.*

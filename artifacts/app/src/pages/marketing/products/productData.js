import {
  Fingerprint, ShieldCheck, Network, ShieldAlert, BarChart3,
  Shield, Database, Bot, Target, Code2,
} from "lucide-react";

/**
 * Detail-page data for /products/<slug>.
 * Each entry powers the shared ProductDetail layout.
 */
export const PRODUCT_DETAILS = {
  /* =========================================================
   * Proof of Human Platform — 5 core engines
   * ========================================================= */
  "human-authenticity-intelligence": {
    parent: { label: "Proof of Human Platform", to: "/products/proof-of-human-platform" },
    eyebrow: "Human Authenticity Intelligence",
    title: "Identify Real Humans with Confidence",
    icon: Fingerprint,
    accent: "trusted",
    lead:
      "Determine in real time whether a visitor is a genuine human or an automated, fraudulent or low-quality interaction. Every session is scored on multiple layers of evidence — not a single fingerprint.",
    body:
      "PoH continuously evaluates device, network, behavioral and historical signals to produce a Human Authenticity Score on a 0–100 scale, backed by explicit reason codes. Use it to suppress bots, clean up analytics and protect every downstream decision.",
    evaluates: [
      "Device fingerprint integrity & recurrence",
      "Network origin (datacenter, VPN, proxy, Tor)",
      "Browser automation & headless signatures",
      "Behavioral depth (mouse, scroll, keyboard, dwell)",
      "Page interaction sequencing & timing",
      "Hardware & software anomaly indicators",
      "Cross-session pattern repetition",
    ],
    outputCard: { label: "Human Authenticity Score", value: 92, sub: "REAL HUMAN · HIGH CONFIDENCE" },
    benefits: [
      "Identify automated and fraudulent visitors",
      "Reduce bot traffic and invalid sessions",
      "Improve marketing data quality",
      "Protect lead funnels from junk submissions",
      "Strengthen security posture",
      "Deliver more accurate analytics",
    ],
    idealFor: ["Marketing Teams", "Ecommerce", "SaaS", "Agencies", "Enterprises", "Security Teams"],
  },

  "trust-intelligence": {
    parent: { label: "Proof of Human Platform", to: "/products/proof-of-human-platform" },
    eyebrow: "Trust Intelligence",
    title: "Understand Who Can Be Trusted",
    icon: ShieldCheck,
    accent: "trusted",
    lead:
      "Beyond authenticity, PoH measures behavioral trustworthiness — how a visitor engages, how consistent they are, and whether their actions match a healthy human profile.",
    body:
      "Trust is a continuous, evidence-backed signal. PoH combines engagement consistency, identity recurrence, behavioral coherence and historical reputation to produce a Trust Score and tier — feeding personalization, friction control and downstream automation.",
    evaluates: [
      "Engagement consistency over time",
      "Identity recurrence across sessions",
      "Behavioral coherence vs. healthy human profile",
      "Historical risk and abuse signals",
      "Cross-session reputation patterns",
      "Velocity & frequency anomalies",
    ],
    outputCard: { label: "Trust Score", value: 87, sub: "TRUSTED · LOW RISK" },
    benefits: [
      "Prioritize high-trust visitors",
      "De-prioritize suspicious activity",
      "Improve conversion segmentation",
      "Strengthen retention models",
      "Power smarter personalization",
      "Reduce friction for trusted users",
    ],
    idealFor: ["Ecommerce", "SaaS", "Fintech", "Marketing Teams", "Product Teams"],
  },

  "traffic-intelligence": {
    parent: { label: "Proof of Human Platform", to: "/products/proof-of-human-platform" },
    eyebrow: "Traffic Intelligence",
    title: "See Where Your Traffic Comes From",
    icon: Network,
    accent: "review",
    lead:
      "Understand the true origin and quality of every traffic source — paid, organic, direct, referral or social — beyond what your analytics platforms show.",
    body:
      "PoH classifies every channel, validates attribution and surfaces dark traffic. Combine source attribution with authenticity to see real-human traffic volume per channel — not just sessions.",
    evaluates: [
      "Channel classification (paid, organic, direct, referral, email, affiliate, bot)",
      "Source attribution (Google, Meta, TikTok, LinkedIn, Bing, YouTube, partners)",
      "Dark-traffic detection",
      "Affiliate and referral validation",
      "UTM and click-id integrity",
      "Cross-channel deduplication",
    ],
    benefits: [
      "Identify low-quality channels",
      "Validate attribution",
      "Detect dark traffic",
      "Improve channel-level ROAS",
      "Surface hidden fraud sources",
      "Inform spend allocation",
    ],
    idealFor: ["Performance Marketing", "Agencies", "Ecommerce", "B2B SaaS", "RevOps"],
  },

  "revenue-protection": {
    parent: { label: "Proof of Human Platform", to: "/products/proof-of-human-platform" },
    eyebrow: "Revenue Protection",
    title: "Protect Revenue from Fraud and Waste",
    icon: ShieldAlert,
    accent: "fraud",
    lead:
      "Stop fraud from converting. PoH suppresses fake conversions, blocks abusive traffic and protects margins across acquisition, payments and customer operations.",
    body:
      "Every protective action is tied to a reason code and full evidence trail — defensible with ad networks, finance and compliance. Revenue Protection plugs directly into your pixels, CRM, payment processor and ad platforms.",
    evaluates: [
      "Fake & incentivized conversion suppression",
      "Click & lead fraud detection",
      "Promo, coupon & loyalty abuse",
      "Account farming & multi-accounting",
      "Refund & chargeback risk signals",
      "Affiliate fraud and false attribution",
    ],
    outputCard: { label: "Fraud Risk", value: 14, sub: "LOW · NO ACTION", inverse: true },
    benefits: [
      "Suppress fake conversions",
      "Block click & lead fraud",
      "Prevent payment & promo abuse",
      "Reduce chargebacks",
      "Protect ad budgets",
      "Improve lifetime customer value",
    ],
    idealFor: ["Ecommerce", "Fintech", "Subscription SaaS", "Marketplaces", "Performance Marketing"],
  },

  "analytics-operations": {
    parent: { label: "Proof of Human Platform", to: "/products/proof-of-human-platform" },
    eyebrow: "Analytics & Operations",
    title: "Turn Intelligence into Action",
    icon: BarChart3,
    accent: "review",
    lead:
      "All the dashboards, exports, alerts and APIs your team needs to operationalize trust intelligence — from boardroom KPIs to investigator workflows.",
    body:
      "Push verdicts to GA4, Google Ads, Meta Ads, HubSpot, Slack, BigQuery, S3 and webhooks. Stream every event to your stack and tune sensitivity to your risk appetite — without leaving the tools your team already uses.",
    evaluates: [
      "Real-time dashboards & KPI views",
      "Executive & investor reporting",
      "Investigator queues & case workflows",
      "Webhook + REST APIs",
      "Alerts, thresholds & anomaly detection",
      "Custom rules engine & automation",
    ],
    benefits: [
      "Real-time dashboards",
      "Executive reporting",
      "Investigator queues",
      "Webhook + API delivery",
      "Alerts & anomaly detection",
      "Custom rules & automation",
    ],
    idealFor: ["RevOps", "Marketing Ops", "Fraud Operations", "Security Teams", "Data Teams"],
  },

  /* =========================================================
   * Premium Modules — 5 expansion modules
   * ========================================================= */
  "ad-shield": {
    parent: { label: "Premium Modules", to: "/products/premium-modules" },
    eyebrow: "Ad Shield",
    title: "Stop Wasting Advertising Budget on Invalid Traffic",
    icon: Shield,
    accent: "trusted",
    lead:
      "Ad Shield continuously monitors paid traffic and advertising campaigns to identify invalid clicks, fraudulent traffic, bots, click farms, and suspicious activity before they consume marketing budgets.",
    body:
      "By analyzing authenticity, behavior, and traffic quality in real time, Ad Shield helps organizations ensure advertising dollars are being spent on genuine human engagement rather than automated or fraudulent interactions.",
    evaluates: [
      "Invalid click detection",
      "Click-farm & coordinated abuse patterns",
      "Datacenter & proxy traffic origin",
      "Competitor click abuse signals",
      "Anomalous click-to-conversion timing",
      "Source- and campaign-level quality scoring",
    ],
    benefits: [
      "Reduce click fraud",
      "Protect advertising budgets",
      "Improve return on ad spend (ROAS)",
      "Identify low-quality traffic sources",
      "Detect competitor click abuse",
      "Improve campaign performance",
    ],
    idealFor: ["Ecommerce", "Lead Generation", "Agencies", "SaaS Companies", "Performance Marketing Teams"],
  },

  "fraud-memory-cloud": {
    parent: { label: "Premium Modules", to: "/products/premium-modules" },
    eyebrow: "Fraud Memory Cloud",
    title: "Learn From Every Fraud Attempt",
    icon: Database,
    accent: "fraud",
    lead:
      "Fraud Memory Cloud is a continuously growing intelligence repository that stores known fraud indicators, suspicious devices, behavioral patterns, attack signatures, and historical risk signals.",
    body:
      "As new threats are identified, the platform becomes smarter and more effective at recognizing similar activity across future sessions. This shared intelligence layer allows organizations to benefit from historical fraud knowledge and accelerate threat detection.",
    evaluates: [
      "Known device & fingerprint blocklists",
      "Recurring attack signatures",
      "Behavioral pattern memory",
      "Cross-org anonymized risk signals",
      "Historical case clustering",
      "Reputation decay & re-scoring",
    ],
    benefits: [
      "Detect repeat offenders faster",
      "Identify known fraud patterns",
      "Improve detection accuracy",
      "Reduce false positives",
      "Accelerate investigations",
      "Strengthen fraud defenses over time",
    ],
    idealFor: ["Ecommerce Platforms", "Financial Services", "SaaS Providers", "Agencies", "Enterprise Organizations"],
  },

  "ai-fraud-analyst": {
    parent: { label: "Premium Modules", to: "/products/premium-modules" },
    eyebrow: "AI Fraud Analyst",
    title: "Your Always-On Fraud Investigation Assistant",
    icon: Bot,
    accent: "review",
    lead:
      "AI Fraud Analyst acts as an intelligent investigation layer that continuously analyzes platform data, identifies anomalies, explains suspicious activity, and recommends corrective actions.",
    body:
      "Instead of manually searching through dashboards and reports, teams receive AI-generated insights that help quickly understand what happened, why it happened, and what to do next.",
    evaluates: [
      "Anomaly detection across sessions and campaigns",
      "Suspicious session deep-dives",
      "Pattern-of-pattern attack discovery",
      "Natural-language incident explanations",
      "Recommended next-best actions",
      "Executive summary generation",
    ],
    benefits: [
      "Explain fraud incidents automatically",
      "Surface hidden threats",
      "Investigate suspicious sessions",
      "Identify emerging attack patterns",
      "Generate executive summaries",
      "Accelerate fraud investigations",
    ],
    idealFor: ["Security Teams", "Fraud Operations", "Marketing Teams", "Compliance Teams", "Enterprise Organizations"],
  },

  "intent-intelligence": {
    parent: { label: "Premium Modules", to: "/products/premium-modules" },
    eyebrow: "Intent Intelligence",
    title: "Understand Why Visitors Are Really There",
    icon: Target,
    accent: "review",
    lead:
      "Intent Intelligence analyzes behavioral signals and engagement patterns to determine the likely purpose behind a visitor's actions.",
    body:
      "The platform evaluates indicators that may suggest purchasing intent, research intent, competitive intelligence gathering, automated activity, or potentially malicious behavior. This provides organizations with a deeper understanding of visitor motivations beyond traditional analytics metrics.",
    evaluates: [
      "Buying-intent behavioral signals",
      "Research vs. ready-to-buy classification",
      "Competitive intel & scraping signatures",
      "Automated activity detection",
      "Malicious intent patterns",
      "Funnel-stage intent scoring",
    ],
    benefits: [
      "Identify high-intent prospects",
      "Improve lead prioritization",
      "Detect suspicious behavior",
      "Enhance sales intelligence",
      "Improve conversion optimization",
      "Understand visitor motivations",
    ],
    idealFor: ["B2B Companies", "SaaS Organizations", "Ecommerce Businesses", "Sales Teams", "Marketing Teams"],
  },

  "trust-apis": {
    parent: { label: "Premium Modules", to: "/products/premium-modules" },
    eyebrow: "Trust API Pack",
    title: "Bring Human Authenticity Intelligence Into Any Application",
    icon: Code2,
    accent: "trusted",
    lead:
      "The Trust API Pack provides developers with direct access to PoH intelligence services through secure APIs.",
    body:
      "Applications can perform real-time authenticity verification, trust validation, risk analysis, and fraud assessments directly within existing workflows and systems. Organizations can embed PoH intelligence anywhere decisions need to be made.",
    evaluates: [
      "Real-time authenticity verification",
      "Trust validation endpoints",
      "Risk & fraud assessment APIs",
      "Webhook event streams",
      "Server-to-server scoring",
      "SDKs for major languages",
    ],
    benefits: [
      "Verify visitors in real time",
      "Validate customers and users",
      "Integrate trust scoring into applications",
      "Enhance fraud prevention systems",
      "Improve automated decision making",
      "Extend PoH across your technology stack",
    ],
    idealFor: ["Software Developers", "SaaS Platforms", "Enterprise Applications", "Ecommerce Systems", "Identity Workflows"],
  },
};

export const PRODUCT_SLUGS = Object.keys(PRODUCT_DETAILS);

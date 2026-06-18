import LegalPage from "@/components/marketing/LegalPage";

const FLOW_DIAGRAM = `                  ┌─────────────────────────────────────────┐
                  │          The Web User Session           │
                  └────────────────────┬────────────────────┘
                                       │
                      Has user provided consent or
                      is the script strictly for fraud?
                                       │
                ┌──────────────────────┴──────────────────────┐
                ▼                                             ▼
     [ Strictly Fraud/Security ]                  [ Analytics & Attribution ]
       Rely on Legitimate Interests                 Requires Opt-In Consent
       (GDPR Art 6 / CCPA Exempt)                   (ePrivacy / CCPA GPC Check)
                │                                             │
                └──────────────────────┬──────────────────────┘
                                       │
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │            The SDK Pipeline             │
                  │  • Hashed Fingerprints                  │
                  │  • No Text Field Capture                │
                  │  • Auto-Purge Raw Logs (3-6 Months)     │
                  └─────────────────────────────────────────┘`;

const SECTIONS = [
  {
    label: "Section 1",
    heading: "General Data Protection Regulation (GDPR) Compliance",
    body: [
      "Under the GDPR, when the PoH JavaScript SDK captures data from a client's website, **the client is the Data Controller** and **PoH is the Data Processor**.",
    ],
    subsections: [
      {
        heading: "Lawful Basis for Processing",
        list: [
          "**For Security & Fraud Prevention (The Core Scoring Engine):** The processing of behavioral and device metadata to block automated click-fraud and malicious bots qualifies under **Article 6(1)(f) — Legitimate Interests**. Fraud prevention is explicitly recognized as a legitimate interest under GDPR Recital 47.",
          "**For Marketing Attribution & Analytics (The Human ROAS Dashboard):** When telemetry is used to analyze ad-campaign ROI or track conversion pathways rather than purely securing infrastructure, it shifts closer to an analytics tracking technology. For these specific activities, the client (the Controller) must obtain **Prior Affirmative Consent** via a cookie or consent banner before firing the script.",
        ],
      },
      {
        heading: "Data Protection Principles Embedded in PoH",
        list: [
          "**Data Minimization (Article 5(1)(c)):** The SDK does not read input text inside form fields (preventing PII or password leaks) and only reads mechanical interaction entropy.",
          "**Storage Limitation (Article 5(1)(e)):** High-granularity raw session telemetry logs (mouse vectors, hardware specifications) are automatically purged or completely stripped of IP anchors within **3 to 6 months**. Only anonymized, aggregated trend metrics remain in the dashboard long-term.",
          "**Automated Decision-Making (Article 22):** The GDPR restricts automated decisions that produce \"legal or similarly significant effects\" on individuals without human intervention. Because PoH's real-time decisions are designed to block invalid bot traffic or filter non-human ad fraud rather than profiling consumers for credit, employment, or housing eligibility, it does not typically cross into Article 22 restrictions. However, if clients use webhooks to automatically block access to certain human services based solely on a low risk score, the system provides a pathway to log anomalies and request human review.",
        ],
      },
    ],
  },
  {
    label: "Section 2",
    heading: "California Consumer Privacy Act (CCPA / CPRA) Compliance",
    body: [
      "The California Privacy Protection Agency (CPPA) rules impose strict operational standards on data gathering, script transparency, and consumer choice. Under the CCPA, **PoH acts as a Service Provider** to its business clients.",
    ],
    subsections: [
      {
        heading: "Prohibitions on Data \"Selling\" or \"Sharing\"",
        body: [
          "Under the CCPA, \"sharing\" specifically applies to cross-context behavioral advertising.",
        ],
        list: [
          "**The Guarantee:** PoH operates under strict Service Provider contract clauses. The data collected by the SDK on a specific client property is **never aggregated or sold** to build multi-site consumer profiles, nor is it utilized for cross-context behavioral ad targeting. It is used exclusively to evaluate traffic quality and protect that specific client's marketing spend.",
        ],
      },
      {
        heading: "Opt-Out Signal Processing (Global Privacy Control)",
        list: [
          "**Automated Acknowledgement:** The backend infrastructure is built to respect browser-level opt-out mechanisms.",
          "**The Confirmation Rule:** Under the CCPA regulations, covered commercial websites must explicitly display whether a consumer's automated opt-out preference signal has been recognized and processed on the site (e.g., dynamically showing a toggle indicator stating \"Opt-Out Request Honored\"). When a user communicates an opt-out signal via a Global Privacy Control (GPC) header, the PoH SDK pipeline stops any downstream marketing attribution lookups, logging only minimal, isolated security data necessary to protect against distributed denial-of-service (DDoS) or brute-force bot incursions.",
        ],
      },
      {
        heading: "Freedom From \"Dark Patterns\"",
        body: [
          "The CCPA strictly prohibits manipulative UI configurations — known as \"dark patterns\" — designed to subvert or complicate a user's choice to opt out.",
        ],
        list: [
          "**Symmetrical Design Framework:** Any privacy-preference tools, dashboard modals, or consent elements built by PoH or offered via widgets ensure that opting out or declining tracing takes exactly the same number of steps, prominence, and visual weight as opting in. Closing an overlay without a clear action can no longer be twisted into implied consent.",
        ],
      },
    ],
  },
  {
    label: "Section 3",
    heading: "Compliance Blueprint for PoH & Its Clients",
    body: [
      "To preserve legal integrity across both regimes, Evo Technology Group, LLC incorporates a dual protection model:",
    ],
    pre: FLOW_DIAGRAM,
    subsections: [
      {
        heading: "1. The Data Processing Agreement (DPA)",
        body: [
          "Every corporate client signing up via Stripe must execute a standardized DPA. This contract locks PoH into its role as a data processor / service provider, limits data use exclusively to the client's instructions, and guarantees assistance if an end-user submits a Data Subject Access Request (DSAR) to view or delete data entries.",
        ],
      },
      {
        heading: "2. The Client Disclosure Mandate",
        body: [
          "Clients are contractually required to update their own online Notice at Collection and comprehensive privacy policies. They must explicitly document that they utilize third-party telemetry tools to monitor user behavior patterns, browser features, and device metrics for the sole purpose of assessing click authenticity and maintaining security posture.",
        ],
      },
    ],
  },
];

export default function GDPRCCPA() {
  return (
    <LegalPage
      testId="page-gdpr-ccpa"
      eyebrow="GDPR & CCPA"
      title="GDPR & CCPA Compliance at Proof of Human"
      effectiveDate="June 11, 2026"
      lastUpdated="June 11, 2026"
      intro={[
        "The regulatory frameworks for **GDPR (Europe)** and the updated **CCPA/CPRA rules (California)** fundamentally shape how a modern anti-fraud platform like Proof of Human (PoH) must handle data.",
        "Because PoH captures telemetry (device hardware properties, browser fingerprints, and behavioral dynamics like mouse speed or tap entropy) to classify traffic quality, it must treat this data with rigorous care. Even if individual names or emails are not collected, both legal regimes define \"Personal Data / Information\" broadly enough to include unique device hashes and tracking payloads.",
        "The platform handles these compliance landscapes across its two distinct operational roles.",
      ]}
      sections={SECTIONS}
      contact={{
        label: "Questions about compliance?",
        heading: "Compliance & Legal Desk",
        lines: [
          "For DPAs, DSAR support, regional compliance audits or contract questions, reach our compliance desk:",
          "Evo Technology Group, LLC",
          "Attn: Proof of Human Compliance Division",
          "Email: privacy@evotechnologygroup.com",
          "Web: poh.evotechnologygroup.com",
        ],
      }}
    />
  );
}

import LegalPage from "@/components/marketing/LegalPage";

const SECTIONS = [
  {
    label: "Section 1",
    heading: "Account Registration, Fees, and Subscriptions",
    subsections: [
      {
        heading: "1.1 Account Security",
        body: [
          "To access our software pipelines and analytics dashboard, you must register an account. You agree to provide accurate, current, and complete registration information. Account authentication is processed securely via our identity provider (Clerk). You are entirely responsible for maintaining the confidentiality of your API keys, account credentials, and passwords, as well as for any and all activities that occur under your account. You must notify us immediately at support@evotechnologygroup.com of any unauthorized use or security breach of your account.",
        ],
      },
      {
        heading: "1.2 Subscription Plans and Billing",
        list: [
          "Tiered Structure: The Services are billed on a subscription basis across tiered plans scaling by ad spend, tracked domain volume, or monthly session event traffic.",
          "Payment Processing: Payment processing is handled securely via Stripe. By subscribing to a paid tier, you authorize PoH to charge your designated payment method on a recurring monthly or annual basis until canceled.",
          "Taxes: All fees are exclusive of applicable local, state, or international taxes, for which the Customer is solely responsible.",
          "Upgrades and Downgrades: If your traffic volume or ad spend exceeds your current subscription tier, PoH reserves the right to automatically adjust your billing to the appropriate usage tier or charge overage fees as outlined in your plan. Downgrading your plan may result in the loss of advanced analytics history, API access, or real-time webhooks.",
        ],
      },
      {
        heading: "1.3 Refund Policy",
        body: [
          "Except as explicitly required by law, all subscription fees are non-refundable. If you cancel your subscription, you will continue to have dashboard access to the Services until the conclusion of your current paid billing cycle, after which your access will be terminated.",
        ],
      },
    ],
  },
  {
    label: "Section 2",
    heading: "License Grants and Intellectual Property",
    subsections: [
      {
        heading: "2.1 License to the Services",
        body: [
          "Subject to your continuous compliance with these Terms and timely payment of subscription fees, PoH grants you a limited, non-exclusive, non-transferable, non-sublicensable, and revocable license during your active subscription to:",
        ],
        list: [
          "Integrate our lightweight JavaScript snippet (the \"SDK\") onto web properties owned or legally operated by you.",
          "Access and utilize the PoH dashboard to monitor traffic streams, risk scores, and campaign fraud analytics.",
          "Connect to our Ads API Connectors to sync campaign spend and attribution data.",
        ],
      },
      {
        heading: "2.2 Restrictions on Use",
        body: ["You agree that you will not, and will not permit any third party to:"],
        list: [
          "Reverse engineer, decompile, disassemble, or attempt to discover the underlying source code, algorithms, or scoring weights of the PoH core processing engine.",
          "Modify, tamper with, or circumvent any security protocols, rate limits, or automated verification mechanisms embedded within the JavaScript SDK or backend Express APIs.",
          "Use the Services to train machine-learning models, build competing bot-detection software, or generate synthetic data.",
          "Interfere with the core performance or infrastructure stability of our database pipelines hosted on Neon, cloud engines, or CDN networks.",
        ],
      },
      {
        heading: "2.3 Proprietary Rights",
        body: [
          "Evo Technology Group, LLC retains all right, title, and interest in and to the Services, including all software, SDKs, user interfaces, branding, logos, documentation, and underlying mathematical machine-learning frameworks. No ownership rights are transferred to you under these Terms. Any feedback, feature suggestions, or roadmap ideas you submit to us may be used by PoH without restriction or compensation to you.",
        ],
      },
    ],
  },
  {
    label: "Section 3",
    heading: "Privacy, Compliance, and Data Mandates",
    subsections: [
      {
        heading: "3.1 Role of Parties",
        body: [
          "You acknowledge that regarding the processing of telemetry data captured by the SDK from visitors on your websites, you are the Data Controller and PoH is the Data Processor. Our operations are governed by our Privacy Policy.",
        ],
      },
      {
        heading: "3.2 Mandatory Consent & Transparency Requirements",
        body: [
          "Because the PoH SDK collects device and browser environment configurations (fingerprinting hashes) and behavioral biometrics (mouse/scroll entropy) to analyze traffic authenticity:",
        ],
        list: [
          "Compliance with Privacy Directives: You contractually warrant and represent that your use of our Services complies with all regional laws, including the EU/UK ePrivacy Directive, GDPR, and the California Consumer Privacy Act (CCPA/CPRA).",
          "Consent Mechanisms: In jurisdictions where laws require explicit consent before executing client-side device scanning or behavioral tracking, you must obtain valid, freely given, and informed user consent (e.g., via a cookie banner or consent management platform) prior to initializing the PoH SDK snippet for that visitor.",
          "Privacy Disclosures: Your digital properties must feature a transparent privacy notice informing end-users that you utilize third-party telemetry and security analysis tools to detect automated traffic and prevent fraud.",
        ],
      },
      {
        heading: "3.3 Data Indemnification",
        body: [
          "You agree to indemnify, defend, and hold harmless Evo Technology Group, LLC against any regulatory penalties, legal claims, losses, or expenses resulting from your failure to secure proper end-user consent or your violation of applicable global data privacy laws.",
        ],
      },
    ],
  },
  {
    label: "Section 4",
    heading: "Service Disclaimers, Limitation of Liability, and Indemnification",
    subsections: [
      {
        heading: "4.1 \"As-Is\" Service Disclaimer",
        body: [
          "THE SERVICES ARE PROVIDED ON AN \"AS IS\" AND \"AS AVAILABLE\" BASIS. EVO TECHNOLOGY GROUP, LLC MAKES NO REPRESENTATIONS, WARRANTIES, OR GUARANTEES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.",
          "WHILE POH UTILIZES ADVANCED PROBABILISTIC SCORING AND ANOMALY DETECTION ENGINE CONFIGURATIONS, WE DO NOT WARRANT THAT THE SERVICES WILL DETECT 100% OF ALL INVALID TRAFFIC OR BOTS, THAT THE REAL-TIME BLOCKING API WILL DEFEND AGAINST EVOLVING ATTACK SURFACES, OR THAT THE COMPUTED \"HUMAN ROAS\" DATA WILL BE ENTIRELY ERROR-FREE. THE DIGITAL AD MULTIVERSE EVOLVES RAPIDLY, AND TRAFFIC EVALUATIONS REPRESENT PROBABILISTIC FRAUD INTELLIGENCE RATHER THAN AN ABSOLUTE BIOMETRIC CERTIFICATION.",
        ],
      },
      {
        heading: "4.2 Limitation of Liability",
        body: [
          "TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL EVO TECHNOLOGY GROUP, LLC, ITS AFFILIATES, OFFICERS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION LOSS OF PROFITS, DATA POLLUTION, LOST ADVERTISING BUDGETS, WASTED SPEND, BUSINESS INTERRUPTION, OR REPUTATIONAL HARM, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF OR INABILITY TO USE THE SERVICES.",
          "OUR AGGREGATE LIABILITY FOR ALL CLAIMS RELATED TO THE SERVICES SHALL NOT EXCEED THE TOTAL AMOUNT OF SUBSCRIPTION FEES ACTUALLY PAID BY YOU TO POH DURING THE TWELVE (12) MONTH PERIOD IMMEDIATELY PRECEDING THE INCIDENT GIVING RISE TO LIABILITY.",
        ],
      },
      {
        heading: "4.3 Client Indemnification",
        body: [
          "You agree to defend, indemnify, and hold harmless Evo Technology Group, LLC and its subsidiaries from and against any third-party claims, liabilities, damages, losses, costs, and legal fees arising out of your misuse of the platform, violation of these Terms, or configuration errors that inadvertently block legitimate human web consumers.",
        ],
      },
    ],
  },
  {
    label: "Section 5",
    heading: "Term and Termination",
    subsections: [
      {
        heading: "5.1 Term",
        body: [
          "These Terms commence when you first access or register with the platform and will remain in full force until your account is terminated or your active subscription is closed.",
        ],
      },
      {
        heading: "5.2 Termination by You",
        body: [
          "You may cancel your monthly or annual subscription tier at any time directly through your dashboard settings interface or by emailing billing support.",
        ],
      },
      {
        heading: "5.3 Termination by PoH",
        body: ["We reserve the right to suspend or terminate your account and your license to embed the SDK snippet immediately, without prior notice, if:"],
        list: [
          "You fail to pay outstanding subscription tier dues.",
          "You violate the platform restrictions outlined in Section 2.2.",
          "Your implementation generates infrastructure disruptions, script loops, or rate-limit violations that threaten platform-wide delivery metrics (<200ms target processing times).",
        ],
      },
      {
        heading: "5.4 Effect of Termination",
        body: [
          "Upon termination of your account, your right to use the Services ceases immediately. You must promptly delete all instances of the PoH JavaScript SDK snippet from your web applications, codebases, and tag managers. All provisions of these Terms which by their nature should survive termination shall survive (including intellectual property ownership, disclaimers, limitations of liability, and dispute resolution rules).",
        ],
      },
    ],
  },
  {
    label: "Section 6",
    heading: "Governing Law and Dispute Resolution",
    subsections: [
      {
        heading: "6.1 Governing Law",
        body: [
          "These Terms and any dispute or claim arising out of or related to them shall be governed by and construed in accordance with the laws of the State of Delaware, without giving effect to any choice of law or conflict of law rules.",
        ],
      },
      {
        heading: "6.2 Binding Arbitration",
        body: [
          "Any dispute, controversy, or claim arising out of or relating to this contract, including its formation or breach, shall be settled by binding arbitration administered by the American Arbitration Association (AAA) in accordance with its Commercial Arbitration Rules. The place of arbitration shall be Wilmington, Delaware, and the proceedings shall be conducted in English. Judgment on the award rendered by the arbitrator may be entered in any court having jurisdiction thereof.",
        ],
      },
      {
        heading: "6.3 Class Action Waiver",
        body: [
          "YOU AND EVO TECHNOLOGY GROUP, LLC AGREE THAT ANY PROCEEDINGS TO RESOLVE DISPUTES WILL BE CONDUCTED SOLELY ON AN INDIVIDUAL BASIS AND NOT IN A CLASS, CONSOLIDATED, OR REPRESENTATIVE ACTION.",
        ],
      },
    ],
  },
  {
    label: "Section 7",
    heading: "Miscellaneous",
    subsections: [
      {
        heading: "7.1 Entire Agreement",
        body: [
          "These Terms, along with our Privacy Policy and any customized enterprise Service Level Agreements (SLAs), constitute the entire agreement between you and Evo Technology Group, LLC regarding your use of the platform.",
        ],
      },
      {
        heading: "7.2 Severability",
        body: [
          "If any provision of these Terms is found by an arbitrator or court of competent jurisdiction to be invalid or unenforceable, that specific provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions of these Terms shall remain in full force and effect.",
        ],
      },
      {
        heading: "7.3 Changes to the Terms",
        body: [
          "We reserve the right to update these Terms from time to time. If we make material modifications, we will notify you by updating the effective date at the top of this document, broadcasting a notice via the dashboard workspace, or emailing your registered administrative account. Your continued use of the platform after updates are posted constitutes explicit acceptance of the revised Terms.",
        ],
      },
    ],
  },
];

export default function Terms() {
  return (
    <LegalPage
      testId="page-terms"
      eyebrow="Terms of Use"
      title="Terms of Use for Proof of Human (PoH) Intelligence"
      effectiveDate="June 11, 2026"
      lastUpdated="June 11, 2026"
      intro={[
        "An Evo Technology Group, LLC Company.",
        "Welcome to Proof of Human Intelligence. These Terms of Use (\"Terms\") constitute a binding legal agreement between you (\"Customer,\" \"User,\" \"you,\" or \"your\") and Evo Technology Group, LLC, doing business as Proof of Human Intelligence (collectively, \"PoH,\" \"we,\" \"us,\" or \"our\").",
        "These Terms govern your access to and use of our corporate website (poh.evotechnologygroup.com), our software-as-a-service (SaaS) client dashboard, our proprietary Ads API Connectors, and our real-time verification and anti-fraud product pipelines, including the downloadable JavaScript SDK snippet (collectively, the \"Services\").",
        "By registering an account, integrating the PoH snippet onto any web property, or otherwise accessing the Services, you explicitly agree to be bound by these Terms. If you are entering into these Terms on behalf of a company, agency, or other legal entity, you represent that you have the authority to bind such entity to these conditions. If you do not agree to these Terms, you are prohibited from using or accessing our Services.",
      ]}
      sections={SECTIONS}
      contact={{
        label: "Section 7.4 — Contact Information",
        heading: "Legal & Operations Department",
        lines: [
          "For any legal inquiries, compliance audits, or notices required under these Terms, please contact our legal desk at:",
          "Evo Technology Group, LLC",
          "Attn: Legal & Operations Department",
          "Email: legal@evotechnologygroup.com",
          "Web: poh.evotechnologygroup.com",
        ],
      }}
    />
  );
}

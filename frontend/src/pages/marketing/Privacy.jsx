import LegalPage from "@/components/marketing/LegalPage";

const SECTIONS = [
  {
    label: "Section 1",
    heading: "Controller Data",
    subsections: [
      {
        heading: "1. Information We Collect",
        body: [
          "We collect information directly when you provide it to us and automatically when you browse our corporate platforms.",
        ],
      },
      {
        heading: "A. Information You Provide Directly to Us",
        list: [
          "Business Contact Information: Name, professional email address, phone number, company name, website URL, monthly ad budget, and physical business address.",
          "Account Registration: Login credentials managed via our authentication provider (Clerk), billing profiles, and payment metadata processed securely via Stripe.",
          "Communications: Records of correspondence, support tickets, product inquiries, performance marketing audits, and survey feedback.",
        ],
      },
      {
        heading: "B. Passively and Automatically Collected Information",
        list: [
          "Corporate Website Analytics: IP addresses, approximate geographic location (city, state, country derived via IP), browser type, device type, operating system, referral URLs, time spent on pages, and navigation patterns via system logs and cookies.",
          "Transactional Data: Details regarding service tier choices, payment history, billing dates, and subscription event logs.",
        ],
      },
      {
        heading: "2. How We Use Your Information",
        body: ["We use Controller Data to:"],
        list: [
          "Provide, maintain, and secure the PoH platform, analytics dashboard, and client portals.",
          "Authenticate platform users and process monthly tier-based usage billing.",
          "Respond to customer service inquiries and technical support requests.",
          "Send operational alerts (e.g., ad fraud anomalies, traffic spikes, system updates).",
          "Execute performance marketing strategies, including sending newsletters or promotional content (subject to your opt-out rights).",
          "Comply with legal obligations, enforce agreements, and protect against security threats or fraud.",
        ],
      },
      {
        heading: "3. Sharing and Disclosure of Controller Data",
        body: ["We do not sell Controller Data. We disclose this information only to:"],
        list: [
          "Service Providers: Trusted vendors operating under strict data security obligations who assist in billing (Stripe), identity management (Clerk), cloud operations (AWS, Neon, Vercel), and standard corporate tools.",
          "Legal and Regulatory Authorities: When legally compelled to do so by public authorities, including meeting national security, law enforcement, or corporate auditing requirements.",
          "Corporate Restructuring: In connection with any merger, sale of company assets, financing, or acquisition of all or a portion of Evo Technology Group, LLC.",
        ],
      },
      {
        heading: "4. Legal Bases for Processing (EEA, UK, and Swiss Users)",
        body: [
          "If you reside in the European Economic Area (EEA), United Kingdom, or Switzerland, we process your personal data under the following legal frameworks:",
        ],
        list: [
          "Performance of a Contract: Necessary to provide the subscription services you purchase.",
          "Legitimate Interests: To secure our platform, optimize web performance, prevent internal abuse, and market our business offerings.",
          "Consent: Where you have explicitly opted into specific promotional updates or tracking technologies.",
          "Legal Obligation: Compliance with mandatory law enforcement or statutory tax and accounting standards.",
        ],
      },
      {
        heading: "5. Data Security and Retention",
        body: [
          "We utilize industry-standard technical measures (HTTPS-only data transport, data encryption at rest and in transit, and role-based access limits) to secure Controller Data. We retain corporate contact and account information for as long as your service subscription remains active or as needed to resolve disputes and fulfill statutory legal holding periods.",
        ],
      },
    ],
  },
  {
    label: "Section 2",
    heading: "Processor Data (the PoH SDK Pipeline)",
    body: [
      "This section applies to data collected from end-users navigating the websites, landing pages, or mobile properties of our business customers who have embedded the PoH JavaScript SDK code snippet.",
      "In this capacity, PoH acts strictly as a Data Processor, and our customer acts as the Data Controller. We process this data for the sole purpose of detecting automated traffic (bots), click fraud, lead-generation spam, and evaluating traffic quality metrics (such as Human ROAS/CPA).",
    ],
    subsections: [
      {
        heading: "1. Information Processed via the SDK",
        body: [
          "The PoH SDK captures environmental and performance telemetry designed to distinguish human interactions from bots or malicious scripts. The SDK does not collect traditional personally identifiable information (PII) such as names, email addresses, phone numbers, or the alphanumeric content of form keystrokes.",
          "The data captured includes:",
        ],
        list: [
          "Behavioral Biometrics: Anonymized, probabilistic interaction data including mouse trajectory patterns, scroll velocity, keystroke speed/timing characteristics, form-interaction duration, and touch/click entropy.",
          "Device and Browser Fingerprinting: Hardware configurations hashed on the client side (including Canvas and WebGL rendering hashes, installed fonts/plugins, screen resolution, browser user-agent, operating system details, device memory, CPU core counts, language preferences, battery status, and media device capacities).",
          "Automation & Environment Indicators: System state flags checking for automated execution parameters (e.g., Selenium, WebDriver artifacts, headless browser signatures, automated proxy routing headers, and hash collision anomalies).",
          "Campaign Metadata: URL query parameters (such as UTM tags, ad campaign IDs, or ad click identifiers) linked to the traffic event to map fraud risks back to specific advertising sources.",
        ],
      },
      {
        heading: "2. Purpose and Disclosure of Processor Data",
        body: [
          "We utilize advanced pattern analysis, anomaly rules, and machine-learning models on this telemetry to generate a real-time Human Probability Score (0–100) for each user session.",
        ],
        list: [
          "Use: This data is processed in real time to populate the customer's PoH Ad Campaign Dashboard, dispatch security webhooks/API verdicts, filter out fraudulent lead submissions, and optimize marketing traffic quality.",
          "Disclosure: Processor Data is accessible only to the respective customer account that deployed the SDK snippet and our infrastructure providers. We do not aggregate individual customer cross-site tracking data to build commercial profiles on specific individuals.",
          "Data Minimization and Anonymization: In accordance with privacy minimization principles, raw SDK event telemetry logs are automatically purged or fully anonymized within three (3) to six (6) months, retaining only high-level, aggregated analytics data within the client dashboard thereafter.",
        ],
      },
      {
        heading: "3. Compliance and End-User Rights (GDPR / CCPA / ePrivacy)",
        body: [
          "Because device fingerprinting and behavioral tracking technologies are deployed via our snippet, our customers are contractually required to maintain valid consent mechanisms (such as cookie compliance banners) in jurisdictions where laws require explicit consent before executing device analysis (e.g., the EU ePrivacy Directive and GDPR Article 5).",
        ],
        list: [
          "Data Subject Requests: If your data has been captured by a PoH customer using our platform and you wish to exercise your rights under GDPR, CCPA, or other regional data protection acts (such as data access or deletion requests), you must contact the owner of the respective website directly. As a processor, PoH will assist our business customers in executing deletion or erasure requests inside our session databases upon formal customer directive.",
          "Global Privacy Controls: Our ingestion endpoints are configured to interpret and support industry-standard automated opt-out signals, ensuring proper downstream compliance.",
        ],
      },
    ],
  },
  {
    label: "Section 3",
    heading: "Contact and Compliance Info",
    subsections: [
      {
        heading: "1. Updates to this Policy",
        body: [
          "We reserve the right to modify this Privacy Policy at any time to reflect changing technological capabilities, regulatory updates, or changes in our architectural dependencies. All changes will be posted to this page with an updated effective date.",
        ],
      },
    ],
  },
];

export default function Privacy() {
  return (
    <LegalPage
      testId="page-privacy"
      eyebrow="Privacy Policy"
      title="Privacy Policy for Proof of Human (PoH) Intelligence"
      effectiveDate="June 11, 2026"
      intro={[
        "An Evo Technology Group, LLC Company.",
        "This Privacy Policy (\"Policy\") explains how Evo Technology Group, LLC, doing business as Proof of Human Intelligence (collectively, \"PoH,\" \"we,\" \"us,\" or \"our\"), collects, uses, and discloses information through our corporate website, client dashboards, online communications, and our real-time verification and anti-fraud products (collectively, the \"Services\").",
        "The Policy is divided into two operational scopes:",
        "Section 1 (Controller Data) addresses information that we collect as a data controller — through our website (poh.evotechnologygroup.com and its subdomains), communications with our business contacts, client registration, sales inquiries, and marketing operations.",
        "Section 2 (Processor Data) addresses telemetry and behavioral information that we process strictly as a service provider (a data processor) on behalf of our enterprise and digital marketing customers through our JavaScript SDK and scoring pipelines (the \"Product\").",
        "Please read this Policy carefully. If you do not agree with the terms outlined herein, please do not utilize our corporate services or deploy our SDK pipelines. For questions or concerns, contact us at privacy@evotechnologygroup.com.",
      ]}
      sections={SECTIONS}
      contact={{
        label: "Section 3.2 — Contact Us",
        heading: "Proof of Human Compliance Division",
        lines: [
          "For any inquiries regarding this policy, data deletion requests, or our corporate privacy practices, please contact our compliance desk at:",
          "Evo Technology Group, LLC",
          "Attn: Proof of Human Compliance Division",
          "Email: privacy@evotechnologygroup.com",
          "Web: poh.evotechnologygroup.com",
        ],
      }}
    />
  );
}

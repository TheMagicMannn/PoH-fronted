import type {
  BaseScoreResponse,
  BehaviorSignal,
  DeviceSignal,
  NetworkSignal,
  RiskTier,
} from "./common.js";

export type RevenueDecision =
  | "approve"
  | "approve_and_monitor"
  | "delay_fulfillment"
  | "step_up_verification"
  | "hold_refund"
  | "limit_benefit_issuance"
  | "hold_for_review"
  | "freeze_account"
  | "deny_refund"
  | "block_transaction"
  | "escalate_to_finance";

export type RevenueEventType =
  | "purchase_attempt"
  | "renewal_attempt"
  | "refund_request"
  | "chargeback_notice"
  | "promo_redemption"
  | "trial_start"
  | "trial_conversion"
  | "subscription_cancellation"
  | "support_credit_request"
  | "payment_retry"
  | string;

export type RevenueReasonCode =
  | "high_chargeback_risk"
  | "refund_velocity"
  | "promo_reuse"
  | "subscription_instability"
  | "billing_anomaly"
  | "payment_mismatch"
  | "cluster_linkage"
  | "account_takeover_pattern"
  | "support_abuse_pattern"
  | "low_revenue_confidence"
  | string;

export interface TransactionSignal {
  transactionId?: string;
  amount?: number;
  currency?: string;
  paymentMethodType?: "card" | "bank" | "wallet" | "crypto" | "bnpl" | string;
  paymentOutcome?: "success" | "failed" | "pending" | "declined";
  isFirstTransaction?: boolean;
  priorTransactionCount?: number;
  priorRefundCount?: number;
  priorChargebackCount?: number;
  avsResult?: string;
  cvvResult?: string;
}

export interface IdentitySignal {
  email?: string;
  emailDomain?: string;
  isDisposableEmail?: boolean;
  phone?: string;
  isVoipPhone?: boolean;
  accountAgeMs?: number;
  verificationLevel?: "none" | "email" | "phone" | "id" | "full";
  multiAccountLinkage?: number;
}

export interface BillingSignal {
  subscriptionId?: string;
  planId?: string;
  subscriptionAgeMs?: number;
  failedPaymentCount?: number;
  cardUpdateCount?: number;
  dunningAttempts?: number;
  priorPromoRedemptions?: number;
  trialCount?: number;
  cancelCount?: number;
}

export interface GraphSignal {
  sharedIpCount?: number;
  sharedDeviceCount?: number;
  sharedPaymentInstrumentCount?: number;
  sharedEmailDomainCount?: number;
  clusterRiskScore?: number;
  knownFraudAssociations?: number;
}

export interface RevenueScoreRequest {
  tenantId: string;
  entityId: string;
  transactionId?: string;
  eventType: RevenueEventType;
  signals?: {
    transaction?: TransactionSignal;
    identity?: IdentitySignal;
    device?: DeviceSignal;
    network?: NetworkSignal;
    behavior?: BehaviorSignal;
    billing?: BillingSignal;
    graph?: GraphSignal;
  };
}

export interface RevenueModuleScores {
  transaction: number;
  chargeback: number;
  refund: number;
  promo: number;
  subscription: number;
  billing: number;
  retention: number;
  account: number;
  behavior: number;
  graph: number;
}

export interface RevenueScoreResponse extends BaseScoreResponse {
  scoreId: string;
  revenueProtectionScore: number;
  revenueRiskScore: number;
  chargebackRiskScore: number;
  refundAbuseScore: number;
  promoAbuseScore: number;
  subscriptionRiskScore?: number;
  decision: RevenueDecision;
  moduleScores: RevenueModuleScores;
}

export interface RevenueFeedbackRequest {
  scoreId: string;
  outcome:
    | "chargeback_confirmed"
    | "refund_approved"
    | "refund_rejected"
    | "promo_abuse_confirmed"
    | "payment_legit"
    | "manual_review_complete"
    | "collection_success"
    | "bad_debt_writeoff"
    | "false_positive";
  amount?: number;
  currency?: string;
  notes?: string;
}

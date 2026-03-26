// ──────────────────────────────────────────────
// Toss Payments API Response Types
// ──────────────────────────────────────────────

/**
 * 토스페이먼츠 결제 승인 응답
 * https://docs.tosspayments.com/reference#결제-승인
 */
export interface TossPaymentResponse {
  // 거래
  paymentKey: string;
  orderId: string;
  orderName: string;
  mid: string;
  currency: string;
  method: 'CARD' | 'TRANSFER' | 'PHONE' | 'VIRTUAL_ACCOUNT';
  totalAmount: number;
  balanceAmount: number;
  status: 'READY' | 'IN_PROGRESS' | 'WAITING_FOR_DEPOSIT' | 'COMPLETED' | 'ABORTED' | 'CANCELED';
  requestedAt: string; // ISO8601
  approvedAt?: string; // ISO8601
  useEscrow: boolean;
  cultureExpense: boolean;

  // 결제 수단별 상세
  card?: {
    issuerCode?: string;
    issuerName?: string;
    acquirerCode?: string;
    acquirerName?: string;
    number: string; // 마스킹된 카드번호
    installmentPlanMonths: number;
    isInterestFree: boolean;
    interestPayer?: string;
    approveNo: string;
    useCardPoint: boolean;
    cardType: 'CREDIT' | 'DEBIT';
    ownerType: 'PERSONAL' | 'CORPORATE';
  };

  virtualAccount?: {
    accountNumber: string;
    bankCode: string;
    bankName: string;
    customerName: string;
    dueDate: string; // ISO8601
    refundStatus: string;
    expired: boolean;
    settlementStatus: string;
  };

  transfer?: {
    bankCode: string;
    bankName: string;
    transferStatus: string;
  };

  mobilePhone?: {
    carrierCode: string;
    carrierName: string;
    isSubscriptionPayment: boolean;
  };

  // 할인/수수료
  discount?: {
    amount: number;
    discountCode?: string;
  };

  // 환불 (있는 경우)
  cancels?: TossCancelResponse[];

  // 기타
  secret?: string;
  version: string;
  type: 'NORMAL' | 'BILLING' | 'KEY_IN';
  easyPay?: {
    provider: 'NAVER_PAY' | 'SAMSUNG_PAY' | 'KAKAO_PAY' | 'PAYCO';
    amount: number;
  };
}

/**
 * 토스페이먼츠 환불 응답
 */
export interface TossCancelResponse {
  cancelKey: string;
  cancelStatus: 'PENDING' | 'COMPLETED' | 'FAILED';
  cancelReason: string;
  cancelAmount: number;
  taxFreeAmount: number;
  taxAmount: number;
  refundableAmount: number;
  canceledAt: string; // ISO8601
  receiptUrl: string;
}

/**
 * 토스페이먼츠 에러 응답
 * https://docs.tosspayments.com/reference#에러
 */
export interface TossPaymentError {
  code: string;
  message: string;
  validationErrors?: Array<{
    field: string;
    message: string;
  }>;
}

/**
 * 토스페이먼츠 결제 승인 요청
 */
export interface TossConfirmPaymentRequest {
  paymentKey: string;
  orderId: string;
  amount: number;
}

/**
 * 토스페이먼츠 결제 취소 요청
 */
export interface TossCancelPaymentRequest {
  paymentKey: string;
  cancelReason: string;
  cancelAmount?: number;
}

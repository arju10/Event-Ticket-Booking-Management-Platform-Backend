export interface InitiatePaymentResult {
  paymentId: string;
  amount: number;
  method: string;
  status: string;
  paymentUrl: string;
  expiresAt: Date | null;
}

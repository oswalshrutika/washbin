import "server-only";
import { randomBytes } from "node:crypto";

/**
 * Payment gateway seam. The mock stands in for Razorpay: createOrder ≈ razorpay.orders.create, and the
 * mock checkout page plays the role of Razorpay Checkout + the payment-captured webhook.
 * A Razorpay implementation must verify the webhook/handler signature before marking a payment captured.
 */
export interface PaymentGateway {
  name: string;
  createOrder(args: { amount: number; receipt: string }): Promise<{ orderId: string }>;
  refund(args: { providerPaymentId: string; amount: number }): Promise<{ refundId: string }>;
}

const id = (prefix: string) => `${prefix}_${randomBytes(7).toString("hex")}`;

class MockGateway implements PaymentGateway {
  name = "mock";
  async createOrder() {
    return { orderId: id("order") };
  }
  async refund() {
    return { refundId: id("rfnd") };
  }
}

export const gateway: PaymentGateway = new MockGateway();
export const mockPaymentId = () => id("pay");

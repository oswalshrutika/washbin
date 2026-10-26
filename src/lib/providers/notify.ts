import "server-only";

export type Channel = "sms" | "whatsapp" | "email" | "in_app";

export type OutboundMessage = { to: { phone?: string | null; email?: string | null }; title: string; body: string };

/** Delivery for one external channel. In-app alerts are written to the notifications table instead. */
export interface ChannelSender {
  channel: Exclude<Channel, "in_app">;
  send(message: OutboundMessage): Promise<boolean>;
}

class MockSender implements ChannelSender {
  constructor(public channel: Exclude<Channel, "in_app">) {}
  async send(message: OutboundMessage) {
    const to = this.channel === "email" ? message.to.email : message.to.phone;
    if (!to) return false;
    console.info(`[mock-${this.channel}] ${to}: ${message.title} — ${message.body}`);
    return true;
  }
}

export const channelSenders: ChannelSender[] = [new MockSender("sms"), new MockSender("whatsapp"), new MockSender("email")];

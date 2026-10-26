/**
 * Every business rule the spec marks [DECIDE] lives here (catalog prices live in src/db/seed-data.ts).
 * Values are placeholders until Washbin confirms them — change them here, nowhere else.
 */

export const BRAND = {
  name: "Washbin",
  tagline: "Clean everything",
  parent: "Pushpak Business Group",
  launchDate: "2026-11-01",
  cities: ["Pune", "PCMC"] as const,
};

// [DECIDE] Official support channels and hours.
export const SUPPORT = {
  phone: "+91 90000 00000",
  whatsapp: "919000000000", // digits only, used for wa.me links
  email: "support@washbin.in",
  hours: "8 AM – 8 PM, all days",
};

// [DECIDE] Taxes and charges. All money is integer paise.
export const PRICING = {
  gstPercent: 18,
  visitCharge: 99_00,
  visitChargeWaivedFrom: 699_00, // subtotal at/above this has no visit charge
};

// [DECIDE] Which payment options are on at launch.
export const PAYMENT = {
  advancePercent: 30,
  options: {
    full: true,
    advance: true,
    after_service: true,
    cash: false,
  },
} as const;

export type PaymentOption = keyof typeof PAYMENT.options;

// [DECIDE] Working hours, slots, buffers. Minutes are minutes after midnight, IST.
export const SCHEDULING = {
  timezone: "Asia/Kolkata",
  workStartMinute: 8 * 60,
  workEndMinute: 20 * 60,
  bufferMinutes: 30,
  minAdvanceHours: 3,
  bookingHorizonDays: 30,
};

// [DECIDE] Cancellation / reschedule rules.
export const CANCELLATION = {
  cutoffHours: 4, // free cancel / reschedule until this many hours before slot start
  lateCancelFee: 199_00,
};

// How long an unpaid booking holds its slot before the slot is released.
export const PAYMENT_HOLD_MINUTES = 15;

// [DECIDE] Complaint / re-service window (used once ratings & complaints ship).
export const QUALITY = {
  complaintWindowHours: 48,
};

// [DECIDE] Legal details printed on GST invoices.
export const INVOICE = {
  legalName: "Pushpak Business Group",
  gstin: "27AAAAA0000A1Z5", // placeholder
  address: "Pune, Maharashtra 411001",
  stateCode: "27", // Maharashtra: intra-state, so GST splits into CGST + SGST
  sac: "998533", // cleaning services
};

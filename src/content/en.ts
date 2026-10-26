/**
 * English site copy. To add Marathi or Hindi, create mr.ts / hi.ts with the same shape and register it in
 * ./index.ts — pages read copy only through getContent(locale).
 *
 * [DECIDE] All policy text is a DRAFT for Washbin's legal review before launch.
 */

import { BRAND, CANCELLATION, PAYMENT, PRICING, QUALITY, SCHEDULING, SUPPORT } from "@/config/business";

const rupees = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;
const hour = (minute: number) => {
  const h = Math.floor(minute / 60);
  return `${h % 12 || 12} ${h < 12 ? "AM" : "PM"}`;
};

export const en = {
  home: {
    title: BRAND.tagline,
    lead: "Verified cleaners for your home, sofa, water tank and car — at a price you see before you book.",
    areaPrompt: "Check if we come to your area",
    servicesTitle: "What we clean",
    howTitle: "How it works",
    how: [
      { title: "Book", body: "Pick a service, see the full price and choose a time that suits you." },
      { title: "Washer arrives", body: "A verified Washbin washer arrives in your slot and shares an arrival OTP." },
      { title: "Pay", body: "Pay a small advance to book and the rest after the work is done, by UPI or card." },
      { title: "Rate", body: "Tell us how it went. If something was missed, we come back and fix it." },
    ],
    trustTitle: "Why Pune homes book Washbin",
    trust: [
      { title: "Verified washers", body: "Every washer's Aadhaar, PAN and photo are checked by our team before their first job, and they're trained for each service they offer." },
      { title: "Prices you see up front", body: "The price, taxes and any visit charge are shown before you pay. If something can change on site, we tell you first." },
      { title: "Free re-service", body: `Not happy? Raise it within ${QUALITY.complaintWindowHours} hours with a photo and we'll send a team back to fix it.` },
    ],
    // [DECIDE] Placeholder testimonials — replace with real customer reviews after launch, or remove.
    testimonials: [
      { quote: "The team cleaned our 2 BHK in Kothrud in one afternoon. The kitchen tiles look new.", name: "Sample review", area: "Kothrud" },
      { quote: "Booked a sofa clean on my phone in two minutes. The price was exactly what the app said.", name: "Sample review", area: "Wakad" },
    ],
    faqTitle: "Questions people ask",
  },
  faqs: [
    { q: "Which areas do you serve?", a: "Pune city and Pimpri-Chinchwad (PCMC) at launch. Enter your pincode on the homepage to check." },
    { q: "Do I need to download an app?", a: "No. You can book, pay and track everything on this website from your phone." },
    { q: "How do I pay?", a: `UPI, cards, net banking or wallets through Razorpay. You can pay ${PAYMENT.advancePercent}% now and the rest after the service, or pay in full.` },
    { q: "Who brings the cleaning supplies?", a: "The washer brings the chemicals and machines. You only need to provide water, a power socket and access. Each service page lists what to keep ready." },
    { q: "Can I reschedule or cancel?", a: `Yes, free of charge up to ${CANCELLATION.cutoffHours} hours before your slot. After that a ${rupees(CANCELLATION.lateCancelFee)} fee applies.` },
    { q: "Are the washers safe to let into my home?", a: "Every washer is ID-verified by Washbin before they can accept jobs, and you see their name, photo and rating before they arrive." },
  ],
  about: {
    title: "About Washbin",
    body: [
      `${BRAND.name} is a home and vehicle cleaning service from ${BRAND.parent}, launching in Pune and Pimpri-Chinchwad on 1 November 2026.`,
      "We connect households with trained, ID-verified washers and cleaning teams. You book on the website, see the full price up front, and pay only through the platform, so washers are paid fairly and on time.",
      "We started with the jobs Pune homes ask for most: deep home cleaning, kitchens, bathrooms, sofas, carpets, water tanks and doorstep car washes. If you need something else, ask us for a quote.",
    ],
  },
  policies: {
    terms: {
      title: "Terms and conditions",
      sections: [
        { h: "The service", p: [`${BRAND.name} is operated by ${BRAND.parent}. We connect you with independent, verified washers who perform the cleaning service you book. ${BRAND.name} handles booking, payment, support and quality.`] },
        { h: "Bookings", p: ["A booking is confirmed once you receive a booking ID and the required advance (if any) is paid. You must be 18 or older and provide an accurate address and contact number.", "Please make sure someone is home at the start of the slot to share the arrival OTP, and that water, power and access are available as listed on the service page."] },
        { h: "Prices", p: [`Prices shown include all charges except GST at ${PRICING.gstPercent}%, which is shown separately before payment. A visit charge of ${rupees(PRICING.visitCharge)} applies to orders below ${rupees(PRICING.visitChargeWaivedFrom)}.`, "For services marked as \"price may change on site\", the washer may find work that differs from the booking (for example a larger sofa). Any extra charge is shown to you in the portal and added only if you approve it."] },
        { h: "Conduct", p: ["Washers are not permitted to take payments outside the platform. Please report any such request to support.", "We may refuse or cancel a booking if the work environment is unsafe or if a customer is abusive towards a washer."] },
        { h: "Liability", p: ["Damage claims are handled under our Damage and Re-service Policy."] },
      ],
    },
    privacy: {
      title: "Privacy policy",
      sections: [
        { h: "What we collect", p: ["Your name, mobile number, email (optional), saved addresses and map location, booking history, payments, and photos you upload with a booking."] },
        { h: "How we use it", p: ["To deliver your booking, send booking updates by SMS, WhatsApp and email, provide support, prevent fraud, and improve our service. We do not sell your data."] },
        { h: "Who sees it", p: ["The assigned washer sees your first name, address and instructions for the job only. Your phone number is masked where possible. Washers' ID documents and bank details are never shown to customers."] },
        { h: "Security", p: ["Logins use one-time passwords sent to your phone. Payment details are handled by Razorpay; we never store your card details."] },
        { h: "Your choices", p: ["You can edit your profile and addresses at any time, and request account deletion from your account page. Some booking and invoice records must be kept for legal and tax reasons."] },
      ],
    },
    cancellation: {
      title: "Cancellation and refund policy",
      sections: [
        { h: "Cancelling", p: [`Cancel free of charge up to ${CANCELLATION.cutoffHours} hours before your slot starts and get a full refund of anything you've paid.`, `If you cancel within ${CANCELLATION.cutoffHours} hours of the slot, or the washer arrives and can't get access, a fee of ${rupees(CANCELLATION.lateCancelFee)} is kept from your payment.`] },
        { h: "Rescheduling", p: [`Reschedule free of charge up to ${CANCELLATION.cutoffHours} hours before your slot, subject to availability.`] },
        { h: "If the washer cancels", p: ["We'll offer you another washer for the same slot, or a full refund — your choice."] },
        { h: "How refunds are paid", p: ["Refunds go to your original payment method within 5–7 working days, or instantly to your Washbin wallet if you choose. You can track refund status from My Bookings."] },
      ],
    },
    damage: {
      title: "Damage and re-service policy",
      sections: [
        { h: "Re-service", p: [`If any included task was missed or not done well, raise a complaint from My Bookings within ${QUALITY.complaintWindowHours} hours of completion, with photos. We'll send a team back to redo it free of charge, or offer a partial or full refund.`] },
        { h: "Damage", p: ["Washers take care with your belongings and are trained on safe products for each surface. If something is damaged during the service, report it within 48 hours with photos. We'll review it with the washer's before/after photos and compensate you according to the published cap. [DECIDE: damage cap amount]"] },
        { h: "What isn't covered", p: ["Pre-existing damage, wear and tear, items not disclosed as fragile, and stains or marks listed as not guaranteed on the service page."] },
      ],
    },
  },
  pricing: {
    title: "Pricing",
    lead: `Every price below is the starting price before GST (${PRICING.gstPercent}%). Your exact total, including taxes and any visit charge, is shown before you pay.`,
    notes: [
      `Visit charge of ${rupees(PRICING.visitCharge)} on orders below ${rupees(PRICING.visitChargeWaivedFrom)}.`,
      `Book from ${hour(SCHEDULING.workStartMinute)} to ${hour(SCHEDULING.workEndMinute)}, at least ${SCHEDULING.minAdvanceHours} hours ahead.`,
      `Pay ${PAYMENT.advancePercent}% to book and the rest after the service, or pay in full.`,
    ],
  },
  contact: {
    title: "Contact and help",
    lead: `Call or WhatsApp us ${SUPPORT.hours}. For a problem with a booking, open it from My Bookings so your message stays attached to the job.`,
  },
};

export type Content = typeof en;

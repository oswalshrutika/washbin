import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

// ---------- Users & auth ----------

export const userRole = pgEnum("user_role", ["customer", "washer", "admin"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  phone: text("phone").notNull().unique(), // E.164 without +, e.g. 919876543210
  name: text("name"),
  email: text("email"),
  role: userRole("role").notNull().default("customer"),
  notes: text("notes"), // pets, gate code, parking instructions
  blocked: boolean("blocked").notNull().default(false),
  deletionRequestedAt: timestamp("deletion_requested_at", { withTimezone: true }),
  createdAt: createdAt(),
});

export const otpCodes = pgTable(
  "otp_codes",
  {
    id: serial("id").primaryKey(),
    phone: text("phone").notNull(),
    codeHash: text("code_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    attempts: integer("attempts").notNull().default(0),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("otp_phone_idx").on(t.phone, t.createdAt)],
);

export const sessions = pgTable("sessions", {
  tokenHash: text("token_hash").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: createdAt(),
});

// ---------- Service areas ----------

export const serviceAreas = pgTable("service_areas", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  city: text("city").notNull(), // "Pune" | "PCMC"
  slotCapacity: integer("slot_capacity").notNull(), // teams that can work one slot in this area
  active: boolean("active").notNull().default(true),
});

export const pincodes = pgTable("pincodes", {
  code: text("code").primaryKey(),
  areaId: integer("area_id")
    .notNull()
    .references(() => serviceAreas.id),
  locality: text("locality").notNull(),
});

export const areaNotifyRequests = pgTable("area_notify_requests", {
  id: serial("id").primaryKey(),
  pincode: text("pincode").notNull(),
  contact: text("contact").notNull(), // phone or email
  createdAt: createdAt(),
});

// ---------- Catalog ----------

export type Faq = { q: string; a: string };

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  icon: text("icon").notNull(), // lucide icon name, used until real photos exist
  tagline: text("tagline").notNull(),
  description: text("description").notNull(),
  inclusions: jsonb("inclusions").$type<string[]>().notNull(),
  exclusions: jsonb("exclusions").$type<string[]>().notNull(),
  customerProvides: jsonb("customer_provides").$type<string[]>().notNull(),
  washbinProvides: jsonb("washbin_provides").$type<string[]>().notNull(),
  faqs: jsonb("faqs").$type<Faq[]>().notNull(),
  washers: integer("washers").notNull(), // number of washers who will come
  priceMayChangeOnSite: boolean("price_may_change_on_site").notNull().default(false),
  photosRequired: boolean("photos_required").notNull().default(true), // before/after photos
  quoteOnly: boolean("quote_only").notNull().default(false),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const serviceVariants = pgTable("service_variants", {
  id: serial("id").primaryKey(),
  serviceId: integer("service_id")
    .notNull()
    .references(() => services.id),
  name: text("name").notNull(),
  group: text("group"), // optional grouping label, e.g. "Hatchback", "Fabric"
  price: integer("price").notNull(), // paise, per unit
  durationMinutes: integer("duration_minutes").notNull(), // per unit
  unitLabel: text("unit_label"), // set when quantity is allowed, e.g. "bathroom", "tank"
  maxQty: integer("max_qty").notNull().default(1),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const serviceAddons = pgTable("service_addons", {
  id: serial("id").primaryKey(),
  serviceId: integer("service_id")
    .notNull()
    .references(() => services.id),
  name: text("name").notNull(),
  price: integer("price").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  maxQty: integer("max_qty").notNull().default(1),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const slotTemplates = pgTable("slot_templates", {
  id: serial("id").primaryKey(),
  label: text("label").notNull(),
  startMinute: integer("start_minute").notNull(),
  endMinute: integer("end_minute").notNull(),
  active: boolean("active").notNull().default(true),
});

// ---------- Addresses ----------

export type AddressSnapshot = {
  label: string;
  flat: string;
  wing: string | null;
  society: string;
  street: string | null;
  landmark: string | null;
  locality: string;
  pincode: string;
  lat: number | null;
  lng: number | null;
};

export const addresses = pgTable("addresses", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  label: text("label").notNull(), // home | office | other
  flat: text("flat").notNull(),
  wing: text("wing"),
  society: text("society").notNull(),
  street: text("street"),
  landmark: text("landmark"),
  pincode: text("pincode").notNull(),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: createdAt(),
});

// ---------- Bookings ----------

export const bookingStatus = pgEnum("booking_status", [
  "payment_pending",
  "confirmed",
  "assigned",
  "on_the_way",
  "arrived",
  "in_progress",
  "completed",
  "rated",
  "cancelled",
]);

export const paymentOption = pgEnum("payment_option", ["full", "advance", "after_service", "cash"]);

export const bookings = pgTable(
  "bookings",
  {
    id: serial("id").primaryKey(),
    code: text("code").notNull().unique(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    addressId: integer("address_id").references(() => addresses.id),
    address: jsonb("address").$type<AddressSnapshot>().notNull(),
    areaId: integer("area_id")
      .notNull()
      .references(() => serviceAreas.id),
    date: date("date").notNull(), // IST calendar date, YYYY-MM-DD
    slotId: integer("slot_id")
      .notNull()
      .references(() => slotTemplates.id),
    durationMinutes: integer("duration_minutes").notNull(),
    status: bookingStatus("status").notNull(),
    paymentOption: paymentOption("payment_option").notNull(),
    subtotal: integer("subtotal").notNull(),
    visitCharge: integer("visit_charge").notNull(),
    discount: integer("discount").notNull(),
    tax: integer("tax").notNull(),
    total: integer("total").notNull(),
    dueNow: integer("due_now").notNull(), // what the customer must pay before the booking is confirmed
    amountPaid: integer("amount_paid").notNull().default(0),
    couponCode: text("coupon_code"),
    instructions: text("instructions"),
    washerId: uuid("washer_id").references(() => users.id),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    cancelReason: text("cancel_reason"),
    createdAt: createdAt(),
  },
  (t) => [index("bookings_slot_idx").on(t.areaId, t.date, t.slotId), index("bookings_user_idx").on(t.userId)],
);

export const bookingItems = pgTable("booking_items", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id")
    .notNull()
    .references(() => bookings.id, { onDelete: "cascade" }),
  serviceId: integer("service_id")
    .notNull()
    .references(() => services.id),
  kind: text("kind").$type<"variant" | "addon">().notNull(),
  variantId: integer("variant_id").references(() => serviceVariants.id),
  addonId: integer("addon_id").references(() => serviceAddons.id),
  name: text("name").notNull(), // snapshot, e.g. "Deep home cleaning, 2 BHK"
  unitPrice: integer("unit_price").notNull(),
  qty: integer("qty").notNull(),
  durationMinutes: integer("duration_minutes").notNull(), // total for this line
});

export const bookingEvents = pgTable("booking_events", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id")
    .notNull()
    .references(() => bookings.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // a booking status or an action like "rescheduled", "payment_failed"
  note: text("note"),
  createdAt: createdAt(),
});

export const bookingPhotos = pgTable("booking_photos", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id")
    .notNull()
    .references(() => bookings.id, { onDelete: "cascade" }),
  kind: text("kind").$type<"customer" | "before" | "after">().notNull(),
  path: text("path").notNull(), // relative to storage/uploads
  createdAt: createdAt(),
});

// ---------- Payments ----------

export const paymentStatus = pgEnum("payment_status", ["created", "captured", "failed"]);

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: integer("booking_id")
    .notNull()
    .references(() => bookings.id),
  purpose: text("purpose").$type<"full" | "advance" | "balance">().notNull(),
  amount: integer("amount").notNull(),
  provider: text("provider").notNull(), // "mock" now, "razorpay" later
  providerOrderId: text("provider_order_id"),
  providerPaymentId: text("provider_payment_id"),
  method: text("method"), // upi | card | netbanking | wallet
  status: paymentStatus("status").notNull().default("created"),
  createdAt: createdAt(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const refunds = pgTable("refunds", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id")
    .notNull()
    .references(() => bookings.id),
  paymentId: uuid("payment_id").references(() => payments.id),
  amount: integer("amount").notNull(),
  destination: text("destination").$type<"original" | "wallet">().notNull(),
  status: text("status").$type<"initiated" | "processed" | "failed">().notNull(),
  reason: text("reason").notNull(),
  createdAt: createdAt(),
});

// ---------- Coupons ----------

export const coupons = pgTable("coupons", {
  code: text("code").primaryKey(),
  description: text("description").notNull(),
  type: text("type").$type<"percent" | "flat">().notNull(),
  value: integer("value").notNull(), // percent (0-100) or paise
  maxDiscount: integer("max_discount"),
  minOrder: integer("min_order").notNull().default(0),
  firstBookingOnly: boolean("first_booking_only").notNull().default(false),
  serviceId: integer("service_id").references(() => services.id),
  usageLimit: integer("usage_limit"),
  perUserLimit: integer("per_user_limit").notNull().default(1),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  public: boolean("public").notNull().default(true),
  active: boolean("active").notNull().default(true),
});

export const couponRedemptions = pgTable(
  "coupon_redemptions",
  {
    id: serial("id").primaryKey(),
    code: text("code")
      .notNull()
      .references(() => coupons.code),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    bookingId: integer("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("coupon_redemption_booking_idx").on(t.bookingId)],
);

// ---------- Leads & messages ----------

export const quoteRequests = pgTable("quote_requests", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  pincode: text("pincode").notNull(),
  description: text("description").notNull(),
  status: text("status").$type<"new" | "quoted" | "accepted" | "declined">().notNull().default("new"),
  createdAt: createdAt(),
});

export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contact: text("contact").notNull(),
  message: text("message").notNull(),
  createdAt: createdAt(),
});

// ---------- Notifications ----------

export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    bookingId: integer("booking_id").references(() => bookings.id),
    event: text("event").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    channels: jsonb("channels").$type<string[]>().notNull(), // channels the message was sent on
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("notifications_user_idx").on(t.userId, t.createdAt)],
);

// ---------- Relations ----------

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const servicesRelations = relations(services, ({ many }) => ({
  variants: many(serviceVariants),
  addons: many(serviceAddons),
}));
export const serviceVariantsRelations = relations(serviceVariants, ({ one }) => ({
  service: one(services, { fields: [serviceVariants.serviceId], references: [services.id] }),
}));
export const serviceAddonsRelations = relations(serviceAddons, ({ one }) => ({
  service: one(services, { fields: [serviceAddons.serviceId], references: [services.id] }),
}));
export const pincodesRelations = relations(pincodes, ({ one }) => ({
  area: one(serviceAreas, { fields: [pincodes.areaId], references: [serviceAreas.id] }),
}));
export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  items: many(bookingItems),
  events: many(bookingEvents),
  photos: many(bookingPhotos),
  payments: many(payments),
  refunds: many(refunds),
  slot: one(slotTemplates, { fields: [bookings.slotId], references: [slotTemplates.id] }),
  area: one(serviceAreas, { fields: [bookings.areaId], references: [serviceAreas.id] }),
}));
export const bookingItemsRelations = relations(bookingItems, ({ one }) => ({
  booking: one(bookings, { fields: [bookingItems.bookingId], references: [bookings.id] }),
}));
export const bookingEventsRelations = relations(bookingEvents, ({ one }) => ({
  booking: one(bookings, { fields: [bookingEvents.bookingId], references: [bookings.id] }),
}));
export const bookingPhotosRelations = relations(bookingPhotos, ({ one }) => ({
  booking: one(bookings, { fields: [bookingPhotos.bookingId], references: [bookings.id] }),
}));
export const paymentsRelations = relations(payments, ({ one }) => ({
  booking: one(bookings, { fields: [payments.bookingId], references: [bookings.id] }),
}));
export const refundsRelations = relations(refunds, ({ one }) => ({
  booking: one(bookings, { fields: [refunds.bookingId], references: [bookings.id] }),
}));
export const notificationsRelations = relations(notifications, ({ one }) => ({
  booking: one(bookings, { fields: [notifications.bookingId], references: [bookings.id] }),
}));

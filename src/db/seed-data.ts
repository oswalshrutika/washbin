/**
 * [DECIDE] Launch catalog, service areas and coupons. Every price, duration and pincode here is a
 * placeholder until Washbin confirms the final list. Prices are written in rupees and stored as paise.
 */

import type { Faq } from "./schema";

const rs = (rupees: number) => rupees * 100;
const h = (hours: number) => Math.round(hours * 60);

type SeedVariant = {
  name: string;
  group?: string;
  price: number;
  durationMinutes: number;
  unitLabel?: string;
  maxQty?: number;
};
type SeedAddon = { name: string; price: number; durationMinutes: number; maxQty?: number };
export type SeedService = {
  slug: string;
  name: string;
  icon: string;
  tagline: string;
  description: string;
  inclusions: string[];
  exclusions: string[];
  customerProvides: string[];
  washbinProvides: string[];
  faqs: Faq[];
  washers: number;
  priceMayChangeOnSite?: boolean;
  photosRequired?: boolean;
  quoteOnly?: boolean;
  variants: SeedVariant[];
  addons: SeedAddon[];
};

const SUPPLIES = ["Professional cleaning chemicals", "Mops, brushes, microfibre cloths", "Vacuum cleaner"];

export const SERVICES: SeedService[] = [
  {
    slug: "deep-home-cleaning",
    name: "Deep home cleaning",
    icon: "Home",
    tagline: "Top-to-bottom clean for your whole home",
    description:
      "A complete deep clean of every room — floors, fans, windows, kitchen surfaces and bathrooms — by a trained Washbin team.",
    inclusions: [
      "Dusting of all reachable surfaces, fans, lights and switchboards",
      "Floor scrubbing and mopping in every room",
      "Window panes, grills and sliding tracks (inside)",
      "Kitchen platform, sink, tiles and exterior of appliances",
      "Bathroom tiles, fittings, toilet and mirror descaling",
      "Cobweb removal and balcony sweep",
    ],
    exclusions: [
      "Inside of fridge, oven or cabinets (available as add-ons)",
      "Exterior window glass on high floors",
      "Wall painting stains, mould treatment or pest control",
      "Shifting heavy furniture",
    ],
    customerProvides: ["Running water", "A power socket for machines", "Access to all rooms", "Parking for the team's vehicle, if available"],
    washbinProvides: [...SUPPLIES, "Scrubbing machine", "Ladder"],
    faqs: [
      { q: "Do I need to be at home?", a: "Someone must be home to let the team in and share the arrival OTP. You can step out once work starts." },
      { q: "How long does it take?", a: "Between 3 and 8 hours depending on home size. The estimate is shown before you book." },
      { q: "Will furniture be moved?", a: "Light furniture is moved and put back. Heavy items like wardrobes and beds are cleaned around." },
    ],
    washers: 2,
    variants: [
      { name: "Single room", group: "By room", price: rs(899), durationMinutes: h(1.5), unitLabel: "room", maxQty: 4 },
      { name: "1 BHK", group: "By home size", price: rs(2999), durationMinutes: h(4) },
      { name: "2 BHK", group: "By home size", price: rs(3999), durationMinutes: h(5) },
      { name: "3 BHK", group: "By home size", price: rs(4999), durationMinutes: h(6) },
      { name: "4 BHK", group: "By home size", price: rs(6499), durationMinutes: h(7) },
      { name: "Villa / bungalow", group: "By home size", price: rs(8999), durationMinutes: h(8) },
    ],
    addons: [
      { name: "Extra bathroom", price: rs(499), durationMinutes: 45, maxQty: 4 },
      { name: "Inside fridge cleaning", price: rs(399), durationMinutes: 30 },
      { name: "Inside kitchen cabinets", price: rs(499), durationMinutes: 45 },
      { name: "Extra balcony", price: rs(299), durationMinutes: 30, maxQty: 3 },
    ],
  },
  {
    slug: "kitchen-cleaning",
    name: "Kitchen cleaning",
    icon: "CookingPot",
    tagline: "Grease-free platforms, tiles and sink",
    description: "Removes grease and grime from your kitchen platform, tiles, sink and appliance exteriors.",
    inclusions: [
      "Platform, backsplash tiles and wall tiles degreasing",
      "Sink and tap descaling",
      "Exterior of fridge, microwave, chimney and stove",
      "Cabinet exteriors and handles",
      "Floor scrubbing",
    ],
    exclusions: ["Inside of cabinets (deep kitchen only)", "Chimney filter servicing (add-on)", "Utensil washing"],
    customerProvides: ["Running water", "A power socket", "Cleared platform (utensils and food put away)"],
    washbinProvides: [...SUPPLIES, "Degreasing agents"],
    faqs: [
      { q: "What is the difference between standard and deep?", a: "Deep kitchen adds inside-cabinet cleaning, trolley cleaning and a longer degreasing cycle." },
      { q: "Is the chimney included?", a: "The chimney exterior is included. Filter deep-cleaning is an add-on." },
    ],
    washers: 1,
    variants: [
      { name: "Standard kitchen", price: rs(1299), durationMinutes: h(2) },
      { name: "Deep kitchen", price: rs(1999), durationMinutes: h(3) },
    ],
    addons: [
      { name: "Chimney filter deep-clean", price: rs(599), durationMinutes: 45 },
      { name: "Inside fridge cleaning", price: rs(399), durationMinutes: 30 },
      { name: "Inside microwave / oven", price: rs(199), durationMinutes: 20 },
    ],
  },
  {
    slug: "bathroom-cleaning",
    name: "Bathroom cleaning",
    icon: "Bath",
    tagline: "Sparkling, descaled washrooms — priced per bathroom",
    description: "Hard-water stain removal, tile scrubbing and a full sanitise of toilets, fittings and mirrors.",
    inclusions: [
      "Wall and floor tile scrubbing",
      "Hard-water stain removal from taps, showers and glass",
      "Toilet and washbasin deep-clean and sanitise",
      "Mirror, cabinet exterior and exhaust fan wipe",
    ],
    exclusions: ["Plumbing or tile repair", "Grout re-filling", "Heavy acid treatment on marble"],
    customerProvides: ["Running water", "Access to each bathroom"],
    washbinProvides: [...SUPPLIES, "Descaling agents"],
    faqs: [
      { q: "How is it priced?", a: "Per bathroom. Choose the number of bathrooms when booking." },
      { q: "Is it safe for marble or granite?", a: "Yes, the team uses stone-safe products. Tell us in the instructions if your floor is marble." },
    ],
    washers: 1,
    variants: [
      { name: "Standard bathroom", price: rs(499), durationMinutes: 45, unitLabel: "bathroom", maxQty: 6 },
      { name: "Deep bathroom (heavy stains)", price: rs(699), durationMinutes: 60, unitLabel: "bathroom", maxQty: 6 },
    ],
    addons: [{ name: "Exhaust fan deep-clean", price: rs(149), durationMinutes: 15, maxQty: 6 }],
  },
  {
    slug: "sofa-cleaning",
    name: "Sofa cleaning",
    icon: "Sofa",
    tagline: "Shampoo and vacuum, priced by seats and fabric",
    description: "Dry vacuuming plus wet shampooing or leather conditioning, depending on your sofa's fabric.",
    inclusions: [
      "Dry vacuum of seats, back and gaps",
      "Shampoo and extraction (fabric) or clean-and-condition (leather)",
      "Spot treatment of common stains",
      "Cushion cleaning",
    ],
    exclusions: ["Permanent stains like ink or dye may not fully come off", "Repair or re-upholstery", "Mattresses and curtains"],
    customerProvides: ["A power socket", "Running water", "2–4 hours for the sofa to dry"],
    washbinProvides: [...SUPPLIES, "Shampoo extraction machine", "Leather conditioner"],
    faqs: [
      { q: "How long until I can use the sofa?", a: "Fabric sofas need 3–4 hours to dry. Leather can be used right away." },
      { q: "Can I add more seats?", a: "Yes, add extra seats as an add-on." },
    ],
    washers: 1,
    priceMayChangeOnSite: true,
    variants: [
      { name: "3-seater", group: "Fabric", price: rs(799), durationMinutes: h(1.5) },
      { name: "5-seater", group: "Fabric", price: rs(1199), durationMinutes: h(2) },
      { name: "7-seater", group: "Fabric", price: rs(1599), durationMinutes: h(2.5) },
      { name: "3-seater", group: "Leather", price: rs(999), durationMinutes: h(1.5) },
      { name: "5-seater", group: "Leather", price: rs(1499), durationMinutes: h(2) },
    ],
    addons: [
      { name: "Extra seat", price: rs(249), durationMinutes: 20, maxQty: 4 },
      { name: "Fabric protection spray", price: rs(299), durationMinutes: 15 },
    ],
  },
  {
    slug: "carpet-cleaning",
    name: "Carpet cleaning",
    icon: "Layers",
    tagline: "Deep shampoo for rugs and carpets, by size",
    description: "Vacuum, shampoo and extraction for carpets and rugs at your home.",
    inclusions: ["Dry vacuum both sides (where possible)", "Shampoo and hot-water extraction", "Spot stain treatment", "Deodorising"],
    exclusions: ["Silk or antique hand-woven carpets", "Wall-to-wall fitted carpet over 200 sq. ft. (ask for a quote)", "Pet-urine odour guarantee"],
    customerProvides: ["A power socket", "Running water", "Space to lay the carpet flat", "Time for it to dry (4–6 hours)"],
    washbinProvides: [...SUPPLIES, "Carpet extraction machine"],
    faqs: [
      { q: "How do I know my carpet size?", a: "Multiply length × width in feet. A 5 × 8 ft rug is 40 sq. ft." },
      { q: "Do you take the carpet away?", a: "No, all cleaning is done at your home." },
    ],
    washers: 1,
    priceMayChangeOnSite: true,
    variants: [
      { name: "Small (up to 20 sq. ft.)", price: rs(499), durationMinutes: 45, unitLabel: "carpet", maxQty: 5 },
      { name: "Medium (21–40 sq. ft.)", price: rs(799), durationMinutes: 60, unitLabel: "carpet", maxQty: 5 },
      { name: "Large (41–80 sq. ft.)", price: rs(1299), durationMinutes: 90, unitLabel: "carpet", maxQty: 5 },
      { name: "Extra large (81–150 sq. ft.)", price: rs(1999), durationMinutes: 120, unitLabel: "carpet", maxQty: 3 },
    ],
    addons: [{ name: "Anti-allergen treatment", price: rs(249), durationMinutes: 15, maxQty: 5 }],
  },
  {
    slug: "water-tank-cleaning",
    name: "Water tank cleaning",
    icon: "Droplets",
    tagline: "Drain, scrub, sanitise — priced by capacity",
    description: "Mechanised cleaning of overhead and underground tanks, with sludge removal and anti-bacterial treatment.",
    inclusions: ["Draining remaining water", "Sludge and sediment removal", "Wall and floor scrubbing", "High-pressure rinse", "Anti-bacterial disinfection"],
    exclusions: ["Tank repair or leak sealing", "Pipe and plumbing work", "Tanks without safe access (no ladder point or opening under 18 inches)"],
    customerProvides: ["Safe access to the tank (terrace key, society permission)", "A power socket within 30 m", "Water supply off during cleaning"],
    washbinProvides: ["Submersible pump", "Pressure washer", "Disinfectant", "Safety gear and ladder"],
    faqs: [
      { q: "How often should I clean my tank?", a: "Every 3–6 months is recommended for drinking-water tanks." },
      { q: "When can I refill?", a: "Right after the team finishes. Disinfectant used is safe after the final rinse." },
    ],
    washers: 2,
    priceMayChangeOnSite: true,
    variants: [
      { name: "Up to 500 litres", price: rs(599), durationMinutes: 60, unitLabel: "tank", maxQty: 4 },
      { name: "501–1,000 litres", price: rs(899), durationMinutes: 75, unitLabel: "tank", maxQty: 4 },
      { name: "1,001–2,000 litres", price: rs(1299), durationMinutes: 90, unitLabel: "tank", maxQty: 4 },
      { name: "2,001–5,000 litres", price: rs(2199), durationMinutes: 120, unitLabel: "tank", maxQty: 3 },
      { name: "Underground sump up to 10,000 litres", price: rs(3999), durationMinutes: 180, unitLabel: "sump", maxQty: 2 },
    ],
    addons: [],
  },
  {
    slug: "car-wash",
    name: "Car wash at your doorstep",
    icon: "Car",
    tagline: "Exterior, interior or full wash — by vehicle type",
    description: "Low-water doorstep car wash in your parking spot, with interior vacuuming and dashboard care.",
    inclusions: [
      "Exterior: foam wash, rinse, tyre and rim clean, glass clean",
      "Interior: vacuum of seats, mats and boot, dashboard and door-panel wipe",
      "Full: both exterior and interior",
    ],
    exclusions: ["Rubbing, polishing or ceramic coating", "Engine-bay wash (add-on)", "Removing paint scratches"],
    customerProvides: ["Car parked in an accessible spot with space to walk around it", "One bucket of water", "Car keys for interior cleaning"],
    washbinProvides: ["Car shampoo", "Microfibre towels", "Portable vacuum", "Tyre dresser"],
    faqs: [
      { q: "Is it allowed in my society?", a: "Most societies allow low-water washes. Please check with your society if unsure." },
      { q: "How much water is used?", a: "About one bucket for an exterior wash." },
    ],
    washers: 1,
    variants: [
      { name: "Exterior", group: "Hatchback", price: rs(399), durationMinutes: 40 },
      { name: "Interior", group: "Hatchback", price: rs(499), durationMinutes: 45 },
      { name: "Full wash", group: "Hatchback", price: rs(799), durationMinutes: 75 },
      { name: "Exterior", group: "Sedan", price: rs(499), durationMinutes: 45 },
      { name: "Interior", group: "Sedan", price: rs(599), durationMinutes: 50 },
      { name: "Full wash", group: "Sedan", price: rs(999), durationMinutes: 90 },
      { name: "Exterior", group: "SUV", price: rs(599), durationMinutes: 50 },
      { name: "Interior", group: "SUV", price: rs(699), durationMinutes: 60 },
      { name: "Full wash", group: "SUV", price: rs(1199), durationMinutes: 105 },
    ],
    addons: [
      { name: "Wax polish", price: rs(299), durationMinutes: 20 },
      { name: "Engine-bay dry clean", price: rs(199), durationMinutes: 15 },
    ],
  },
  {
    slug: "custom-cleaning",
    name: "Something else?",
    icon: "Sparkles",
    tagline: "Tell us what you need and we'll send a quote",
    description: "Post-construction clean, office, shop, terrace, or anything not listed. Describe the job and we'll quote within a few hours.",
    inclusions: ["A free quote based on your description and photos", "Washbin-verified team on approval"],
    exclusions: ["Work involving electrical, plumbing or structural repair"],
    customerProvides: ["A clear description and photos if possible"],
    washbinProvides: ["Supplies depending on the job — confirmed in the quote"],
    faqs: [{ q: "How fast will I get a quote?", a: "Usually within 4 working hours." }],
    washers: 1,
    quoteOnly: true,
    variants: [],
    addons: [],
  },
];

// [DECIDE] Areas served at launch. slotCapacity = teams that can work one slot in that area.
export const AREAS: { name: string; city: "Pune" | "PCMC"; slotCapacity: number; pincodes: [string, string][] }[] = [
  {
    name: "Pune Central",
    city: "Pune",
    slotCapacity: 3,
    pincodes: [
      ["411001", "Camp / MG Road"],
      ["411002", "Budhwar Peth"],
      ["411005", "Shivajinagar"],
      ["411011", "Kasba Peth"],
      ["411030", "Sadashiv Peth"],
      ["411042", "Swargate"],
    ],
  },
  {
    name: "Pune West",
    city: "Pune",
    slotCapacity: 3,
    pincodes: [
      ["411004", "Deccan / Erandwane"],
      ["411038", "Kothrud"],
      ["411052", "Karve Nagar"],
      ["411058", "Warje"],
      ["411021", "Bavdhan"],
    ],
  },
  {
    name: "Pune North-West",
    city: "Pune",
    slotCapacity: 3,
    pincodes: [
      ["411007", "Aundh"],
      ["411008", "Pashan"],
      ["411016", "Model Colony"],
      ["411045", "Baner / Balewadi"],
      ["411067", "Aundh Road"],
    ],
  },
  {
    name: "Pune East",
    city: "Pune",
    slotCapacity: 3,
    pincodes: [
      ["411006", "Yerawada"],
      ["411014", "Viman Nagar / Kharadi"],
      ["411015", "Vishrantwadi / Dhanori"],
      ["411036", "Mundhwa / Koregaon Park"],
      ["411047", "Lohegaon"],
    ],
  },
  {
    name: "Pune South-East",
    city: "Pune",
    slotCapacity: 3,
    pincodes: [
      ["411013", "Hadapsar"],
      ["411028", "Magarpatta"],
      ["411040", "Wanowrie"],
      ["411048", "Kondhwa"],
      ["411060", "NIBM / Undri"],
    ],
  },
  {
    name: "Pune South",
    city: "Pune",
    slotCapacity: 2,
    pincodes: [
      ["411009", "Parvati"],
      ["411037", "Bibwewadi / Market Yard"],
      ["411041", "Dhayari / Vadgaon"],
      ["411043", "Dhankawadi"],
      ["411046", "Katraj"],
      ["411051", "Sinhagad Road"],
    ],
  },
  {
    name: "Hinjewadi & Wakad",
    city: "PCMC",
    slotCapacity: 3,
    pincodes: [
      ["411057", "Hinjewadi / Wakad"],
      ["411027", "Sangvi / Pimple Gurav"],
      ["411061", "Pimple Saudagar"],
    ],
  },
  {
    name: "Pimpri-Chinchwad",
    city: "PCMC",
    slotCapacity: 3,
    pincodes: [
      ["411017", "Pimpri"],
      ["411018", "Pimpri Colony"],
      ["411019", "Chinchwad"],
      ["411033", "Chinchwad East"],
      ["411035", "Akurdi"],
      ["411044", "Nigdi / Pradhikaran"],
      ["411026", "Bhosari"],
      ["411012", "Dapodi"],
      ["411034", "Kasarwadi"],
    ],
  },
];

// [DECIDE] Slot templates (arrival windows), minutes after midnight IST.
export const SLOTS = [
  { label: "8 – 11 AM", startMinute: 8 * 60, endMinute: 11 * 60 },
  { label: "11 AM – 2 PM", startMinute: 11 * 60, endMinute: 14 * 60 },
  { label: "2 – 5 PM", startMinute: 14 * 60, endMinute: 17 * 60 },
  { label: "5 – 8 PM", startMinute: 17 * 60, endMinute: 20 * 60 },
];

// [DECIDE] Launch coupons.
export const COUPONS = [
  {
    code: "WELCOME10",
    description: "10% off your first booking, up to ₹300",
    type: "percent" as const,
    value: 10,
    maxDiscount: rs(300),
    minOrder: 0,
    firstBookingOnly: true,
    expiresAt: null,
  },
  {
    code: "LAUNCH200",
    description: "₹200 off bookings of ₹1,499 or more — launch month only",
    type: "flat" as const,
    value: rs(200),
    maxDiscount: null,
    minOrder: rs(1499),
    firstBookingOnly: false,
    expiresAt: new Date("2026-11-30T23:59:59+05:30"),
  },
];

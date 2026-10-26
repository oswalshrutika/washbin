const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
const inrWhole = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

/** Formats integer paise as rupees, dropping ".00" for whole amounts. */
export function formatINR(paise: number): string {
  return paise % 100 === 0 ? inrWhole.format(paise / 100) : inr.format(paise / 100);
}

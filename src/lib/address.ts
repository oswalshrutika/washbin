type AddressParts = {
  flat: string;
  wing: string | null;
  society: string;
  street: string | null;
  landmark: string | null;
  pincode: string;
  locality?: string | null;
};

export function formatAddress(a: AddressParts) {
  return [
    [a.flat, a.wing && `Wing ${a.wing}`].filter(Boolean).join(", "),
    a.society,
    a.street,
    a.landmark && `Near ${a.landmark}`,
    [a.locality, a.pincode].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(", ");
}

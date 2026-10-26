"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { ChevronLeft } from "lucide-react";
import {
  getBookingSession,
  getRebookDraft,
  getSlots,
  placeBooking,
  previewQuote,
  type BookingSession,
  type PriceOption,
} from "@/app/actions/booking";
import { PINCODE_KEY, readStoredPincode, type StoredPincode } from "@/components/pincode-checker";
import { PAYMENT, type PaymentOption } from "@/config/business";
import { formatAddress } from "@/lib/address";
import { formatINR } from "@/lib/money";
import { computeQuote, type CatalogService, type Quote } from "@/lib/pricing";
import { formatDuration } from "@/lib/time";
import type { SavedAddress } from "@/server/addresses";
import { useCart } from "./cart";
import { StepAddress } from "./step-address";
import { StepDetails } from "./step-details";
import { StepReview } from "./step-review";
import { StepServices } from "./step-services";
import { StepWhen, type ChosenSlot } from "./step-when";

const STEPS = [
  { key: "services", label: "Services" },
  { key: "when", label: "Time" },
  { key: "address", label: "Address" },
  { key: "details", label: "Details" },
  { key: "review", label: "Book" },
] as const;

const DEFAULT_OPTION: PaymentOption = PAYMENT.options.advance ? "advance" : "full";

export function BookingWizard({ catalog }: { catalog: CatalogService[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const { cart, setCart, loaded, clear } = useCart();

  const [step, setStep] = useState(0);
  const [session, setSession] = useState<BookingSession | null>(null);
  const [pincode, setPincodeState] = useState<StoredPincode | null>(null);
  const [slot, setSlot] = useState<ChosenSlot | null>(null);
  const [addressId, setAddressId] = useState<number | null>(null);
  const [instructions, setInstructions] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [paymentOption, setPaymentOption] = useState<PaymentOption>(DEFAULT_OPTION);
  const [preview, setPreview] = useState<{ quote: Quote; options: PriceOption[] } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [placing, startPlacing] = useTransition();

  const setPincode = useCallback((p: StoredPincode | null) => {
    setPincodeState(p);
    if (p) localStorage.setItem(PINCODE_KEY, JSON.stringify(p));
    else localStorage.removeItem(PINCODE_KEY);
  }, []);

  const refreshSession = useCallback(async () => setSession(await getBookingSession()), []);

  useEffect(() => {
    setPincodeState(readStoredPincode()); // eslint-disable-line react-hooks/set-state-in-effect -- restoring client-only storage
    refreshSession();
  }, [refreshSession]);

  // "Book again": load the past booking's services and address, then go straight to picking a time.
  const again = params.get("again");
  useEffect(() => {
    if (!again || !loaded) return;
    getRebookDraft(again).then((res) => {
      if (!res.ok) return setNotice(res.error);
      setCart(res.draft.cart);
      if (res.draft.address) {
        setPincode({ code: res.draft.address.pincode, locality: res.draft.address.locality });
        setAddressId(res.draft.address.id);
      }
      setStep(1);
      router.replace("/book", { scroll: false });
    });
  }, [again, loaded, setCart, setPincode, router]);

  const estimate = useMemo(() => {
    try {
      return cart.length ? computeQuote(cart, catalog) : null;
    } catch {
      return null;
    }
  }, [cart, catalog]);

  // Server-side quote (with coupon) for the review step.
  const key = STEPS[step].key;
  useEffect(() => {
    if (key !== "review" || !cart.length) return;
    let live = true;
    previewQuote({ cart, couponCode }).then((res) => {
      if (!live) return;
      if (res.ok) {
        setPreview(res);
        setError(null);
      } else setError(res.error);
    });
    return () => {
      live = false;
    };
  }, [key, cart, couponCode]);

  const address = session?.addresses.find((a) => a.id === addressId) ?? null;

  async function selectAddress(a: SavedAddress) {
    setNotice(null);
    if (pincode?.code !== a.pincode && slot) {
      // A different area has its own teams, so the chosen time has to be checked again.
      const res = await getSlots({ pincode: a.pincode, date: slot.date, cart });
      const stillOpen = res.ok && res.slots.some((s) => s.id === slot.slotId && s.available);
      setPincode({ code: a.pincode, locality: a.locality ?? a.pincode });
      setAddressId(a.id);
      if (!stillOpen) {
        setSlot(null);
        setNotice(`Your chosen time isn't open in ${a.locality ?? a.pincode}. Please pick another.`);
        setStep(1);
      }
      return;
    }
    if (pincode?.code !== a.pincode) setPincode({ code: a.pincode, locality: a.locality ?? a.pincode });
    setAddressId(a.id);
  }

  const canContinue = [cart.length > 0 && !!estimate, !!slot && !!pincode, !!address && !!session?.user, true, !!preview && !error][step];

  function next() {
    setError(null);
    if (key !== "review") {
      setStep(step + 1);
      window.scrollTo({ top: 0 });
      return;
    }
    startPlacing(async () => {
      const form = new FormData();
      form.set(
        "payload",
        JSON.stringify({ cart, date: slot!.date, slotId: slot!.slotId, addressId, instructions, paymentOption, couponCode }),
      );
      photos.forEach((p) => form.append("photos", p));
      const res = await placeBooking(form);
      if (!res.ok) return setError(res.error);
      clear();
      router.push(res.paymentId ? `/pay/${res.paymentId}` : `/book/confirmed/${res.code}`);
    });
  }

  if (!loaded) return <p className="text-ink-soft">Loading your cart…</p>;

  const due = preview?.options.find((o) => o.option === paymentOption)?.dueNow ?? 0;
  const total = key === "review" && preview ? preview.quote.total : estimate ? estimate.total : 0;

  return (
    <div className="pb-32">
      <ol className="mb-8 flex gap-1.5" aria-label="Booking steps">
        {STEPS.map((s, i) => (
          <li key={s.key} className="flex-1">
            <button
              type="button"
              disabled={i >= step}
              onClick={() => setStep(i)}
              aria-current={i === step ? "step" : undefined}
              className={`w-full border-t-4 pt-1.5 text-left text-sm font-semibold ${
                i < step ? "border-teal text-teal hover:text-ink" : i === step ? "border-ink" : "border-grout-deep text-ink-soft"
              }`}
            >
              {s.label}
            </button>
          </li>
        ))}
      </ol>

      {key === "services" && <StepServices catalog={catalog} cart={cart} setCart={setCart} initialSlug={params.get("service")} />}
      {key === "when" && <StepWhen cart={cart} pincode={pincode} setPincode={setPincode} chosen={slot} setChosen={setSlot} notice={notice} />}
      {key === "address" &&
        (session ? (
          <StepAddress
            signedIn={!!session.user}
            onSignedIn={() => {
              refreshSession();
              router.refresh();
            }}
            addresses={session.addresses}
            setAddresses={(addresses) => setSession({ ...session, addresses })}
            selectedId={addressId}
            onSelect={selectAddress}
            pincode={pincode?.code ?? null}
          />
        ) : (
          <p className="text-ink-soft">Loading…</p>
        ))}
      {key === "details" && <StepDetails instructions={instructions} setInstructions={setInstructions} photos={photos} setPhotos={setPhotos} />}
      {key === "review" && slot && address && (
        <StepReview
          quote={preview?.quote ?? null}
          options={preview?.options ?? []}
          slot={slot}
          addressText={formatAddress(address)}
          couponCode={couponCode}
          applyCoupon={async (code) => setCouponCode(code)}
          paymentOption={paymentOption}
          setPaymentOption={setPaymentOption}
          photosCount={photos.length}
          instructions={instructions.trim()}
        />
      )}

      <div className="fixed inset-x-0 bottom-0 z-20 border-t-2 border-grout bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 py-3">
          {error && (
            <p role="alert" className="mb-2 text-brick">
              {error}
            </p>
          )}
          <div className="flex items-center gap-3">
            {step > 0 && (
              <button type="button" className="btn-secondary px-3" onClick={() => setStep(step - 1)} aria-label="Back">
                <ChevronLeft className="size-5" />
              </button>
            )}
            <div className="flex-1" aria-live="polite">
              {total > 0 ? (
                <>
                  <p className="font-display text-xl leading-tight font-bold">
                    {formatINR(total)}
                    {key !== "review" && <span className="text-sm font-normal text-ink-soft"> incl. GST</span>}
                  </p>
                  <p className="text-sm text-ink-soft">
                    {key === "review" && preview
                      ? due > 0
                        ? `${formatINR(due)} due now`
                        : "Nothing due now"
                      : estimate && `About ${formatDuration(estimate.durationMinutes)}`}
                  </p>
                </>
              ) : (
                <p className="text-ink-soft">Add a service to see the price</p>
              )}
            </div>
            <button type="button" className="btn-primary" disabled={!canContinue || placing} onClick={next}>
              {key !== "review" ? "Continue" : placing ? "Booking…" : due > 0 ? `Pay ${formatINR(due)}` : "Confirm booking"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

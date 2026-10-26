import type { Metadata } from "next";
import { submitQuoteRequest } from "@/app/actions/public";
import { ActionForm } from "@/components/action-form";
import { PageTitle } from "@/components/page-title";

export const metadata: Metadata = {
  title: "Ask for a cleaning quote",
  description: "Post-construction, move-in, office or anything else. Tell Washbin what needs cleaning and get a quote.",
};

export default function CustomCleaningPage() {
  return (
    <>
      <PageTitle
        title="Something else?"
        lead="Move-in or move-out cleaning, post-construction dust, an office, a terrace. Tell us about the job and we'll call or WhatsApp you with a fixed quote."
      />
      <div className="mx-auto max-w-xl px-4 py-10">
        <ActionForm action={submitQuoteRequest} submitLabel="Request a quote">
          <div>
            <label className="label" htmlFor="q-name">
              Your name
            </label>
            <input id="q-name" name="name" className="field" autoComplete="name" required />
          </div>
          <div>
            <label className="label" htmlFor="q-phone">
              Mobile number
            </label>
            <input id="q-phone" name="phone" className="field" inputMode="tel" autoComplete="tel" placeholder="98765 43210" required />
          </div>
          <div>
            <label className="label" htmlFor="q-pincode">
              Pincode
            </label>
            <input id="q-pincode" name="pincode" className="field" inputMode="numeric" maxLength={6} autoComplete="postal-code" required />
          </div>
          <div>
            <label className="label" htmlFor="q-description">
              What needs cleaning?
            </label>
            <textarea
              id="q-description"
              name="description"
              rows={5}
              className="field py-3"
              placeholder="For example: 3 BHK after painting, about 1,400 sq ft, need it done before 10 Nov."
              required
            />
          </div>
        </ActionForm>
      </div>
    </>
  );
}

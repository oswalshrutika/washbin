import type { Metadata } from "next";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { submitContact } from "@/app/actions/public";
import { ActionForm } from "@/components/action-form";
import { PageTitle } from "@/components/page-title";
import { SUPPORT } from "@/config/business";
import { getContent } from "@/content";

export const metadata: Metadata = { title: "Contact and help" };

export default function ContactPage() {
  const t = getContent().contact;
  return (
    <>
      <PageTitle title={t.title} lead={t.lead} />
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-10 md:grid-cols-2">
        <ul className="space-y-5 text-lg">
          <li>
            <a href={`tel:${SUPPORT.phone.replaceAll(" ", "")}`} className="flex items-center gap-3 font-semibold hover:underline">
              <Phone className="size-6 text-teal" aria-hidden />
              Call {SUPPORT.phone}
            </a>
          </li>
          <li>
            <a href={`https://wa.me/${SUPPORT.whatsapp}`} className="flex items-center gap-3 font-semibold hover:underline" target="_blank" rel="noreferrer">
              <MessageCircle className="size-6 text-teal" aria-hidden />
              Chat on WhatsApp
            </a>
          </li>
          <li>
            <a href={`mailto:${SUPPORT.email}`} className="flex items-center gap-3 font-semibold hover:underline">
              <Mail className="size-6 text-teal" aria-hidden />
              {SUPPORT.email}
            </a>
          </li>
          <li className="text-ink-soft">Support hours: {SUPPORT.hours}</li>
        </ul>
        <section>
          <h2 className="mb-4 text-2xl font-bold">Send us a message</h2>
          <ActionForm action={submitContact} submitLabel="Send message">
            <div>
              <label className="label" htmlFor="c-name">
                Your name
              </label>
              <input id="c-name" name="name" className="field" autoComplete="name" required />
            </div>
            <div>
              <label className="label" htmlFor="c-contact">
                Mobile number or email
              </label>
              <input id="c-contact" name="contact" className="field" required />
            </div>
            <div>
              <label className="label" htmlFor="c-message">
                Message
              </label>
              <textarea id="c-message" name="message" rows={5} className="field py-3" required />
            </div>
          </ActionForm>
        </section>
      </div>
    </>
  );
}

import { en, type Content } from "./en";

export const LOCALES = ["en"] as const; // add "mr", "hi" here once translations exist
export type Locale = (typeof LOCALES)[number];

const CONTENT: Record<Locale, Content> = { en };

export function getContent(locale: Locale = "en"): Content {
  return CONTENT[locale];
}

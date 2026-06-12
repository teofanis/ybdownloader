import { DESKTOP_LOCALES } from "@ybdownload/shared/product";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "../locales/en.json";
import es from "../locales/es.json";
import de from "../locales/de.json";
import fr from "../locales/fr.json";
import pt from "../locales/pt.json";
import bg from "../locales/bg.json";
import el from "../locales/el.json";

export const supportedLanguages = {
  en: { name: "English", nativeName: "English" },
  es: { name: "Spanish", nativeName: "Español" },
  de: { name: "German", nativeName: "Deutsch" },
  fr: { name: "French", nativeName: "Français" },
  pt: { name: "Portuguese", nativeName: "Português" },
  bg: { name: "Bulgarian", nativeName: "Български" },
  el: { name: "Greek", nativeName: "Ελληνικά" },
} as const;

export type SupportedLanguage = keyof typeof supportedLanguages;

const supportedLngs = Object.keys(supportedLanguages);

for (const locale of DESKTOP_LOCALES) {
  if (!(locale in supportedLanguages)) {
    throw new Error(
      `supportedLanguages is missing locale "${locale}" from @ybdownload/shared/product`
    );
  }
}

const extraLocales = supportedLngs.filter(
  (locale) =>
    !DESKTOP_LOCALES.includes(locale as (typeof DESKTOP_LOCALES)[number])
);
if (extraLocales.length > 0) {
  throw new Error(
    `supportedLanguages has locales not listed in product.meta.json: ${extraLocales.join(", ")}`
  );
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
      de: { translation: de },
      fr: { translation: fr },
      pt: { translation: pt },
      bg: { translation: bg },
      el: { translation: el },
    },
    supportedLngs,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"],
      lookupLocalStorage: "ybdownloader-lng",
    },
  });

export default i18n;

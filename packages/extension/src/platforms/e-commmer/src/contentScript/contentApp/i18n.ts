import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Import trực tiếp tệp JSON ngôn ngữ tĩnh để trình đóng gói nạp thẳng vào bộ nhớ,
// tránh hoàn toàn lỗi CORS khi fetch file từ web-accessible resources của trình duyệt.
import viTranslation from "../../../../../../public/locales/vi/translation.json";
import enTranslation from "../../../../../../public/locales/en-US/translation.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      vi: {
        translation: viTranslation,
      },
      "en-US": {
        translation: enTranslation,
      },
    },
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    defaultNS: "translation",
    fallbackLng: "vi",
    supportedLngs: ["vi", "en-US"],
  });

export default i18n;

// src/i18n.js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

const resources = {
  en: {
    translation: {
      // Navbar
      nav: { home: "Home", clinic: "Clinic", distribution: "Distribution", about: "About", contact: "Contact", admin: "Admin" },
      // Admin login
      admin: {
        title: "Admin Login",
        email: "Email",
        password: "Password",
        login: "Login",
        otpHint: "OTP is mandatory for every login and valid for 1 minute.",
        officeOnlyTitle: "Office Use Only",
        officeOnlyBody: "This Admin panel is restricted to AV Traders Agri Clinic office staff. Farmers: please use the Clinic section for chat and messages."
      },
      // Farmers page (common labels you use)
      farmers: {
        mobile: "Mobile",
        sendOtp: "Send OTP",
        otp: "OTP",
        name: "Name",
        address: "Address",
        verifyLogin: "Verify & Login",
        typeMsg: "Type a message",
        quotation: "Quotation",
        lastSpray: "Last Spray",
        date: "Date",
        chemical: "Chemical",
        dosage: "Dosage",
        openQuotation: "Open Quotation",
        clearChat: "Clear Chat (Me)"
      },
      // Contact section
      contact: {
        heading: "We’re here to help you grow",
        address: "Address",
        phone: "Phone",
        email: "Email",
        hours: "Working Hours",
        openInMaps: "Open in Google Maps",
        call: "Call",
        whatsapp: "WhatsApp"
      }
    }
  },
  kn: {
    translation: {
      nav: { home: "ಮುಖಪುಟ", clinic: "ಕ್ಲಿನಿಕ್", distribution: "ವಿತರಣೆ", about: "ನಮ್ಮ ಬಗ್ಗೆ", contact: "ಸಂಪರ್ಕ", admin: "ನಿರ್ವಹಣೆ" },
      admin: {
        title: "ನಿರ್ವಹಣಾ ಲಾಗಿನ್",
        email: "ಇಮೇಲ್",
        password: "ಪಾಸ್ವರ್ಡ್",
        login: "ಲಾಗಿನ್",
        otpHint: "ಪ್ರತಿ ಲಾಗಿನ್‌ಗೆ OTP ಕಡ್ಡಾಯ. 1 ನಿಮಿಷ ಮಾತ್ರ ಮಾನ್ಯ.",
        officeOnlyTitle: "ಕಚೇರಿ ಬಳಕೆಗೆ ಮಾತ್ರ",
        officeOnlyBody: "ಈ ನಿರ್ವಹಣಾ ಫಲಕ AV ಟ್ರೇಡರ್ಸ್ ಅಗ್ರಿ ಕ್ಲಿನಿಕ್ ಸಿಬ್ಬಂದಿಗೆ ಮಾತ್ರ. ರೈತರೆ, ಚಾಟ್ ಮತ್ತು ಸಂದೇಶಗಳಿಗಾಗಿ ಕ್ಲಿನಿಕ್ ವಿಭಾಗವನ್ನು ಬಳಸಿ."
      },
      farmers: {
        mobile: "ಮೊಬೈಲ್",
        sendOtp: "OTP ಕಳುಹಿಸಿ",
        otp: "OTP",
        name: "ಹೆಸರು",
        address: "ವಿಳಾಸ",
        verifyLogin: "ಪರಿಶೀಲಿಸಿ & ಲಾಗಿನ್",
        typeMsg: "ಸಂದೇಶ ಟೈಪ್ ಮಾಡಿ",
        quotation: "ಕೋಟೇಶನ್",
        lastSpray: "ಕೊನೆಯ ಸ್ಪ್ರೆ",
        date: "ದಿನಾಂಕ",
        chemical: "ರಸಾಯನ",
        dosage: "ಮಾತ್ರೆ",
        openQuotation: "ಕೋಟೇಶನ್ ತೆರೆಯಿರಿ",
        clearChat: "ಚಾಟ್ ಕ್ಲೀರ್ (ನಾನು)"
      },
      contact: {
        heading: "ನಿಮ್ಮ ಬೆಳವಣಿಗೆಗೆ ನಾವು ಸಿದ್ಧ",
        address: "ವಿಳಾಸ",
        phone: "ಫೋನ್",
        email: "ಇಮೇಲ್",
        hours: "ಕಾರ್ಯವೇಳೆ",
        openInMaps: "ಗೂಗಲ್ ಮ್ಯಾಪ್ಸ್‌ನಲ್ಲಿ ತೆರೆಯಿರಿ",
        call: "ಕಾಲ್",
        whatsapp: "ವಾಟ್ಸಾಪ್"
      }
    }
  }
};

i18n
  .use(LanguageDetector) // reads saved pref from localStorage/navigator
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    detection: { order: ["localStorage", "navigator", "htmlTag"], caches: ["localStorage"] },
    interpolation: { escapeValue: false }
  });

export default i18n;

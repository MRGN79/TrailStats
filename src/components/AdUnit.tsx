import { useEffect } from "react";
import { useTranslation } from "react-i18next";

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

interface AdUnitProps {
  slot: string;
  consent: boolean;
  format?: "auto" | "horizontal" | "rectangle";
  className?: string;
}

export function AdUnit({ slot, consent, format = "auto", className }: AdUnitProps) {
  const { t } = useTranslation();
  const publisherId = import.meta.env.VITE_ADSENSE_PUBLISHER_ID as string | undefined;

  useEffect(() => {
    if (!publisherId || !slot || !consent) return;

    if (!document.querySelector('script[src*="adsbygoogle"]')) {
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`;
      script.crossOrigin = "anonymous";
      document.head.appendChild(script);
    }

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // non-fatal in development
    }
  }, [publisherId, slot, consent]);

  if (!publisherId || !slot || !consent) return null;

  return (
    <div role="complementary" className={`ad-unit${className ? ` ${className}` : ""}`} aria-label={t("ads.label")}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={publisherId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}

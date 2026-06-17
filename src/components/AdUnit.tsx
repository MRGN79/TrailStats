import { useEffect } from "react";
import { useTranslation } from "react-i18next";

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

const PUBLISHER_ID = import.meta.env.VITE_ADSENSE_PUBLISHER_ID as string | undefined;

interface AdUnitProps {
  slot: string;
  format?: "auto" | "horizontal" | "rectangle";
  className?: string;
}

export function AdUnit({ slot, format = "auto", className }: AdUnitProps) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!PUBLISHER_ID || !slot) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // non-fatal in development
    }
  }, [slot]);

  if (!PUBLISHER_ID || !slot) return null;

  return (
    <div role="complementary" className={`ad-unit${className ? ` ${className}` : ""}`} aria-label={t("ads.label")}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={PUBLISHER_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}

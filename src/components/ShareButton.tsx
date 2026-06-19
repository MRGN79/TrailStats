import { useState } from "react";
import { useTranslation } from "react-i18next";
import { generateShareCard, type ShareCardData } from "../lib/shareCard";

interface Props {
  getData: () => ShareCardData;
  label?: string;
}

export function ShareButton({ getData, label }: Props) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    if (busy) return;
    setBusy(true);
    try {
      const blob = await generateShareCard(getData());
      const file = new File([blob], "trailstats.png", { type: "image/png" });
      if (
        typeof navigator.share === "function" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({ files: [file], title: "TrailStats" });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "trailstats.png";
        document.body.appendChild(a);
        a.click();
        a.remove();
        // Defer revoke so the browser has time to initiate the download
        setTimeout(() => URL.revokeObjectURL(url), 100);
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        console.warn("Share failed", err);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className="share-btn"
      onClick={handleClick}
      disabled={busy}
      aria-label={label ?? t("share.button")}
      title={label ?? t("share.button")}
    >
      <svg
        aria-hidden="true"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </svg>
    </button>
  );
}

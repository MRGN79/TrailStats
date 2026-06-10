import { useState } from "react";
import { useTranslation } from "react-i18next";
import { generateShareCard, type ShareCardData } from "../lib/shareCard";

interface Props {
  getData: () => ShareCardData;
}

export function ShareButton({ getData }: Props) {
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
      aria-label={t("share.button")}
      title={t("share.button")}
    >
      <svg
        aria-hidden="true"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
        <polyline points="16 6 12 2 8 6" />
        <line x1="12" y1="2" x2="12" y2="15" />
      </svg>
      {busy ? "…" : t("share.button")}
    </button>
  );
}

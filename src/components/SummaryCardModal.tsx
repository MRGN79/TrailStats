import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { generateSummaryCard, type SummaryCardData } from "../lib/summaryCard";

interface Props {
  data: SummaryCardData;
  onClose: () => void;
}

export function SummaryCardModal({ data, onClose }: Props) {
  const { t } = useTranslation();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let url: string;
    generateSummaryCard(data).then((blob) => {
      url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    }).catch(() => {});
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [data]);

  useEffect(() => {
    closeBtnRef.current?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  async function handleShare() {
    if (busy || !previewUrl) return;
    setBusy(true);
    try {
      const blob = await generateSummaryCard(data);
      const file = new File([blob], "trailstats-summary.png", { type: "image/png" });
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
        a.download = "trailstats-summary.png";
        document.body.appendChild(a);
        a.click();
        a.remove();
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
    <div
      className="summary-modal-overlay"
      role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="summary-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="summary-modal-title"
      >
        <h2 id="summary-modal-title" className="summary-modal__title">
          {t("share.summaryTitle")}
        </h2>

        <div className="summary-modal__preview">
          {previewUrl
            ? <img src={previewUrl} alt={t("share.summaryTitle")} className="summary-modal__img" />
            : <div className="summary-modal__spinner" aria-busy="true" />}
        </div>

        <div className="summary-modal__actions">
          <button
            type="button"
            className="btn-primary"
            onClick={handleShare}
            disabled={busy || !previewUrl}
          >
            {busy ? "…" : t("share.downloadPng")}
          </button>
          <button
            ref={closeBtnRef}
            type="button"
            className="btn-secondary"
            onClick={onClose}
          >
            {t("share.close")}
          </button>
        </div>
      </div>
    </div>
  );
}

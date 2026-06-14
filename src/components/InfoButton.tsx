import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

interface Props {
  text: string;
}

export function InfoButton({ text }: Props) {
  const { t } = useTranslation();
  const popoverId = useId();
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  function openPopover() {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 8, left: r.left + r.width / 2 });
    }
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onMouseDown(e: MouseEvent) {
      if (btnRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    function onScroll() {
      setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onMouseDown);
    window.addEventListener("scroll", onScroll, { capture: true });
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("scroll", onScroll, { capture: true });
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="info-btn"
        aria-label={t("stats.info.button")}
        aria-expanded={open}
        aria-controls={open ? popoverId : undefined}
        onClick={() => (open ? setOpen(false) : openPopover())}
      >
        i
      </button>
      {open &&
        createPortal(
          <div
            id={popoverId}
            className="info-btn__popover"
            style={{ top: pos.top, left: pos.left }}
          >
            {text}
          </div>,
          document.body
        )}
    </>
  );
}

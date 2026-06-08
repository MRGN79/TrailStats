import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

interface Props {
  onFile: (file: File) => void;
}

export function UploadZone({ onFile }: Props) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragover, setDragover] = useState(false);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file) onFile(file);
  }

  return (
    <label
      className={`dropzone${dragover ? " dragover" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragover(true);
      }}
      onDragLeave={() => setDragover(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragover(false);
        handleFiles(e.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".zip,application/zip"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <span aria-hidden="true" style={{ fontSize: "2rem" }}>
        ↑
      </span>
      <span>{t("upload.dropzone")}</span>
    </label>
  );
}

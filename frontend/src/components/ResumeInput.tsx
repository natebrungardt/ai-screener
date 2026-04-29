import { useCallback, useRef, useState } from "react";

const ACCEPTED_MIME: Record<string, true> = {
  "text/plain": true,
  "application/pdf": true,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": true,
};

const MAX_MB = 5;
const MAX_BYTES = MAX_MB * 1024 * 1024;

interface Props {
  onChange: (text: string) => void;
}

// ─── PDF text extraction (no deps, works for text-based PDFs) ────────────────

function unescapePdf(s: string): string {
  return s
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "")
    .replace(/\\t/g, " ")
    .replace(/\\([0-7]{3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
    .replace(/\\(.)/g, "$1");
}

function extractPdfText(buf: ArrayBuffer): string {
  const raw = new TextDecoder("latin1").decode(buf);
  const parts: string[] = [];

  const blockRe = /BT([\s\S]*?)ET/g;
  let block: RegExpExecArray | null;

  while ((block = blockRe.exec(raw)) !== null) {
    const b = block[1];

    // (string) Tj
    const tjRe = /\(([^)\\]*(?:\\.[^)\\]*)*)\)\s*Tj/g;
    let m: RegExpExecArray | null;
    while ((m = tjRe.exec(b)) !== null) parts.push(unescapePdf(m[1]));

    // [(items...)] TJ
    const tjArrRe = /\[([^\]]*)\]\s*TJ/g;
    while ((m = tjArrRe.exec(b)) !== null) {
      const strRe = /\(([^)\\]*(?:\\.[^)\\]*)*)\)/g;
      let s: RegExpExecArray | null;
      while ((s = strRe.exec(m[1])) !== null) parts.push(unescapePdf(s[1]));
    }
  }

  return parts.join(" ").replace(/\s{2,}/g, " ").trim();
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function validateFile(f: File): string | null {
  if (!ACCEPTED_MIME[f.type]) {
    return "Invalid file type. Please upload a PDF, DOCX, or TXT file.";
  }
  if (f.size > MAX_BYTES) {
    return `File is too large — max ${MAX_MB}MB.`;
  }
  return null;
}

function fmtBytes(n: number): string {
  return n < 1024 ? `${n} B` : `${(n / 1024).toFixed(0)} KB`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ResumeInput({ onChange }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [extracted, setExtracted] = useState(false); // did we get text from the file?
  const [pasteText, setPasteText] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (f: File) => {
      const err = validateFile(f);
      if (err) {
        setFileError(err);
        return;
      }

      setFileError(null);
      setFile(f);
      setPasteText("");

      if (f.type === "text/plain") {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = (e.target?.result as string) ?? "";
          setExtracted(true);
          onChange(text);
        };
        reader.readAsText(f);
        return;
      }

      if (f.type === "application/pdf") {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = extractPdfText(e.target?.result as ArrayBuffer);
          if (text.length > 60) {
            setExtracted(true);
            onChange(text);
          } else {
            // Scanned/image PDF — user must paste
            setExtracted(false);
            onChange("");
          }
        };
        reader.readAsArrayBuffer(f);
        return;
      }

      // DOCX — requires server-side parsing; user pastes text below
      setExtracted(false);
      onChange("");
    },
    [onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) processFile(f);
    },
    [processFile]
  );

  const handleRemove = () => {
    setFile(null);
    setExtracted(false);
    setFileError(null);
    onChange(pasteText);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handlePasteChange = (text: string) => {
    setPasteText(text);
    // When file is uploaded but extraction failed, the textarea is the source of truth
    if (!file || !extracted) onChange(text);
  };

  const textareaDisabled = !!file && extracted;

  let fileStatus: { label: string; ok: boolean } | null = null;
  if (file) {
    if (extracted) {
      fileStatus = { label: "Text extracted", ok: true };
    } else if (file.type === "application/pdf") {
      fileStatus = { label: "Could not extract text — paste below", ok: false };
    } else {
      fileStatus = { label: "Paste the resume text in the field below", ok: false };
    }
  }

  return (
    <div className="resume-input">
      {/* Drop zone */}
      <div
        className={[
          "ri-zone",
          dragging ? "ri-zone--dragging" : "",
          file ? "ri-zone--filled" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !file && inputRef.current?.click()}
        tabIndex={file ? -1 : 0}
        onKeyDown={(e) => !file && e.key === "Enter" && inputRef.current?.click()}
        role={file ? "region" : "button"}
        aria-label={file ? `Uploaded: ${file.name}` : "Upload resume file"}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".txt,.pdf,.docx"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) processFile(f);
          }}
        />

        {file && fileStatus ? (
          <div className="ri-file">
            <span className="ri-file__icon" aria-hidden="true">
              <FileIcon />
            </span>
            <div className="ri-file__info">
              <span className="ri-file__name">{file.name}</span>
              <span
                className={`ri-file__meta ${fileStatus.ok ? "ri-file__meta--ok" : "ri-file__meta--warn"}`}
              >
                {fmtBytes(file.size)} · {fileStatus.label}
              </span>
            </div>
            <button
              className="ri-file__remove"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
              aria-label="Remove file"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="ri-empty">
            <span className="ri-empty__icon" aria-hidden="true">
              <UploadIcon />
            </span>
            <div className="ri-empty__text">
              <span className="ri-empty__primary">Drop resume here</span>
              <span className="ri-empty__secondary">
                or <span className="ri-empty__browse">browse files</span>
              </span>
            </div>
            <span className="ri-empty__hint">PDF, DOCX, TXT · max {MAX_MB}MB</span>
          </div>
        )}
      </div>

      {fileError && <p className="ri-error">{fileError}</p>}

      {/* Divider */}
      <div className="ri-divider">
        <span>or paste resume text</span>
      </div>

      {/* Paste textarea */}
      <textarea
        className={`field__textarea${textareaDisabled ? " field__textarea--muted" : ""}`}
        placeholder={
          textareaDisabled
            ? "File uploaded and text extracted — remove file to edit manually"
            : file
            ? `Paste the text from ${file.name} here…`
            : "Paste resume content here…"
        }
        value={textareaDisabled ? "" : pasteText}
        disabled={textareaDisabled}
        onChange={(e) => handlePasteChange(e.target.value)}
        rows={6}
        aria-label="Paste resume text"
      />
    </div>
  );
}

function UploadIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <path
        d="M11 3v12M11 3L7 7M11 3l4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M4 2h7l4 4v10a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path d="M11 2v4h4" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path
        d="M6 9h6M6 12h6M6 15h3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

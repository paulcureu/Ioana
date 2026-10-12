"use client";

import { useEffect, useRef } from "react";
import { CHAPTERS, PDF_PAGE_COUNT, thumbSrc } from "@/lib/book";
import { IconClose } from "./Icons";

function useEscape(onClose: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);
}

const range = (a: number, b: number) => (a === b ? `p. ${a}` : `p. ${a}–${b}`);

/** Cuprinsul, ca o fișă de index liniată. */
export function TocCard({
  current,
  onGo,
  onClose,
}: {
  current: number[];
  onGo: (pdfPage: number) => void;
  onClose: () => void;
}) {
  useEscape(onClose);
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => first.current?.focus(), []);

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="indexcard"
        role="dialog"
        aria-modal="true"
        aria-labelledby="toc-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="indexcard__head">
          <h2 id="toc-title">Cuprins</h2>
          <button type="button" className="iconbtn iconbtn--ink" onClick={onClose} aria-label="Închide cuprinsul">
            <IconClose />
          </button>
        </div>
        <ol className="indexcard__list">
          <li>
            <button ref={first} type="button" className="toc-row toc-row--minor" onClick={() => onGo(1)}>
              <span className="toc-no">—</span>
              <span className="toc-title">
                <span className="hl">Pagina de titlu</span>
              </span>
              <span className="toc-dots" />
              <span className="toc-page">p. 1</span>
            </button>
          </li>
          {CHAPTERS.map((c) => {
            const active = current.some((p) => p >= c.from && p <= c.to);
            return (
              <li key={c.no}>
                <button
                  type="button"
                  className={`toc-row${active ? " is-active" : ""}`}
                  onClick={() => onGo(c.from)}
                  aria-current={active ? "true" : undefined}
                >
                  <span className="toc-no" style={{ color: c.color }}>
                    {c.no}
                  </span>
                  <span className="toc-title">
                    <span className="hl">{c.title}</span>
                    {c.subtitle && <small>{c.subtitle}</small>}
                  </span>
                  <span className="toc-dots" />
                  <span className="toc-page">{range(c.from, c.to)}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

/** Foaia de contact: toate paginile ca miniaturi, grupate pe duble-pagini. */
export function ContactSheet({
  current,
  onGo,
  onClose,
}: {
  current: number[];
  onGo: (pdfPage: number) => void;
  onClose: () => void;
}) {
  useEscape(onClose);
  const activeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    activeRef.current?.scrollIntoView({ inline: "center", block: "nearest" });
    activeRef.current?.focus({ preventScroll: true });
  }, []);

  // dublele pagini, exact ca în carte: [1] [2,3] [4,5] … [14,15]
  const spreads: number[][] = [[1]];
  for (let p = 2; p <= PDF_PAGE_COUNT; p += 2) spreads.push(p + 1 <= PDF_PAGE_COUNT ? [p, p + 1] : [p]);

  return (
    <div className="overlay overlay--sheet" onClick={onClose}>
      <div
        className="contactsheet"
        role="dialog"
        aria-modal="true"
        aria-label="Toate paginile"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="contactsheet__head">
          <p className="mono">Toate paginile · {PDF_PAGE_COUNT}</p>
          <button type="button" className="iconbtn iconbtn--ink" onClick={onClose} aria-label="Închide miniaturile">
            <IconClose />
          </button>
        </div>
        <div className="contactsheet__strip">
          {spreads.map((s) => {
            const active = s.some((p) => current.includes(p));
            return (
              <button
                key={s[0]}
                ref={active ? activeRef : undefined}
                type="button"
                className={`thumb${active ? " is-active" : ""}${s.length === 1 ? " thumb--single" : ""}`}
                onClick={() => onGo(s[0])}
                aria-label={s.length === 1 ? `Pagina ${s[0]}` : `Paginile ${s[0]} și ${s[1]}`}
                aria-current={active ? "true" : undefined}
              >
                <span className="thumb__pages">
                  {s.map((p) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={p} src={thumbSrc(p)} alt="" loading="lazy" draggable={false} />
                  ))}
                </span>
                <span className="thumb__label mono">{s.map((p) => String(p).padStart(2, "0")).join("–")}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

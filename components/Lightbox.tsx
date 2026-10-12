"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { PAGE_ALT, PDF_PAGE_COUNT, chapterForPdf, pageSrcHd } from "@/lib/book";
import { IconClose, IconNext, IconPrev, IconZoom, IconZoomOut } from "./Icons";

type Props = { page: number; onClose: () => void; onChange: (n: number) => void };

export default function Lightbox({ page, onClose, onChange }: Props) {
  const [zoomed, setZoomed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const pending = useRef<{ fx: number; fy: number } | null>(null);
  const chapter = chapterForPdf(page);

  useEffect(() => {
    closeBtn.current?.focus();
  }, []);

  useEffect(() => {
    setLoaded(false);
    setZoomed(false);
  }, [page]);

  const go = useCallback(
    (d: number) => {
      const n = page + d;
      if (n >= 1 && n <= PDF_PAGE_COUNT) onChange(n);
    },
    [page, onChange]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (zoomed) setZoomed(false);
        else onClose();
      } else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "+" || e.key === "=") setZoomed(true);
      else if (e.key === "-") setZoomed(false);
      e.stopPropagation();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [go, onClose, zoomed]);

  // when zooming in, scroll so the clicked point stays under the cursor
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el || !zoomed || !pending.current) return;
    const { fx, fy } = pending.current;
    el.scrollLeft = fx * el.scrollWidth - el.clientWidth / 2;
    el.scrollTop = fy * el.scrollHeight - el.clientHeight / 2;
    pending.current = null;
  }, [zoomed]);

  const toggleZoom = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!zoomed) {
      const r = e.currentTarget.getBoundingClientRect();
      pending.current = { fx: (e.clientX - r.left) / r.width, fy: (e.clientY - r.top) / r.height };
    }
    setZoomed((z) => !z);
  };

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = scroller.current;
    if (!el || !zoomed || e.buttons) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const r = el.getBoundingClientRect();
    const fx = (e.clientX - r.left) / r.width;
    const fy = (e.clientY - r.top) / r.height;
    el.scrollLeft = fx * (el.scrollWidth - el.clientWidth);
    el.scrollTop = fy * (el.scrollHeight - el.clientHeight);
  };

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={`Pagina ${page} mărită`}>
      <div className="lightbox__bar">
        <p className="lightbox__caption">
          <span className="mono">
            {String(page).padStart(2, "0")} / {PDF_PAGE_COUNT}
          </span>
          {chapter && (
            <span className="lightbox__chapter">
              {chapter.no} · {chapter.title}
            </span>
          )}
        </p>
        <div className="lightbox__actions">
          <button
            type="button"
            className="iconbtn"
            onClick={() => setZoomed((z) => !z)}
            aria-label={zoomed ? "Micșorează" : "Mărește"}
            title={zoomed ? "Micșorează (−)" : "Mărește (+)"}
          >
            {zoomed ? <IconZoomOut /> : <IconZoom />}
          </button>
          <button ref={closeBtn} type="button" className="iconbtn" onClick={onClose} aria-label="Închide" title="Închide (Esc)">
            <IconClose />
          </button>
        </div>
      </div>

      <div
        ref={scroller}
        className={`lightbox__stage${zoomed ? " is-zoomed" : ""}`}
        onMouseMove={onMove}
        onClick={(e) => {
          if (e.target === e.currentTarget && !zoomed) onClose();
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={page}
          src={pageSrcHd(page)}
          alt={PAGE_ALT[page] ?? `Pagina ${page}`}
          className={loaded ? "is-loaded" : ""}
          onLoad={() => setLoaded(true)}
          onClick={toggleZoom}
          draggable={false}
        />
        {!loaded && <span className="lightbox__loading mono">se încarcă…</span>}
      </div>

      <button
        type="button"
        className="lightbox__nav lightbox__nav--prev"
        onClick={() => go(-1)}
        disabled={page <= 1}
        aria-label="Pagina anterioară"
      >
        <IconPrev width={26} height={26} />
      </button>
      <button
        type="button"
        className="lightbox__nav lightbox__nav--next"
        onClick={() => go(1)}
        disabled={page >= PDF_PAGE_COUNT}
        aria-label="Pagina următoare"
      >
        <IconNext width={26} height={26} />
      </button>
    </div>
  );
}

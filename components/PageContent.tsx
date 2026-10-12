"use client";

import { PAGE_ALT, STUDENT, pageSrc, pageSrcSm, type BookPage } from "@/lib/book";
import { IconMagnify } from "./Icons";

/** Desen în linie: casa în două ape cu fereastra circulară („ochiul” din proiectul de la Moigrad). */
export function HouseEmblem({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 112" fill="none" aria-hidden="true" focusable="false">
      <g stroke="currentColor" strokeWidth="1.6" strokeLinejoin="miter" strokeLinecap="square">
        {/* anexa */}
        <path d="M8 104V82L21 69L34 82V104" />
        {/* corpul principal */}
        <path d="M46 104V60L76 28L106 60V104" />
        <circle cx="76" cy="58" r="8" />
        <path d="M66 104V82H78V104" />
        <path d="M86 78H98V90H86Z" />
        {/* soclu din piatră */}
        <path d="M46 96H106" strokeWidth="0.9" />
        {/* teren */}
        <path d="M0 104H120" />
      </g>
    </svg>
  );
}

function Cover() {
  return (
    <div className="cover cover--front">
      <div className="cover__hinge" />
      <div className="cover__inner">
        <p className="cover__label">
          {STUDENT.school}
          <br />
          {STUDENT.city}
        </p>
        <HouseEmblem className="cover__emblem" />
        <div className="cover__titleblock">
          <p className="cover__title deboss">{STUDENT.title}</p>
          <span className="cover__rule" />
          <p className="cover__name deboss">{STUDENT.name}</p>
          <p className="cover__meta">
            {STUDENT.year} · {STUDENT.group} · {STUDENT.season}
          </p>
        </div>
      </div>
    </div>
  );
}

function BackCover() {
  return (
    <div className="cover cover--back">
      <div className="cover__hinge cover__hinge--right" />
      <div className="cover__back">
        <HouseEmblem className="cover__emblem cover__emblem--small" />
        <p className="cover__meta">
          {STUDENT.name} — {STUDENT.title}
        </p>
        <p className="cover__meta cover__meta--dim">FAU {STUDENT.city} · {STUDENT.season}</p>
      </div>
    </div>
  );
}

function Endpaper() {
  return (
    <div className="endpaper">
      <div className="exlibris">
        <HouseEmblem className="exlibris__emblem" />
        <p className="exlibris__title">Ex libris</p>
        <p className="exlibris__name">{STUDENT.name}</p>
        <p className="exlibris__meta">
          {STUDENT.year} · {STUDENT.group}
        </p>
      </div>
      <div className="gutter" />
    </div>
  );
}

function PdfPage({ n, onZoom }: { n: number; onZoom: (n: number) => void }) {
  return (
    <div className="pdfpage">
      <img
        src={pageSrc(n)}
        srcSet={`${pageSrcSm(n)} 900w, ${pageSrc(n)} 1600w`}
        sizes="(max-width: 900px) 50vw, 46vw"
        alt={PAGE_ALT[n] ?? `Pagina ${n}`}
        draggable={false}
        decoding="async"
        loading="eager"
        fetchPriority={n <= 3 ? "high" : "low"}
      />
      <div className="gutter" />
      <button
        type="button"
        className="pagezoom"
        aria-label={`Mărește pagina ${n}`}
        onClick={(e) => {
          e.stopPropagation();
          onZoom(n);
        }}
      >
        <IconMagnify width={16} height={16} />
        <span>{String(n).padStart(2, "0")}</span>
      </button>
    </div>
  );
}

export default function PageContent({ page, onZoom }: { page: BookPage; onZoom: (n: number) => void }) {
  switch (page.kind) {
    case "cover":
      return <Cover />;
    case "back":
      return <BackCover />;
    case "endpaper":
      return <Endpaper />;
    case "pdf":
      return <PdfPage n={page.n} onZoom={onZoom} />;
  }
}

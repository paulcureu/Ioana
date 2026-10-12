"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { PageFlip } from "page-flip";
import {
  BOOK,
  LAST_INDEX,
  PAGE_RATIO,
  PDF_FILE,
  PDF_PAGE_COUNT,
  STUDENT,
  chapterForPdf,
  indexToPdf,
  pdfToIndex,
} from "@/lib/book";
import { playFlip } from "@/lib/sound";
import PageContent from "./PageContent";
import DeskProps from "./DeskProps";
import Lightbox from "./Lightbox";
import { ContactSheet, TocCard } from "./Panels";
import {
  IconDownload,
  IconExpand,
  IconGrid,
  IconMute,
  IconNext,
  IconPrev,
  IconShrink,
  IconSound,
  IconToc,
  IconZoom,
} from "./Icons";

/* ------------------------------------------------------------------ layout */

type Layout = { pw: number; ph: number; b: number; gap: number; portrait: boolean; compact: boolean; short: boolean };
type Pose = "front" | "open" | "back";

const OVERHANG = 0.022; // cât depășesc cartoanele copertei blocul de pagini

function computeLayout(vw: number, vh: number): Layout {
  const short = vh < 520;
  const compact = vw < 760 || short;
  const headerH = short ? 48 : compact ? 64 : 92;
  const controlsH = short ? 70 : compact ? 96 : 116;
  const padX = compact ? 16 : 64;
  const availW = Math.max(220, vw - padX * 2);
  const availH = Math.max(150, vh - headerH - controlsH);
  const k = 1 / PAGE_RATIO + 2 * OVERHANG;
  const spreadPw = Math.min(availW / (2 + 2 * OVERHANG), availH / k);
  const singlePw = Math.min(availW / (1 + 2 * OVERHANG), availH / k);
  const portrait = !(spreadPw >= 400 || spreadPw >= 0.72 * singlePw);
  const pw = Math.floor(portrait ? singlePw : spreadPw);
  const ph = Math.round(pw / PAGE_RATIO);
  const b = Math.max(4, Math.round(pw * OVERHANG));
  const gap = Math.max(0, Math.floor((availH - ph) / 2)); // spațiul liber deasupra/dedesubtul cărții
  return { pw, ph, b, gap, portrait, compact, short };
}

const poseFor = (idx: number, portrait: boolean): Pose =>
  portrait ? "open" : idx <= 0 ? "front" : idx >= LAST_INDEX ? "back" : "open";

function visibleIndices(idx: number, portrait: boolean): number[] {
  if (portrait || idx <= 0 || idx >= LAST_INDEX) return [idx];
  const left = idx % 2 === 1 ? idx : idx - 1;
  return [left, left + 1];
}

function readHash(): number {
  if (typeof window === "undefined") return 0;
  const m = window.location.hash.match(/pagina-(\d+)/);
  if (!m) return 0;
  const n = Math.min(PDF_PAGE_COUNT, Math.max(1, parseInt(m[1], 10)));
  return pdfToIndex(n);
}

const two = (n: number) => String(n).padStart(2, "0");

/* --------------------------------------------------------------- component */

export default function Flipbook() {
  const hostRef = useRef<HTMLDivElement>(null);
  const pfRef = useRef<PageFlip | null>(null);
  const dirRef = useRef(0);
  const idxRef = useRef(0);
  const soundRef = useRef(true);

  const [layout, setLayout] = useState<Layout | null>(null);
  const layoutRef = useRef<Layout | null>(null);
  const [pageEls, setPageEls] = useState<HTMLElement[] | null>(null);
  const [ready, setReady] = useState(false);
  const [idx, setIdx] = useState(0);
  const [pose, setPose] = useState<Pose>("front");
  const [panel, setPanel] = useState<null | "toc" | "thumbs">(null);
  const [zoomPage, setZoomPage] = useState<number | null>(null);
  const [sound, setSound] = useState(true);
  const [fs, setFs] = useState(false);
  const [fsAvailable, setFsAvailable] = useState(false);

  /* ---- layout from viewport ---- */
  useLayoutEffect(() => {
    const measure = () => {
      const l = computeLayout(window.innerWidth, window.innerHeight);
      layoutRef.current = l;
      setLayout((prev) =>
        prev && prev.pw === l.pw && prev.portrait === l.portrait && prev.compact === l.compact && prev.short === l.short
          ? { ...prev, gap: l.gap }
          : l
      );
    };
    measure();
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  /* ---- preferences ---- */
  useEffect(() => {
    try {
      const v = window.localStorage.getItem("carte:sunet");
      if (v === "0") {
        soundRef.current = false;
        setSound(false);
      }
    } catch {
      /* storage unavailable */
    }
    setFsAvailable(!!document.fullscreenEnabled);
    const onFs = () => setFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  /* ---- page elements (owned by page-flip; React renders into them via portals) ---- */
  useEffect(() => {
    const els = BOOK.map((p, i) => {
      const d = document.createElement("div");
      d.className = `page page--${p.kind} ${i % 2 === 1 ? "page--left" : "page--right"}`;
      if (p.kind === "cover" || p.kind === "back") d.dataset.density = "hard";
      return d;
    });
    setPageEls(els);
  }, []);

  const syncFromBook = useCallback((pf: PageFlip) => {
    const i = pf.getCurrentPageIndex();
    idxRef.current = i;
    setIdx(i);
    setPose(poseFor(i, layoutRef.current?.portrait ?? false));
    dirRef.current = 0;
  }, []);

  /* ---- init page-flip once we have elements + a size ---- */
  const hasLayout = layout !== null;
  useEffect(() => {
    const host = hostRef.current;
    if (!pageEls || !hasLayout || !host) return;
    let disposed = false;
    let pf: PageFlip | null = null;
    const block = document.createElement("div");
    block.className = "flip-block";
    host.appendChild(block);

    import("page-flip").then(({ PageFlip }) => {
      if (disposed) return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const start = readHash();
      pf = new PageFlip(block, {
        width: 3510,
        height: 2482,
        size: "stretch",
        minWidth: 1,
        maxWidth: 6000,
        minHeight: 1,
        maxHeight: 6000,
        autoSize: true,
        showCover: true,
        usePortrait: true,
        drawShadow: true,
        maxShadowOpacity: 0.42,
        flippingTime: reduce ? 350 : 900,
        mobileScrollSupport: false,
        clickEventForward: true,
        showPageCorners: true,
        swipeDistance: 24,
        startPage: start,
      });
      pf.loadFromHTML(pageEls);
      block.style.minWidth = "0px";
      block.style.minHeight = "0px";
      block.style.maxWidth = "none";
      if (layoutRef.current?.portrait) {
        pf.getSettings().minWidth = 1e6;
        pf.update();
        if (start) pf.turnToPage(start); // în modul o-pagină, revino exact la pagina cerută
      }

      pf.on("flip", () => syncFromBook(pf!));
      pf.on("changeState", (e) => {
        const st = e.data;
        if (st === "flipping") {
          const cur = idxRef.current;
          const dir = dirRef.current;
          const portrait = layoutRef.current?.portrait ?? false;
          if (!portrait && dir !== 0) {
            if ((cur === 0 && dir > 0) || (cur >= LAST_INDEX && dir < 0)) setPose("open");
            else if (cur > 0 && cur <= 2 && dir < 0) setPose("front");
            else if (cur < LAST_INDEX && cur >= LAST_INDEX - 2 && dir > 0) setPose("back");
          }
          if (soundRef.current) {
            const hard =
              cur === 0 || cur === LAST_INDEX || (dir < 0 && cur <= 2 && !portrait) || (dir > 0 && cur >= LAST_INDEX - 2 && !portrait);
            playFlip(hard);
          }
        } else if (st === "read") {
          syncFromBook(pf!);
        }
      });
      pf.on("changeOrientation", () => syncFromBook(pf!));
      pfRef.current = pf;
      syncFromBook(pf);
      requestAnimationFrame(() => setReady(true));
    });

    return () => {
      disposed = true;
      pfRef.current = null;
      if (pf) pf.destroy();
      else block.remove();
    };
  }, [pageEls, hasLayout, syncFromBook]);

  /* ---- keep page-flip in sync with our computed size ---- */
  useLayoutEffect(() => {
    const pf = pfRef.current;
    if (!pf || !layout) return;
    pf.getSettings().minWidth = layout.portrait ? 1e6 : 1;
    pf.update();
    setPose(poseFor(pf.getCurrentPageIndex(), layout.portrait));
  }, [layout]);

  /* ---- url hash ---- */
  useEffect(() => {
    if (!ready) return;
    const vis = visibleIndices(idx, layout?.portrait ?? false).map(indexToPdf).filter((n): n is number => n != null);
    const url = vis.length ? `#pagina-${vis[0]}` : window.location.pathname + window.location.search;
    window.history.replaceState(null, "", url);
  }, [idx, ready, layout?.portrait]);

  /* ---- navigation ---- */
  const canFlip = () => {
    const pf = pfRef.current;
    return pf && pf.getState() === "read" ? pf : null;
  };
  const next = useCallback(() => {
    const pf = canFlip();
    if (!pf || idxRef.current >= LAST_INDEX) return;
    dirRef.current = 1;
    pf.flipNext();
  }, []);
  const prev = useCallback(() => {
    const pf = canFlip();
    if (!pf || idxRef.current <= 0) return;
    dirRef.current = -1;
    pf.flipPrev();
  }, []);
  const goToIndex = useCallback((target: number, animate = true) => {
    const pf = pfRef.current;
    if (!pf) return;
    const portrait = layoutRef.current?.portrait ?? false;
    const cur = idxRef.current;
    if (visibleIndices(cur, portrait).includes(target)) return;
    dirRef.current = target > cur ? 1 : -1;
    if (animate && pf.getState() === "read") pf.flip(target);
    else pf.turnToPage(target);
  }, []);
  const goToPdf = useCallback((n: number) => goToIndex(pdfToIndex(n)), [goToIndex]);

  /* ---- link-uri de tip #pagina-7 deschise în aceeași filă ---- */
  useEffect(() => {
    const onHash = () => {
      const target = readHash();
      if (target) goToIndex(target);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [goToIndex]);

  /* ---- keyboard ---- */
  useEffect(() => {
    if (panel || zoomPage != null) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        prev();
      } else if (e.key === "Home") {
        e.preventDefault();
        goToIndex(0);
      } else if (e.key === "End") {
        e.preventDefault();
        goToIndex(LAST_INDEX);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panel, zoomPage, next, prev, goToIndex]);

  /* ---- derived ---- */
  const portrait = layout?.portrait ?? false;
  const visible = useMemo(() => visibleIndices(idx, portrait), [idx, portrait]);
  const visiblePdf = visible.map(indexToPdf).filter((n): n is number => n != null);
  const chapter = chapterForPdf(visiblePdf[visiblePdf.length - 1] ?? null) ?? chapterForPdf(visiblePdf[0] ?? null);

  const where =
    idx <= 0
      ? "Copertă"
      : idx >= LAST_INDEX
        ? "Copertă spate"
        : visiblePdf.length
          ? `${visiblePdf.map(two).join("–")} / ${PDF_PAGE_COUNT}`
          : "Forzaț";

  const headerLabel =
    idx <= 0 || idx >= LAST_INDEX
      ? `${STUDENT.season}`
      : chapter
        ? `${chapter.no} · ${chapter.title}`
        : visiblePdf.includes(2)
          ? "Cuprins"
          : "Pagina de titlu";

  const progress = idx <= 0 ? 0 : idx >= LAST_INDEX ? 1 : Math.max(...visiblePdf, 0) / PDF_PAGE_COUNT;

  const toggleSound = () => {
    const v = !soundRef.current;
    soundRef.current = v;
    setSound(v);
    try {
      window.localStorage.setItem("carte:sunet", v ? "1" : "0");
    } catch {
      /* ignore */
    }
  };
  const toggleFs = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.();
  };
  const openZoom = useCallback((n?: number) => setZoomPage(n ?? 1), []);
  // la închiderea lupei, cartea rămâne deschisă la pagina văzută ultima dată
  const closeZoom = () => {
    if (zoomPage != null) {
      const pdfIdx = pdfToIndex(zoomPage);
      if (!visibleIndices(idxRef.current, layoutRef.current?.portrait ?? false).includes(pdfIdx)) {
        dirRef.current = 0;
        pfRef.current?.turnToPage(pdfIdx);
      }
    }
    setZoomPage(null);
  };

  /* ---- geometry for boards, page edges and the closed-book shift ---- */
  const pw = layout?.pw ?? 0;
  const ph = layout?.ph ?? 0;
  const b = layout?.b ?? 0;
  const bookW = portrait ? pw : pw * 2;
  const shiftX = pose === "front" ? -pw / 2 : pose === "back" ? pw / 2 : 0;

  let frame: { l: number; t: number; w: number; h: number };
  if (portrait) {
    frame = idx <= 0 || idx >= LAST_INDEX ? { l: 0, t: 0, w: pw, h: ph } : { l: 0, t: -b, w: pw + b, h: ph + 2 * b };
  } else if (pose === "front") frame = { l: pw, t: 0, w: pw, h: ph };
  else if (pose === "back") frame = { l: 0, t: 0, w: pw, h: ph };
  else frame = { l: -b, t: -b, w: pw * 2 + 2 * b, h: ph + 2 * b };

  const leftIdx = visible[0];
  const turned = Math.min(1, Math.max(0, (leftIdx - 1) / (LAST_INDEX - 2)));
  const maxEdge = Math.max(2, b * 0.8);
  const edgeL = Math.round(1.5 + turned * maxEdge);
  const edgeR = Math.round(1.5 + (1 - turned) * maxEdge);
  const showEdges = !portrait && pose === "open";

  const fullyClosed = idx <= 0;

  const vars = {
    "--pw": `${pw}px`,
    "--ph": `${ph}px`,
    "--b": `${b}px`,
    "--gap": `${layout?.gap ?? 0}px`,
  } as React.CSSProperties;

  return (
    <main className={`desk${layout?.compact ? " is-compact" : ""}${layout?.short ? " is-short" : ""}`} style={vars}>
      <div className="desk__light" aria-hidden="true" />

      <header className="topbar">
        <div className="topbar__id">
          <p className="topbar__name">{STUDENT.name}</p>
          <p className="topbar__meta mono">
            {STUDENT.title} · {STUDENT.year} · FAU {STUDENT.city}
          </p>
        </div>
        <p className="topbar__chapter mono" aria-live="polite">
          {headerLabel}
        </p>
      </header>

      <section className="stage" aria-label="Portofoliu — carte">
        {layout && (
          <div
            className={`stage__box${portrait ? " is-portrait" : ""}`}
            style={{ width: bookW, height: ph }}
          >
            {!layout.short && <DeskProps />}

            <div
              className={`book pose-${pose}${ready ? " is-ready" : ""}`}
              style={{ transform: `translate3d(${shiftX}px,0,0)` }}
            >
              <div
                className={`book__boards${pose === "open" ? " is-open" : ""}`}
                style={{ left: frame.l, top: frame.t, width: frame.w, height: frame.h }}
              />
              {showEdges && (
                <>
                  <div className="book__edge book__edge--left" style={{ width: edgeL }} />
                  <div className="book__edge book__edge--right" style={{ width: edgeR }} />
                </>
              )}
              <div
                ref={hostRef}
                className={`book__host${portrait ? " is-portrait" : ""}`}
                style={{ width: bookW }}
                onPointerDownCapture={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  dirRef.current = e.clientX - r.left < r.width / 2 ? -1 : 1;
                }}
              />
            </div>

            <p
              className={`hint mono${fullyClosed && ready && layout.gap > 44 ? " is-visible" : ""}`}
              aria-hidden={!fullyClosed}
            >
              Apasă pe copertă<span className="hide-sm"> sau trage de colț</span> ca să deschizi cartea
            </p>
          </div>
        )}
      </section>

      <nav className="tray" aria-label="Navigare în carte">
        <div className="tray__progress" aria-hidden="true">
          <span style={{ transform: `scaleX(${progress})` }} />
          {Array.from({ length: PDF_PAGE_COUNT + 1 }, (_, i) => (
            <i key={i} style={{ left: `${(i / PDF_PAGE_COUNT) * 100}%` }} />
          ))}
        </div>
        <div className="tray__row">
          <div className="tray__group">
            <button type="button" className="iconbtn" onClick={prev} disabled={idx <= 0} aria-label="Pagina anterioară" title="Înapoi (←)">
              <IconPrev />
            </button>
            <p className="tray__where mono" aria-live="polite">
              {where}
            </p>
            <button type="button" className="iconbtn" onClick={next} disabled={idx >= LAST_INDEX} aria-label="Pagina următoare" title="Înainte (→)">
              <IconNext />
            </button>
          </div>
          <span className="tray__sep" aria-hidden="true" />
          <div className="tray__group">
            <button type="button" className="iconbtn iconbtn--label" onClick={() => setPanel("toc")} aria-label="Cuprins" title="Cuprins">
              <IconToc />
              <span>Cuprins</span>
            </button>
            <button type="button" className="iconbtn" onClick={() => setPanel("thumbs")} aria-label="Toate paginile" title="Toate paginile">
              <IconGrid />
            </button>
            <button
              type="button"
              className="iconbtn"
              onClick={() => openZoom(visiblePdf[0] ?? 1)}
              aria-label="Mărește pagina"
              title="Mărește pagina"
            >
              <IconZoom />
            </button>
            <button
              type="button"
              className="iconbtn"
              onClick={toggleSound}
              aria-pressed={sound}
              aria-label={sound ? "Oprește sunetul" : "Pornește sunetul"}
              title={sound ? "Sunet pornit" : "Sunet oprit"}
            >
              {sound ? <IconSound /> : <IconMute />}
            </button>
            {fsAvailable && (
              <button
                type="button"
                className="iconbtn hide-sm"
                onClick={toggleFs}
                aria-label={fs ? "Ieși din ecran complet" : "Ecran complet"}
                title={fs ? "Ieși din ecran complet" : "Ecran complet"}
              >
                {fs ? <IconShrink /> : <IconExpand />}
              </button>
            )}
            <a className="iconbtn" href={PDF_FILE} download aria-label="Descarcă PDF-ul" title="Descarcă PDF-ul">
              <IconDownload />
            </a>
          </div>
        </div>
      </nav>

      {pageEls &&
        pageEls.map((el, i) => createPortal(<PageContent page={BOOK[i]} onZoom={openZoom} />, el, `p${i}`))}

      {panel === "toc" && (
        <TocCard
          current={visiblePdf}
          onClose={() => setPanel(null)}
          onGo={(n) => {
            setPanel(null);
            goToPdf(n);
          }}
        />
      )}
      {panel === "thumbs" && (
        <ContactSheet
          current={visiblePdf}
          onClose={() => setPanel(null)}
          onGo={(n) => {
            setPanel(null);
            goToPdf(n);
          }}
        />
      )}
      {zoomPage != null && <Lightbox page={zoomPage} onChange={setZoomPage} onClose={closeZoom} />}
    </main>
  );
}

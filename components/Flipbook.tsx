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

type Layout = { pw: number; ph: number; b: number; compact: boolean; short: boolean };
type Pose = "front" | "open" | "back";
type Corner = "top" | "bottom";

const OVERHANG = 0.022; // cât depășesc cartoanele copertei blocul de pagini

/** Cartea e mereu deschisă pe două pagini (și pe telefon), cât de mare încape. */
function computeLayout(vw: number, vh: number): Layout {
  const short = vh < 520;
  const compact = vw < 760 || short;
  const headerH = short ? 48 : compact ? 64 : 92;
  const controlsH = short ? 70 : compact ? 96 : 116;
  const padX = vw < 520 ? 8 : compact ? 16 : 64;
  const availW = Math.max(200, vw - padX * 2);
  const availH = Math.max(120, vh - headerH - controlsH);
  const k = 1 / PAGE_RATIO + 2 * OVERHANG;
  const pw = Math.floor(Math.min(availW / (2 + 2 * OVERHANG), availH / k));
  const ph = Math.round(pw / PAGE_RATIO);
  const b = Math.max(3, Math.round(pw * OVERHANG));
  return { pw, ph, b, compact, short };
}

const poseFor = (idx: number): Pose => (idx <= 0 ? "front" : idx >= LAST_INDEX ? "back" : "open");

function visibleIndices(idx: number): number[] {
  if (idx <= 0 || idx >= LAST_INDEX) return [idx];
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
  const stageRef = useRef<HTMLElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const boardsRef = useRef<HTMLDivElement>(null);
  const pfRef = useRef<PageFlip | null>(null);
  const dirRef = useRef(0);
  const idxRef = useRef(0);
  const soundRef = useRef(true);

  const [layout, setLayout] = useState<Layout | null>(null);
  const [touchUI, setTouchUI] = useState<boolean | null>(null);
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
      setLayout((prev) =>
        prev && prev.pw === l.pw && prev.compact === l.compact && prev.short === l.short ? prev : l
      );
    };
    measure();
    setTouchUI(window.matchMedia("(hover: none) and (pointer: coarse)").matches);
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
      if (window.localStorage.getItem("carte:sunet") === "0") {
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
    setPose(poseFor(i));
  }, []);

  /* ---- init page-flip once we have elements + a size ---- */
  const canInit = layout !== null && touchUI !== null;
  useEffect(() => {
    const host = hostRef.current;
    if (!pageEls || !canInit || !host) return;
    let disposed = false;
    let pf: PageFlip | null = null;
    const block = document.createElement("div");
    block.className = "flip-block";
    host.appendChild(block);

    import("page-flip").then(({ PageFlip }) => {
      if (disposed) return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
        usePortrait: false, // mereu două pagini, și pe telefon
        drawShadow: true,
        maxShadowOpacity: 0.4,
        flippingTime: reduce ? 300 : touchUI ? 560 : 800,
        mobileScrollSupport: false,
        clickEventForward: true,
        // pe ecrane tactile gesturile le tratăm noi (fără întârzierea de 250 ms a bibliotecii)
        useMouseEvents: !touchUI,
        showPageCorners: !touchUI,
        swipeDistance: 20,
        startPage: readHash(),
      });
      pf.loadFromHTML(pageEls);
      block.style.minWidth = "0px";
      block.style.minHeight = "0px";
      block.style.maxWidth = "none";

      pf.on("flip", () => syncFromBook(pf!));
      pf.on("changeState", (e) => {
        if (e.data === "flipping") {
          const cur = idxRef.current;
          const dir = dirRef.current;
          if (dir !== 0) {
            if ((cur === 0 && dir > 0) || (cur >= LAST_INDEX && dir < 0)) setPose("open");
            else if (cur > 0 && cur <= 2 && dir < 0) setPose("front");
            else if (cur < LAST_INDEX && cur >= LAST_INDEX - 2 && dir > 0) setPose("back");
          }
          if (soundRef.current) {
            const hard = cur === 0 || cur === LAST_INDEX || (dir < 0 && cur <= 2) || (dir > 0 && cur >= LAST_INDEX - 2);
            playFlip(hard);
          }
        } else if (e.data === "read") {
          syncFromBook(pf!);
        }
      });
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
  }, [pageEls, canInit, touchUI, syncFromBook]);

  /* ---- keep page-flip in sync with our computed size ---- */
  useLayoutEffect(() => {
    const pf = pfRef.current;
    if (!pf || !layout) return;
    pf.update();
  }, [layout]);

  /* ---- url hash ---- */
  useEffect(() => {
    if (!ready) return;
    const vis = visibleIndices(idx).map(indexToPdf).filter((n): n is number => n != null);
    const url = vis.length ? `#pagina-${vis[0]}` : window.location.pathname + window.location.search;
    window.history.replaceState(null, "", url);
  }, [idx, ready]);

  /* ---- navigation ----
     Un nou click / swipe în timpul unei animații o termină instant și o pornește pe următoarea,
     așa că poți răsfoi repede, fără să aștepți. */
  const next = useCallback((corner: Corner = "top") => {
    const pf = pfRef.current;
    if (!pf || pf.getState() === "user_fold") return;
    if (pf.getState() === "read" && idxRef.current >= LAST_INDEX) return;
    dirRef.current = 1;
    pf.flipNext(corner);
  }, []);
  const prev = useCallback((corner: Corner = "top") => {
    const pf = pfRef.current;
    if (!pf || pf.getState() === "user_fold") return;
    if (pf.getState() === "read" && idxRef.current <= 0) return;
    dirRef.current = -1;
    pf.flipPrev(corner);
  }, []);
  const goToIndex = useCallback((target: number, animate = true) => {
    const pf = pfRef.current;
    if (!pf) return;
    const cur = idxRef.current;
    if (visibleIndices(cur).includes(target)) return;
    dirRef.current = target > cur ? 1 : -1;
    if (animate && pf.getState() !== "user_fold") pf.flip(target);
    else pf.turnToPage(target);
  }, []);
  const goToPdf = useCallback((n: number) => goToIndex(pdfToIndex(n)), [goToIndex]);

  /* ---- gesturi tactile: tap pe pagină, swipe oriunde pe ecran ---- */
  useEffect(() => {
    const stage = stageRef.current;
    if (!touchUI || !stage) return;
    let s: { x: number; y: number; t: number; fired: boolean } | null = null;

    const cornerAt = (y: number): Corner => {
      const r = hostRef.current?.getBoundingClientRect();
      return r && y > r.top + r.height / 2 ? "bottom" : "top";
    };
    const onStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (e.touches.length !== 1 || target?.closest("button, a")) {
        s = null;
        return;
      }
      const t = e.touches[0];
      s = { x: t.clientX, y: t.clientY, t: performance.now(), fired: false };
    };
    const onMove = (e: TouchEvent) => {
      if (!s) return;
      const t = e.touches[0];
      const dx = t.clientX - s.x;
      const dy = t.clientY - s.y;
      if (Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy) && e.cancelable) e.preventDefault();
      // pagina se întoarce imediat ce degetul a trecut pragul — nu la ridicarea lui
      if (!s.fired && Math.abs(dx) > 24 && Math.abs(dx) > Math.abs(dy) * 1.1) {
        s.fired = true;
        if (dx < 0) next(cornerAt(s.y));
        else prev(cornerAt(s.y));
      }
    };
    const onEnd = (e: TouchEvent) => {
      if (!s) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - s.x;
      const dy = t.clientY - s.y;
      const quick = performance.now() - s.t < 600;
      if (!s.fired && quick && Math.abs(dx) < 12 && Math.abs(dy) < 12) {
        const book = boardsRef.current?.getBoundingClientRect();
        const host = hostRef.current?.getBoundingClientRect();
        const pad = 12;
        if (
          book &&
          host &&
          t.clientX >= book.left - pad &&
          t.clientX <= book.right + pad &&
          t.clientY >= book.top - pad &&
          t.clientY <= book.bottom + pad
        ) {
          const spine = host.left + host.width / 2;
          if (t.clientX < spine) prev(cornerAt(t.clientY));
          else next(cornerAt(t.clientY));
        }
      }
      s = null;
    };
    const onCancel = () => {
      s = null;
    };
    stage.addEventListener("touchstart", onStart, { passive: true });
    stage.addEventListener("touchmove", onMove, { passive: false });
    stage.addEventListener("touchend", onEnd);
    stage.addEventListener("touchcancel", onCancel);
    return () => {
      stage.removeEventListener("touchstart", onStart);
      stage.removeEventListener("touchmove", onMove);
      stage.removeEventListener("touchend", onEnd);
      stage.removeEventListener("touchcancel", onCancel);
    };
  }, [touchUI, next, prev]);

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
  const visible = useMemo(() => visibleIndices(idx), [idx]);
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
      if (!visibleIndices(idxRef.current).includes(pdfIdx)) pfRef.current?.turnToPage(pdfIdx);
    }
    setZoomPage(null);
  };

  /* ---- geometry for boards, page edges and the closed-book shift ---- */
  const pw = layout?.pw ?? 0;
  const ph = layout?.ph ?? 0;
  const b = layout?.b ?? 0;
  const bookW = pw * 2;
  const shiftX = pose === "front" ? -pw / 2 : pose === "back" ? pw / 2 : 0;

  let frame: { l: number; t: number; w: number; h: number };
  if (pose === "front") frame = { l: pw, t: 0, w: pw, h: ph };
  else if (pose === "back") frame = { l: 0, t: 0, w: pw, h: ph };
  else frame = { l: -b, t: -b, w: pw * 2 + 2 * b, h: ph + 2 * b };

  const leftIdx = visible[0];
  const turned = Math.min(1, Math.max(0, (leftIdx - 1) / (LAST_INDEX - 2)));
  const maxEdge = Math.max(2, b * 0.8);
  const edgeL = Math.round(1.5 + turned * maxEdge);
  const edgeR = Math.round(1.5 + (1 - turned) * maxEdge);

  const vars = {
    "--pw": `${pw}px`,
    "--ph": `${ph}px`,
    "--b": `${b}px`,
  } as React.CSSProperties;

  return (
    <main
      className={`desk${layout?.compact ? " is-compact" : ""}${layout?.short ? " is-short" : ""}${touchUI ? " is-touch" : ""}`}
      style={vars}
    >
      <div className="desk__shade" aria-hidden="true" />

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

      <section ref={stageRef} className="stage" aria-label="Portofoliu — carte">
        {layout && (
          <div className="stage__box" style={{ width: bookW, height: ph }}>
            <div
              className={`book pose-${pose}${ready ? " is-ready" : ""}`}
              style={{ transform: `translate3d(${shiftX}px,0,0)` }}
            >
              <div
                ref={boardsRef}
                className={`book__boards${pose === "open" ? " is-open" : ""}`}
                style={{ left: frame.l, top: frame.t, width: frame.w, height: frame.h }}
              />
              {pose === "open" && (
                <>
                  <div className="book__edge book__edge--left" style={{ width: edgeL }} />
                  <div className="book__edge book__edge--right" style={{ width: edgeR }} />
                </>
              )}
              <div
                ref={hostRef}
                className="book__host"
                style={{ width: bookW }}
                onPointerDownCapture={(e) => {
                  if (e.pointerType !== "mouse") return;
                  const r = e.currentTarget.getBoundingClientRect();
                  dirRef.current = e.clientX - r.left < r.width / 2 ? -1 : 1;
                }}
              />
            </div>
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
            <button
              type="button"
              className="iconbtn"
              onClick={() => prev()}
              disabled={idx <= 0}
              aria-label="Pagina anterioară"
              title="Înapoi (←)"
            >
              <IconPrev />
            </button>
            <p className="tray__where mono" aria-live="polite">
              {where}
            </p>
            <button
              type="button"
              className="iconbtn"
              onClick={() => next()}
              disabled={idx >= LAST_INDEX}
              aria-label="Pagina următoare"
              title="Înainte (→)"
            >
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

/**
 * Conținutul cărții.
 *
 * Paginile din PDF sunt pre-randate ca imagini WebP în /public:
 *   /pages/page-XX.webp     – 1600 px, folosite în carte
 *   /pages-hd/page-XX.webp  – 2800 px, folosite la mărire (lupă)
 *   /thumbs/page-XX.webp    – 360 px, miniaturi
 *
 * Structura cărții (indici pentru page-flip):
 *   0        copertă față (tare, pânză)
 *   1        forzaț (hârtie milimetrică, „Ex libris”)
 *   2 … 16   paginile 1 … 15 din PDF
 *   17       copertă spate (tare)
 */

export const PDF_PAGE_COUNT = 15;
export const PAGE_RATIO = 3510 / 2482; // A4 landscape (√2)

export const STUDENT = {
  name: "Bude Ioana Nicola",
  title: "Portofoliu studențesc",
  year: "An 2",
  group: "Grupa 1121",
  school: "Facultatea de Arhitectură și Urbanism",
  city: "Cluj-Napoca",
  season: "2025 — 2026",
};

export const PDF_FILE = "/portofoliu-bude-ioana-nicola.pdf";

export type BookPage =
  | { kind: "cover" }
  | { kind: "endpaper" }
  | { kind: "pdf"; n: number }
  | { kind: "back" };

export const BOOK: BookPage[] = [
  { kind: "cover" },
  { kind: "endpaper" },
  ...Array.from({ length: PDF_PAGE_COUNT }, (_, i) => ({ kind: "pdf" as const, n: i + 1 })),
  { kind: "back" },
];

export const LAST_INDEX = BOOK.length - 1;

/** PDF page number (1-based) -> book index */
export const pdfToIndex = (n: number) => n + 1;
/** book index -> PDF page number or null */
export const indexToPdf = (i: number) => (i >= 2 && i <= PDF_PAGE_COUNT + 1 ? i - 1 : null);

const pad = (n: number) => String(n).padStart(2, "0");
export const pageSrc = (n: number) => `/pages/page-${pad(n)}.webp`;
export const pageSrcHd = (n: number) => `/pages-hd/page-${pad(n)}.webp`;
export const thumbSrc = (n: number) => `/thumbs/page-${pad(n)}.webp`;

export type Chapter = {
  no: string;
  title: string;
  subtitle?: string;
  from: number; // PDF page
  to: number;
  color: string; // culorile numerelor din cuprinsul original
};

export const CHAPTERS: Chapter[] = [
  {
    no: "01",
    title: "Proiectare de arhitectură 3",
    subtitle: "Inserție în așezare rurală — Moigrad Porolissum",
    from: 3,
    to: 6,
    color: "#6f4a2c",
  },
  {
    no: "02",
    title: "Proiectare de arhitectură 4",
    subtitle: "Concursul CASA",
    from: 7,
    to: 11,
    color: "#8f7a60",
  },
  { no: "03", title: "Ambient", subtitle: "Colecții", from: 12, to: 13, color: "#7d6a5f" },
  {
    no: "04",
    title: "Lucrări opționale",
    subtitle: "Bazele Proiectării de Urbanism",
    from: 14,
    to: 14,
    color: "#9a8b80",
  },
  { no: "05", title: "Elemente de construcții", from: 15, to: 15, color: "#7a6b5f" },
];

export const chapterForPdf = (n: number | null) =>
  n == null ? null : CHAPTERS.find((c) => n >= c.from && n <= c.to) ?? null;

/** Short descriptions used as alt text (screen readers / SEO). */
export const PAGE_ALT: Record<number, string> = {
  1: "Pagina de titlu: Portofoliu studențesc, Bude Ioana Nicola, An 2, Grupa 1121, FAU Cluj-Napoca — schițe și ramuri de copac.",
  2: "Cuprins: 01 Proiectare de arhitectură 3, 02 Proiectare de arhitectură 4, 03 Ambient – Colecții, 04 Lucrări opționale, 05 Elemente de construcții.",
  3: "01 Proiectare de arhitectură 3 — Inserție în așezare rurală Moigrad Porolissum: text despre relieful satului și plan de situație.",
  4: "Planurile locuinței de la Moigrad: parter cu anexă și etaj, însoțite de descrierea conceptului.",
  5: "Fațade și secțiuni ale casei de la Moigrad, adaptate terenului în pantă.",
  6: "Schițe de lucru pe fond negru și fotografii ale machetelor: secțiune interioară și machetă de sit cu curbe de nivel.",
  7: "02 Proiectare de arhitectură 4 — Concursul CASA: conceptul „natura ca primă formă de muzică” și planul de situație.",
  8: "Fotografie a machetei ansamblului și axonometrie explodată cu spațiile publice, comune, de muzică și de cazare.",
  9: "Secțiuni și planuri ale ansamblului pentru studenți la muzică.",
  10: "Randare exterioară a clădirii noi de pe strada Kossuth, lângă o clădire istorică.",
  11: "Trei randări interioare — galerie, curte interioară, sală de repetiție — și desfășurarea frontului stradal.",
  12: "03 Ambient — Colecții: colaj cu personaje care citesc.",
  13: "Randare de interior: cameră de zi cu bibliotecă din lemn, canapea și o fetiță la fereastră.",
  14: "04 Lucrări opționale — Bazele Proiectării de Urbanism: planuri și profiluri transversale actual și propus.",
  15: "05 Elemente de construcții: fotografii ale machetei de șarpantă și detalii desenate de mână ale acoperișului.",
};

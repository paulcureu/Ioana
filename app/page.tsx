import Flipbook from "@/components/Flipbook";
import { CHAPTERS, PAGE_ALT, PDF_FILE, PDF_PAGE_COUNT, STUDENT, pageSrc } from "@/lib/book";

export default function Home() {
  return (
    <>
      {/* conținut text pentru cititoare de ecran și motoare de căutare */}
      <div className="sr-only">
        <h1>
          {STUDENT.title} — {STUDENT.name}
        </h1>
        <p>
          {STUDENT.year}, {STUDENT.group}, {STUDENT.school}, {STUDENT.city}, {STUDENT.season}.
        </p>
        <h2>Cuprins</h2>
        <ol>
          {CHAPTERS.map((c) => (
            <li key={c.no}>
              {c.no} {c.title}
              {c.subtitle ? ` — ${c.subtitle}` : ""} (paginile {c.from}
              {c.to !== c.from ? `–${c.to}` : ""})
            </li>
          ))}
        </ol>
        <a href={PDF_FILE}>Descarcă portofoliul în format PDF</a>
      </div>

      <Flipbook />

      <noscript>
        <div className="noscript">
          {Array.from({ length: PDF_PAGE_COUNT }, (_, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={pageSrc(i + 1)} alt={PAGE_ALT[i + 1]} width={1600} height={1131} />
          ))}
        </div>
      </noscript>
    </>
  );
}

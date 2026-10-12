# Portofoliu studențesc — carte (Next.js)

Portofoliul Ioanei Nicola Bude (An 2, FAU Cluj-Napoca), răsfoit ca o carte cu copertă tare din pânză,
așezată pe biroul unui arhitect.

## Pornire

```bash
npm install
npm run dev        # http://localhost:3000
```

Build de producție:

```bash
npm run build
npm start
```

## Publicare pe Vercel

1. Pune folderul într-un repo GitHub.
2. Pe vercel.com → **Add New → Project** → alege repo-ul → **Deploy** (setările implicite sunt bune).
3. Opțional: adaugă variabila `NEXT_PUBLIC_SITE_URL` (ex. `https://portofoliu.vercel.app`) ca imaginea de
   previzualizare (Open Graph) să aibă adresa corectă când trimiți linkul pe WhatsApp/Facebook.

## Ce face

- Răsfoire realistă cu [page-flip](https://github.com/Nodlik/StPageFlip): click pe pagină, tragere de colț,
  swipe pe telefon, săgeți ← → de pe tastatură (Home / End = copertă / final).
- Coperta se deschide pe balama, iar cartea închisă stă centrată pe birou.
- Cuprins ca fișă de index (sare direct la capitol), foaie de contact cu toate paginile, lupă cu
  mărire 2,6× pentru fiecare pagină, sunet discret de foșnet (se poate opri), ecran complet,
  descărcare PDF.
- Link direct la o pagină: `/#pagina-7`.
- Pe ecrane înguste (telefon vertical, tabletă verticală) cartea trece pe o singură pagină.
- Fonturile sunt găzduite local (pachete `@fontsource`), fără cereri externe.

## Unde modifici

| Ce | Unde |
| --- | --- |
| Nume, an, grupă, facultate | `lib/book.ts` → `STUDENT` |
| Capitolele din cuprins | `lib/book.ts` → `CHAPTERS` |
| Culori, fonturi, aspectul biroului și al copertei | `app/globals.css` (variabilele din `:root`) |
| Coperta, forzațul (hârtie milimetrică) | `components/PageContent.tsx` |
| Creionul, scalimetrul, calcul cu schițe | `components/DeskProps.tsx` |

## Înlocuirea PDF-ului

Paginile sunt imagini WebP pre-randate din PDF (calitate mult mai bună și încărcare mai rapidă decât
randarea PDF-ului în browser):

```
public/pages/page-01.webp …     1600 px (în carte)
public/pages-hd/page-01.webp …  2800 px (lupă)
public/thumbs/page-01.webp …     360 px (miniaturi)
public/portofoliu-bude-ioana-nicola.pdf  (butonul de descărcare)
```

Pentru un PDF nou (cu `poppler` și Python + Pillow instalate):

```bash
pdftoppm -r 300 -png portofoliu.pdf p
python3 - <<'PY'
from PIL import Image
for i in range(1, 16):            # numărul de pagini
    im = Image.open(f"p-{i:02d}.png").convert("RGB")
    for w, d, q in [(1600, "pages", 84), (2800, "pages-hd", 82), (360, "thumbs", 78)]:
        h = round(im.height * w / im.width)
        im.resize((w, h), Image.LANCZOS).save(f"public/{d}/page-{i:02d}.webp", "WEBP", quality=q)
PY
```

Dacă numărul de pagini se schimbă, actualizează `PDF_PAGE_COUNT`, `CHAPTERS` și `PAGE_ALT` în `lib/book.ts`.
Paginile trebuie să fie A4 orizontal (raport √2); pentru alt format schimbă `PAGE_RATIO`.

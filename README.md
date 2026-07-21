# Vivek Murugulla, Portfolio

**[Live Site](https://vivekmurugulla2004.github.io/)** · **[Resume](Vivek_Murugulla_Resume_MSBA.pdf)** · **[LinkedIn](https://www.linkedin.com/in/vivekmurugulla/)**

A single-page portfolio built from scratch with plain HTML, CSS, and JavaScript: no framework, no build step, no template. Covers two shipped products (a native macOS app and a three-year media business), a research assistantship, and an internship, structured as an expandable case-study interface rather than a static résumé page.

## Highlights

- **ComicArc**: a native macOS comic library and reader, designed, built, and shipped solo. Python, Flask, SQLite, PyWebView, PyInstaller, fully local-first with no cloud dependency.
- **Reel Talk Hub**: an independent media platform I've run as a business for three years (editorial, engineering, and analytics), engineered up to a perfect 100/100 Core Web Vitals score using Python, Excel, and Tableau for the analytics layer.
- **HCI Research Assistant, UGA**: synthesized 50+ peer-reviewed studies and helped design a 12-condition between-subjects experiment on AI-driven persuasion.
- **Business Developer Intern, Withme.AI**: behavioral segmentation and engagement analysis projected to improve retention by 15%.

## Why plain HTML/CSS/JS

No framework sits between the code and what ships. That constraint is also the point: it's what let Reel Talk Hub reach a clean 100 on Core Web Vitals rather than being capped by a framework's default bundle size.

## Tech notes

- Every accordion (top-level sections and nested project case studies) shares one animated-grid expand/collapse implementation, no per-instance duplication.
- Scroll-reveal, animated counters, and the GitHub contribution graph all run through `IntersectionObserver`, deferred until their section is actually opened.
- The resume opens in an inline preview modal (embedded PDF viewer) with a separate explicit download action, instead of forcing a download on click.
- Fully responsive from small phones through ultrawide desktop; verified with Chrome DevTools device emulation across 10+ breakpoints.
- Accessible by default: semantic landmarks, `aria-expanded`/`aria-controls` on every interactive control, visible focus states, and full `prefers-reduced-motion` support.

## Project structure

```
index.html    - all page content and structure
styles.css    - design tokens and layout (no preprocessor)
script.js     - accordion/tab logic, scroll effects, resume modal, GitHub graph
robots.txt / sitemap.xml - SEO
```

## Running locally

```
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Contact

Open to Summer 2027 internship and new-grad roles in software engineering, data/business analytics, and product.

- Email: [vivekmurugulla1@gmail.com](mailto:vivekmurugulla1@gmail.com)
- GitHub: [@Vivekmurugulla2004](https://github.com/Vivekmurugulla2004)
- LinkedIn: [vivekmurugulla](https://www.linkedin.com/in/vivekmurugulla/)

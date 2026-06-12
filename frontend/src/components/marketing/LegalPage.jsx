import { useEffect, useMemo, useState } from "react";
import { Container, Eyebrow, Reveal, AmbientBackdrop } from "@/components/marketing/primitives";

/**
 * Render text containing **bold** markers as a React fragment.
 */
function renderRichText(text) {
  if (typeof text !== "string") return text;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) {
      return <strong key={i} className="font-semibold text-white">{p.slice(2, -2)}</strong>;
    }
    return <span key={i}>{p}</span>;
  });
}

function slugify(s) {
  return String(s)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function SectionBody({ section }) {
  return (
    <>
      {section.body && (
        <div className="mt-5 space-y-4">
          {section.body.map((b, i) => (
            <p key={i} className="text-[15px] leading-relaxed text-slate-300">
              {renderRichText(b)}
            </p>
          ))}
        </div>
      )}
      {section.pre && (
        <pre className="mt-5 overflow-x-auto rounded-xl border border-white/10 bg-[#06080A] p-5 font-mono text-[12px] leading-relaxed text-slate-300">
          {section.pre}
        </pre>
      )}
      {section.list && (
        <ul className="mt-5 space-y-2">
          {section.list.map((it, i) => (
            <li key={i} className="flex items-start gap-3 text-[15px] leading-relaxed text-slate-300">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-trusted/70" />
              <span>{renderRichText(it)}</span>
            </li>
          ))}
        </ul>
      )}
      {section.subsections && (
        <div className="mt-6 space-y-7">
          {section.subsections.map((sub, si) => (
            <div key={si}>
              <h3 className="font-heading text-lg font-bold text-white">{renderRichText(sub.heading)}</h3>
              {sub.body && (
                <div className="mt-3 space-y-3">
                  {sub.body.map((b, i) => (
                    <p key={i} className="text-[15px] leading-relaxed text-slate-300">
                      {renderRichText(b)}
                    </p>
                  ))}
                </div>
              )}
              {sub.pre && (
                <pre className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-[#06080A] p-5 font-mono text-[12px] leading-relaxed text-slate-300">
                  {sub.pre}
                </pre>
              )}
              {sub.list && (
                <ul className="mt-3 space-y-2">
                  {sub.list.map((it, i) => (
                    <li key={i} className="flex items-start gap-3 text-[15px] leading-relaxed text-slate-300">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-trusted/70" />
                      <span>{renderRichText(it)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default function LegalPage({
  eyebrow,
  title,
  effectiveDate,
  lastUpdated,
  intro,
  sections,
  contact,
  testId,
}) {
  const sectionsWithIds = useMemo(
    () => sections.map((s) => ({ ...s, id: s.id || slugify(s.heading) })),
    [sections]
  );

  const [activeId, setActiveId] = useState(sectionsWithIds[0]?.id);

  useEffect(() => {
    const ids = sectionsWithIds.map((s) => s.id);
    const onScroll = () => {
      let current = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top - 120 <= 0) current = id;
      }
      setActiveId(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [sectionsWithIds]);

  return (
    <div data-testid={testId}>
      {/* HERO */}
      <section className="relative overflow-hidden pt-32 pb-12 md:pt-40 md:pb-16">
        <AmbientBackdrop />
        <Container className="relative">
          <Reveal><Eyebrow>{eyebrow}</Eyebrow></Reveal>
          <Reveal delay={0.06}>
            <h1 className="mt-6 font-heading text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl">
              {title}
            </h1>
          </Reveal>
          {effectiveDate && (
            <Reveal delay={0.1}>
              <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.22em] text-slate-500">
                Effective Date: {effectiveDate}
              </p>
            </Reveal>
          )}
          {intro && (
            <Reveal delay={0.14}>
              <div className="mt-8 max-w-3xl">
                {intro.map((p, i) => (
                  <p key={i} className="mt-4 text-[15px] leading-relaxed text-slate-300">
                    {renderRichText(p)}
                  </p>
                ))}
              </div>
            </Reveal>
          )}
        </Container>
      </section>

      {/* CONTENT + STICKY TOC */}
      <section className="border-t border-white/8 bg-[#0A0B0D] py-16 md:py-20">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
            {/* Sticky TOC (desktop) */}
            <aside className="hidden lg:block" data-testid="legal-toc">
              <div className="sticky top-24">
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">On this page</div>
                <nav className="mt-4 border-l border-white/10">
                  {sectionsWithIds.map((s) => (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      data-testid={`legal-toc-${s.id}`}
                      className={
                        "-ml-px block border-l-2 py-2 pl-4 text-[13px] leading-snug transition-colors " +
                        (activeId === s.id
                          ? "border-trusted text-white"
                          : "border-transparent text-slate-400 hover:border-trusted/40 hover:text-white")
                      }
                    >
                      {s.label && (
                        <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
                          {s.label}
                        </span>
                      )}
                      <span className="block">{s.heading}</span>
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Main content */}
            <div className="space-y-10">
              {sectionsWithIds.map((sec) => (
                <Reveal key={sec.id}>
                  <article
                    id={sec.id}
                    className="scroll-mt-28 rounded-2xl border border-white/10 bg-surface p-7 md:p-9"
                    data-testid={`legal-section-${sec.id}`}
                  >
                    {sec.label && (
                      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-trusted">
                        {sec.label}
                      </div>
                    )}
                    <h2 className="mt-2 font-heading text-2xl font-extrabold tracking-tight text-white md:text-3xl">
                      {renderRichText(sec.heading)}
                    </h2>
                    <SectionBody section={sec} />
                  </article>
                </Reveal>
              ))}

              {/* Last updated footer */}
              {(lastUpdated || effectiveDate) && (
                <div className="rounded-xl border border-dashed border-white/10 bg-[#0B0D0F] px-5 py-4 text-center font-mono text-[11px] uppercase tracking-[0.22em] text-slate-500">
                  Last updated: {lastUpdated || effectiveDate}
                </div>
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* CONTACT */}
      {contact && (
        <section className="border-t border-white/8 py-16">
          <Container>
            <div className="mx-auto max-w-3xl rounded-2xl border border-trusted/30 bg-trusted/[0.04] p-7 md:p-9">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-trusted">
                {contact.label || "Contact"}
              </div>
              <h3 className="mt-2 font-heading text-xl font-bold text-white">{contact.heading}</h3>
              <div className="mt-4 space-y-1 text-[15px] leading-relaxed text-slate-300">
                {contact.lines.map((l, i) => (
                  <p key={i}>{renderRichText(l)}</p>
                ))}
              </div>
            </div>
          </Container>
        </section>
      )}
    </div>
  );
}

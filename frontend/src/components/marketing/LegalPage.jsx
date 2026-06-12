import { Container, Eyebrow, Reveal, AmbientBackdrop } from "@/components/marketing/primitives";

/**
 * Long-form legal page wrapper used by Privacy and Terms.
 * Renders a clean, readable layout for prose content.
 */
export default function LegalPage({ eyebrow, title, effectiveDate, intro, sections, contact, testId }) {
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
              <div className="prose prose-invert mt-8 max-w-3xl text-slate-300">
                {intro.map((p, i) => (
                  <p key={i} className="mt-4 text-[15px] leading-relaxed text-slate-300">
                    {p}
                  </p>
                ))}
              </div>
            </Reveal>
          )}
        </Container>
      </section>

      {/* CONTENT */}
      <section className="border-t border-white/8 bg-[#0A0B0D] py-16 md:py-20">
        <Container>
          <div className="mx-auto max-w-3xl space-y-12">
            {sections.map((sec, idx) => (
              <Reveal key={idx} delay={Math.min(0.04 * idx, 0.3)}>
                <article className="rounded-2xl border border-white/10 bg-surface p-7 md:p-9">
                  {sec.label && (
                    <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-trusted">{sec.label}</div>
                  )}
                  <h2 className="mt-2 font-heading text-2xl font-extrabold tracking-tight text-white md:text-3xl">
                    {sec.heading}
                  </h2>
                  {sec.body && (
                    <div className="mt-5 space-y-4">
                      {sec.body.map((b, i) => (
                        <p key={i} className="text-[15px] leading-relaxed text-slate-300">
                          {b}
                        </p>
                      ))}
                    </div>
                  )}
                  {sec.subsections && (
                    <div className="mt-6 space-y-7">
                      {sec.subsections.map((sub, si) => (
                        <div key={si}>
                          <h3 className="font-heading text-lg font-bold text-white">{sub.heading}</h3>
                          {sub.body && (
                            <div className="mt-3 space-y-3">
                              {sub.body.map((b, i) => (
                                <p key={i} className="text-[15px] leading-relaxed text-slate-300">
                                  {b}
                                </p>
                              ))}
                            </div>
                          )}
                          {sub.list && (
                            <ul className="mt-3 space-y-2">
                              {sub.list.map((it, i) => (
                                <li key={i} className="flex items-start gap-3 text-[15px] leading-relaxed text-slate-300">
                                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-trusted/70" />
                                  <span>{it}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {sec.list && (
                    <ul className="mt-5 space-y-2">
                      {sec.list.map((it, i) => (
                        <li key={i} className="flex items-start gap-3 text-[15px] leading-relaxed text-slate-300">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-trusted/70" />
                          <span>{it}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* CONTACT */}
      {contact && (
        <section className="border-t border-white/8 py-16">
          <Container>
            <div className="mx-auto max-w-3xl rounded-2xl border border-trusted/30 bg-trusted/[0.04] p-7 md:p-9">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-trusted">{contact.label || "Contact"}</div>
              <h3 className="mt-2 font-heading text-xl font-bold text-white">{contact.heading}</h3>
              <div className="mt-4 space-y-1 text-[15px] leading-relaxed text-slate-300">
                {contact.lines.map((l, i) => (
                  <p key={i}>{l}</p>
                ))}
              </div>
            </div>
          </Container>
        </section>
      )}
    </div>
  );
}

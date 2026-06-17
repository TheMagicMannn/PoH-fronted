import { Link } from "react-router-dom";
import { motion, useInView, animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function Container({ className, children }) {
  return <div className={cn("mx-auto w-full max-w-7xl px-6 md:px-10", className)}>{children}</div>;
}

export function Reveal({ children, className, delay = 0, y = 36, as: Comp = motion.div }) {
  return (
    <Comp
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </Comp>
  );
}

export const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.04 } },
};
export const staggerItem = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

export function Stagger({ children, className }) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function Item({ children, className }) {
  return <motion.div variants={staggerItem} className={className}>{children}</motion.div>;
}

export function Counter({ to, decimals = 0, prefix = "", suffix = "", duration = 2, className }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setVal(v),
    });
    return () => controls.stop();
  }, [inView, to, duration]);
  return (
    <span ref={ref} className={className}>
      {prefix}
      {val.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  );
}

const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold tracking-tight transition-all duration-300 will-change-transform active:scale-[0.98]";
const btnVariants = {
  primary: "bg-trusted text-black hover:bg-[#2EB886] hover:shadow-[0_0_28px_rgba(52,211,153,0.4)]",
  ghost: "text-white hover:bg-white/10",
  outline: "border border-white/15 text-white hover:border-white/45 hover:bg-white/[0.04]",
  dark: "bg-white text-black hover:bg-trusted",
};
const btnSizes = { sm: "px-3.5 py-2 text-xs", md: "px-5 py-2.5 text-sm", lg: "px-6 py-3 text-base" };

export function Btn({ to, href, variant = "primary", size = "md", className, children, ...rest }) {
  const cls = cn(btnBase, btnVariants[variant], btnSizes[size], className);
  if (to) return <Link to={to} className={cls} {...rest}>{children}</Link>;
  if (href) return <a href={href} className={cls} {...rest}>{children}</a>;
  return <button className={cls} {...rest}>{children}</button>;
}

const toneMap = {
  secure: "bg-trusted/12 text-trusted border-trusted/30",
  suspicious: "bg-suspicious/12 text-suspicious border-suspicious/30",
  fraud: "bg-fraudulent/12 text-fraudulent border-fraudulent/30",
  review: "bg-review/12 text-review border-review/30",
  muted: "bg-white/5 text-slate-300 border-white/10",
};
export function StatusBadge({ tone = "secure", children, className, dot = false }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider",
        toneMap[tone],
        className
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse-dot" />}
      {children}
    </span>
  );
}

export function Eyebrow({ children, className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.22em] text-trusted",
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-trusted animate-pulse-dot" />
      {children}
    </span>
  );
}

export function SectionHeading({ eyebrow, title, blurb, center = true, className }) {
  return (
    <div className={cn(center ? "mx-auto max-w-2xl text-center" : "max-w-2xl", className)}>
      {eyebrow && <Reveal><Eyebrow>{eyebrow}</Eyebrow></Reveal>}
      <Reveal delay={0.05}>
        <h2 className="mt-5 font-heading text-3xl font-extrabold tracking-tight text-white md:text-4xl">{title}</h2>
      </Reveal>
      {blurb && (
        <Reveal delay={0.1}>
          <p className={cn("mt-4 text-base leading-relaxed text-slate-400", center && "mx-auto")}>{blurb}</p>
        </Reveal>
      )}
    </div>
  );
}

/** Decorative ambient glow + grid backdrop layer for hero/section surfaces. */
export function AmbientBackdrop({ className }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div className="absolute inset-0 bg-grid-fine opacity-[0.55]" />
      <div className="absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-trusted/10 blur-[120px] animate-glow-pulse" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-trusted/40 to-transparent" />
    </div>
  );
}

import type { BehaviorSignal } from "../types/common.js";

interface MousePoint {
  x: number;
  y: number;
  t: number;
}

interface KeyEvent {
  key: string;
  downAt: number;
  upAt?: number;
}

export class BehaviorCollector {
  private mousePoints: MousePoint[] = [];
  private keyEvents: KeyEvent[] = [];
  private scrollEvents: number[] = [];
  private clickCount = 0;
  private formInteractionCount = 0;
  private pasteCount = 0;
  private idlePeriods = 0;
  private sessionStartMs: number;
  private firstInteractionMs: number | null = null;
  private maxScrollDepth = 0;
  private lastEventMs: number;
  private idleThresholdMs = 5_000;
  private attached = false;
  private readonly maxSamples = 500;

  private listeners: Array<[keyof DocumentEventMap, EventListener]> = [];

  constructor() {
    this.sessionStartMs = Date.now();
    this.lastEventMs = this.sessionStartMs;
  }

  attach(): void {
    if (this.attached || typeof document === "undefined") return;
    this.attached = true;

    this.addListener("mousemove", this.onMouseMove.bind(this) as EventListener);
    this.addListener("click", this.onClick.bind(this) as EventListener);
    this.addListener("keydown", this.onKeyDown.bind(this) as EventListener);
    this.addListener("keyup", this.onKeyUp.bind(this) as EventListener);
    this.addListener("scroll", this.onScroll.bind(this) as EventListener);
    this.addListener("paste", this.onPaste.bind(this) as EventListener);

    const focusFields = ["input", "select", "textarea"];
    focusFields.forEach((selector) => {
      document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
        el.addEventListener("focus", this.onFormFocus.bind(this) as EventListener);
      });
    });
  }

  detach(): void {
    if (!this.attached) return;
    this.listeners.forEach(([type, fn]) => document.removeEventListener(type, fn));
    this.listeners = [];
    this.attached = false;
  }

  collect(): BehaviorSignal {
    const nowMs = Date.now();
    const sessionDurationMs = nowMs - this.sessionStartMs;

    const cadenceMs = this.keyEvents
      .filter((e) => e.upAt !== undefined)
      .map((e) => e.upAt! - e.downAt)
      .filter((d) => d > 0 && d < 2000);

    const scrollDepthPercent =
      typeof document !== "undefined"
        ? Math.round(
            (this.maxScrollDepth /
              Math.max(
                1,
                document.documentElement.scrollHeight - window.innerHeight,
              )) *
              100,
          )
        : 0;

    const mouseMoveEntropy = this.computeMouseEntropy();

    return {
      mouseEventCount: this.mousePoints.length,
      keyEventCount: this.keyEvents.length,
      scrollEventCount: this.scrollEvents.length,
      clickCount: this.clickCount,
      formInteractionCount: this.formInteractionCount,
      pasteCount: this.pasteCount,
      idlePeriodsCount: this.idlePeriods,
      sessionDurationMs,
      firstInteractionMs: this.firstInteractionMs ?? undefined,
      typingCadenceMs: cadenceMs.slice(0, 20),
      scrollDepthPercent: Math.min(100, scrollDepthPercent),
      mouseMoveEntropy,
    };
  }

  reset(): void {
    this.mousePoints = [];
    this.keyEvents = [];
    this.scrollEvents = [];
    this.clickCount = 0;
    this.formInteractionCount = 0;
    this.pasteCount = 0;
    this.idlePeriods = 0;
    this.sessionStartMs = Date.now();
    this.lastEventMs = this.sessionStartMs;
    this.firstInteractionMs = null;
    this.maxScrollDepth = 0;
  }

  private addListener(type: keyof DocumentEventMap, fn: EventListener): void {
    document.addEventListener(type, fn, { passive: true });
    this.listeners.push([type, fn]);
  }

  private recordInteraction(): void {
    const now = Date.now();
    if (this.firstInteractionMs === null) {
      this.firstInteractionMs = now - this.sessionStartMs;
    }
    if (now - this.lastEventMs > this.idleThresholdMs) {
      this.idlePeriods++;
    }
    this.lastEventMs = now;
  }

  private onMouseMove(e: MouseEvent): void {
    this.recordInteraction();
    if (this.mousePoints.length < this.maxSamples) {
      this.mousePoints.push({ x: e.clientX, y: e.clientY, t: Date.now() });
    }
  }

  private onClick(): void {
    this.recordInteraction();
    this.clickCount++;
  }

  private onKeyDown(e: KeyboardEvent): void {
    this.recordInteraction();
    if (this.keyEvents.length < this.maxSamples) {
      this.keyEvents.push({ key: e.key, downAt: Date.now() });
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    let last: KeyEvent | undefined;
    for (let i = this.keyEvents.length - 1; i >= 0; i--) {
      if (this.keyEvents[i].key === e.key && this.keyEvents[i].upAt === undefined) {
        last = this.keyEvents[i];
        break;
      }
    }
    if (last) last.upAt = Date.now();
  }

  private onScroll(): void {
    this.recordInteraction();
    const scrollY =
      window.scrollY ?? document.documentElement.scrollTop ?? 0;
    if (scrollY > this.maxScrollDepth) this.maxScrollDepth = scrollY;
    if (this.scrollEvents.length < this.maxSamples) {
      this.scrollEvents.push(Date.now());
    }
  }

  private onPaste(): void {
    this.recordInteraction();
    this.pasteCount++;
  }

  private onFormFocus(): void {
    this.recordInteraction();
    this.formInteractionCount++;
  }

  private computeMouseEntropy(): number {
    if (this.mousePoints.length < 3) return 0;
    let angleVariance = 0;
    for (let i = 1; i < this.mousePoints.length - 1; i++) {
      const dx1 = this.mousePoints[i].x - this.mousePoints[i - 1].x;
      const dy1 = this.mousePoints[i].y - this.mousePoints[i - 1].y;
      const dx2 = this.mousePoints[i + 1].x - this.mousePoints[i].x;
      const dy2 = this.mousePoints[i + 1].y - this.mousePoints[i].y;
      const angle1 = Math.atan2(dy1, dx1);
      const angle2 = Math.atan2(dy2, dx2);
      angleVariance += Math.abs(angle2 - angle1);
    }
    return Math.round((angleVariance / this.mousePoints.length) * 100) / 100;
  }
}

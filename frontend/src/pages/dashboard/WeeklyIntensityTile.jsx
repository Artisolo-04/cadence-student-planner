import { useEffect, useRef, useState } from "react";
import { BarChart3 } from "lucide-react";

function readColor(varName, fallback) {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return value || fallback;
}

function formatHours(totalMinutes) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export default function WeeklyIntensityTile({ data }) {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const rafRef = useRef(null);
  const [size, setSize] = useState({ width: 260, height: 110 });

  const maxMinutes = Math.max(1, ...data.map((d) => d.minutes));
  const totalMinutes = data.reduce((sum, d) => sum + d.minutes, 0);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize({ width: Math.max(0, width), height: Math.max(0, height) });
    });

    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || size.width === 0 || size.height === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const { width, height } = size;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    const barColor = readColor("--color-primary", "#2fa39a");
    const trackColor = "rgba(255,255,255,0.06)";

    const gap = 8;
    const barWidth = (width - gap * (data.length - 1)) / data.length;
    const bottomPad = 4;
    const fullBarHeight = height - bottomPad;

    const start = performance.now();
    const duration = 550;

    function ease(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function draw(progress) {
      ctx.clearRect(0, 0, width, height);

      data.forEach((d, i) => {
        const x = i * (barWidth + gap);

        ctx.fillStyle = trackColor;
        ctx.beginPath();
        ctx.roundRect(x, height - fullBarHeight - bottomPad, barWidth, fullBarHeight, 4);
        ctx.fill();

        const targetHeight = (d.minutes / maxMinutes) * fullBarHeight;
        const barHeight = targetHeight * progress;
        if (barHeight > 0) {
          ctx.fillStyle = barColor;
          ctx.beginPath();
          ctx.roundRect(x, height - barHeight - bottomPad, barWidth, barHeight, 4);
          ctx.fill();
        }
      });
    }

    function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      draw(ease(t));
      if (t < 1) rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [data, maxMinutes, size]);

  return (
    <div
      className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 p-5 backdrop-blur-xl"
      style={{
        backgroundImage:
          "linear-gradient(150deg, color-mix(in srgb, var(--color-accent) 14%, transparent) 0%, transparent 70%)",
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--color-primary)]">
          <BarChart3 size={12} />
          Weekly Intensity
        </div>
        <span className="text-[10px] font-mono text-[var(--color-text-muted)]">
          {formatHours(totalMinutes)} total
        </span>
      </div>

      <div ref={wrapperRef} className="mt-3 min-h-0 flex-1">
        <canvas ref={canvasRef} />
      </div>

      <div className="mt-1.5 flex shrink-0 justify-between px-0.5">
        {data.map((d) => (
          <span key={d.label} className="text-[9px] text-[var(--color-text-muted)]">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

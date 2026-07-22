"use client";

import Link from "next/link";
import { FaGithub, FaXTwitter } from "react-icons/fa6";
import { ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const SITE_LINKS = [
  {
    title: "Product",
    links: [
      { id: 1, label: "Discover", href: "/" },
      { id: 2, label: "Recommend", href: "/recommend" },
      { id: 3, label: "History", href: "/history" },
      { id: 4, label: "Add Repo", href: "/ingest" },
    ],
  },
  {
    title: "Company",
    links: [
      { id: 5, label: "GitHub", href: "https://github.com/eniyos/oprepo" },
      { id: 6, label: "About", href: "/" },
      { id: 7, label: "Blog", href: "#" },
      { id: 8, label: "Contact", href: "#" },
    ],
  },
  {
    title: "Resources",
    links: [
      { id: 9, label: "Documentation", href: "#" },
      { id: 10, label: "API Status", href: "#" },
      { id: 11, label: "Newsletter", href: "#" },
      { id: 12, label: "Privacy", href: "#" },
    ],
  },
];

/* ─── Flickering Grid ─── */
function FlickeringGrid({
  text = "",
  className,
}: {
  text?: string;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [tablet, setTablet] = useState(false);

  useEffect(() => {
    const check = () => setTablet(window.innerWidth <= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const squareSize = 2;
    const gridGap = tablet ? 2 : 3;
    const maxOpacity = 0.3;
    const flickerChance = 0.1;
    const displayText = tablet ? "Footer" : text;

    let animationId: number;
    let squares: Float32Array;
    let cols: number;
    let rows: number;
    let dpr: number;

    const setup = () => {
      dpr = window.devicePixelRatio || 1;
      const w = container.clientWidth;
      const h = container.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      cols = Math.ceil(w / (squareSize + gridGap));
      rows = Math.ceil(h / (squareSize + gridGap));
      squares = new Float32Array(cols * rows);
      for (let i = 0; i < squares.length; i++) {
        squares[i] = Math.random() * maxOpacity;
      }
    };

    setup();

    const draw = () => {
      ctx!.clearRect(0, 0, canvas.width, canvas.height);

      // Text mask
      const maskCanvas = document.createElement("canvas");
      maskCanvas.width = canvas.width;
      maskCanvas.height = canvas.height;
      const maskCtx = maskCanvas.getContext("2d");
      if (maskCtx && displayText) {
        maskCtx.scale(dpr, dpr);
        maskCtx.fillStyle = "white";
        maskCtx.font = `600 ${tablet ? 70 : 90}px Inter, system-ui, sans-serif`;
        maskCtx.textAlign = "center";
        maskCtx.textBaseline = "middle";
        maskCtx.fillText(displayText, canvas.width / (2 * dpr), canvas.height / (2 * dpr));
      }

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * (squareSize + gridGap) * dpr;
          const y = j * (squareSize + gridGap) * dpr;
          const sw = squareSize * dpr;
          const sh = squareSize * dpr;

          const maskData = maskCtx?.getImageData(x, y, sw, sh).data;
          const hasText = maskData?.some((v, idx) => idx % 4 === 0 && v > 0);

          const opacity = squares[i * rows + j];
          const finalOpacity = hasText
            ? Math.min(1, opacity * 3 + 0.4)
            : opacity;

          ctx!.fillStyle = `rgba(107, 114, 128, ${finalOpacity})`;
          ctx!.fillRect(x, y, sw, sh);
        }
      }

      // Update flicker
      for (let i = 0; i < squares.length; i++) {
        if (Math.random() < flickerChance * 0.016) {
          squares[i] = Math.random() * maxOpacity;
        }
      }

      if (isInView) animationId = requestAnimationFrame(draw);
    };

    const ro = new ResizeObserver(() => { setup(); });
    ro.observe(container);

    const io = new IntersectionObserver(([e]) => setIsInView(e.isIntersecting), { threshold: 0 });
    io.observe(canvas);

    if (isInView) animationId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationId);
      ro.disconnect();
      io.disconnect();
    };
  }, [isInView, text, tablet]);

  return (
    <div ref={containerRef} className={className}>
      <canvas ref={canvasRef} className="pointer-events-none w-full h-full" />
    </div>
  );
}

/* ─── Main Footer ─── */
export function AnimatedFooter({
  companyDescription = "OpRepo connects developers with open-source repositories they'll love contributing to. Our ML-powered engine analyzes your skills and matches you with projects that fit.",
}: {
  companyDescription?: string;
}) {
  return (
    <footer id="footer" className="w-full pb-0">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between p-8 md:p-12 lg:p-16 gap-10">
        {/* Brand */}
        <div className="flex flex-col items-start gap-5 max-w-xs">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
              <div className="h-4 w-4 rounded-[3px] bg-primary" />
            </div>
            <span className="text-xl font-semibold text-foreground">OpRepo</span>
          </Link>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {companyDescription}
          </p>
          {/* Social icons */}
          <div className="flex items-center gap-2.5">
            {[
              { href: "https://github.com/eniyos/oprepo", icon: <FaGithub size={18} />, label: "GitHub" },
              { href: "https://x.com", icon: <FaXTwitter size={18} />, label: "X (Twitter)" },
            ].map(({ href, icon, label }) => (
              <Link
                key={label}
                href={href}
                aria-label={label}
                className="h-9 w-9 rounded-lg border border-border/60 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all duration-200"
              >
                {icon}
              </Link>
            ))}
          </div>
        </div>

        {/* Nav columns */}
        <div className="w-full md:w-1/2">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 md:pl-10">
            {SITE_LINKS.map((column) => (
              <ul key={column.title} className="flex flex-col gap-3">
                <li className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">
                  {column.title}
                </li>
                {column.links.map((link) => (
                  <li key={link.id}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center gap-1 text-sm text-muted-foreground/80 hover:text-foreground transition-colors"
                    >
                      <span>{link.label}</span>
                      <ChevronRight className="h-3.5 w-3.5 translate-x-0 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </div>

      {/* Flickering Grid */}
      <div className="w-full h-48 md:h-64 relative mt-16 z-0">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent z-10 from-30%" />
        <div className="absolute inset-0 mx-6">
          <FlickeringGrid
            text="Streamline your workflow"
            className="w-full h-full"
          />
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border/30 px-8 md:px-12 lg:px-16 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground/60">
        <p>OpRepo &copy; {new Date().getFullYear()}. All rights reserved.</p>
        <p>Find your next open-source contribution.</p>
      </div>
    </footer>
  );
}

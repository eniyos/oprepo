"use client";

import Link from "next/link";
import { FaGithub, FaXTwitter } from "react-icons/fa6";
import { cn } from "@/lib/utils";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import React, { useMemo, useRef, useState, MouseEvent, useCallback, useEffect } from "react";
import * as THREE from "three";
import { motion } from "framer-motion";

interface DotMatrixProps {
  colors?: number[][];
  opacities?: number[];
  totalSize?: number;
  dotSize?: number;
  shader?: string;
  center?: ("x" | "y")[];
}

interface ShaderProps {
  source: string;
  uniforms: Record<string, { value: number[] | number[][] | number; type: string }>;
  maxFps?: number;
}

interface FooterLink { label: string; href: string }
interface SocialLink { href: string; icon: React.ReactNode; ariaLabel: string }

interface FooterProps {
  heading?: { line1?: string; line2?: string; line3?: string };
  socialLinks?: SocialLink[];
  links?: FooterLink[];
  companyDescription?: string;
  copyright?: { companyName?: string; year?: number; additionalText?: string };
}

type Uniforms = Record<string, { value: number[] | number[][] | number; type: string }>;

/* ─── Dot Matrix Shader ─── */
const DotMatrix: React.FC<DotMatrixProps> = ({
  colors = [[0, 0, 0]], opacities = [0.04, 0.04, 0.04, 0.04, 0.04, 0.08, 0.08, 0.08, 0.08, 0.14],
  totalSize = 4, dotSize = 2, shader = "", center = ["x", "y"],
}) => {
  const preparedUniforms = useMemo(() => {
    const base = [colors[0], colors[0], colors[0], colors[0], colors[0], colors[0]];
    const arr = colors.length === 2
      ? [colors[0], colors[0], colors[0], colors[1], colors[1], colors[1]]
      : colors.length === 3
        ? [colors[0], colors[0], colors[1], colors[1], colors[2], colors[2]]
        : base;
    return {
      u_colors: { value: arr.map((c) => [c[0] / 255, c[1] / 255, c[2] / 255]), type: "uniform3fv" },
      u_opacities: { value: opacities, type: "uniform1fv" },
      u_total_size: { value: totalSize, type: "uniform1f" },
      u_dot_size: { value: dotSize, type: "uniform1f" },
    };
  }, [colors, opacities, totalSize, dotSize]);

  return (
    <Shader source={`
      precision mediump float; in vec2 fragCoord;
      uniform float u_time; uniform float u_opacities[10]; uniform vec3 u_colors[6];
      uniform float u_total_size; uniform float u_dot_size; uniform vec2 u_resolution; out vec4 fragColor;
      float PHI = 1.61803398874989484820459;
      float random(vec2 xy) { return fract(tan(distance(xy * PHI, xy) * 0.5) * xy.x); }
      void main() {
        vec2 st = fragCoord.xy;
        ${center.includes("x") ? "st.x -= abs(floor((mod(u_resolution.x, u_total_size) - u_dot_size) * 0.5));" : ""}
        ${center.includes("y") ? "st.y -= abs(floor((mod(u_resolution.y, u_total_size) - u_dot_size) * 0.5));" : ""}
        float opacity = step(0.0, st.x) * step(0.0, st.y);
        vec2 st2 = vec2(int(st.x / u_total_size), int(st.y / u_total_size));
        float show_offset = random(st2);
        float rand = random(st2 * floor((u_time / 5.0) + show_offset + 5.0) + 1.0);
        opacity *= u_opacities[int(rand * 10.0)];
        opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.x / u_total_size));
        opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.y / u_total_size));
        vec3 color = u_colors[int(show_offset * 6.0)];
        ${shader}
        fragColor = vec4(color, opacity); fragColor.rgb *= fragColor.a;
      }`} uniforms={preparedUniforms} maxFps={60} />
  );
};

/* ─── Shiny Text (shimmer on hover) ─── */
const ShinyText = ({ text, children, isShining = false, speed = 1, className = '' }: {
  text?: string; children?: React.ReactNode; isShining?: boolean; speed?: number; className?: string;
}) => (
  <span className={cn("inline-block bg-clip-text text-inherit transition-opacity", className)}
    style={{
      backgroundImage: 'linear-gradient(120deg, rgba(255,255,255,0) 40%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0) 60%)',
      backgroundSize: '200% 100%', WebkitBackgroundClip: 'text',
      backgroundPosition: isShining ? '-100%' : '110%',
      transition: isShining ? `background-position ${speed}s linear` : 'none',
    }}>
    {children || text}
  </span>
);

/* ─── Decrypt Text (scramble effect on hover) ─── */
const DecryptText = ({ text, isDecrypting = false, duration = 0.1 }: {
  text: string; isDecrypting?: boolean; duration?: number;
}) => {
  const [displayText, setDisplayText] = useState(text);
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+[]{}|;:,.<>?/";

  useEffect(() => {
    if (!isDecrypting) { setDisplayText(text); return; }
    let iteration = 0;
    const interval = setInterval(() => {
      setDisplayText(prev => prev.split("").map((c, i) => {
        if (c === " ") return " ";
        if (i < iteration) return text[i];
        return chars[Math.floor(Math.random() * chars.length)];
      }).join(""));
      iteration += 1 / 3;
      if (iteration >= text.length) { clearInterval(interval); setDisplayText(text); }
    }, duration * 1000 / text.length);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDecrypting, text, duration]);

  return <>{displayText}</>;
};

/* ─── Animated Nav Link ─── */
const AnimatedLink = ({ href, children, className }: {
  href: string; children: React.ReactNode; className?: string;
}) => {
  const [hovered, setHovered] = useState(false);
  const text = typeof children === 'string' ? children : '';
  return (
    <motion.div className="relative overflow-hidden" whileHover="hover" initial="initial"
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <motion.div className="absolute inset-0 bg-white/[0.06] z-0" variants={{ initial: { x: "-100%" }, hover: { x: 0 } }} transition={{ duration: 0.3 }} />
      <Link href={href} className={cn("z-10 relative h-full flex items-center justify-center", className)}>
        {typeof children === 'string' ? (
          <ShinyText isShining={hovered} speed={0.8}>
            <DecryptText text={text} isDecrypting={hovered} />
          </ShinyText>
        ) : children}
      </Link>
    </motion.div>
  );
};

/* ─── Animated Icon Link ─── */
const AnimatedIconLink = ({ href, icon, ariaLabel, className }: {
  href: string; icon: React.ReactNode; ariaLabel: string; className?: string;
}) => {
  const [, setHovered] = useState(false);
  return (
    <motion.div className={cn("relative overflow-hidden", className)} whileHover="hover" initial="initial"
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <motion.div className="absolute inset-0 bg-white/[0.08] z-0" variants={{ initial: { x: "-100%" }, hover: { x: 0 } }} transition={{ duration: 0.3 }} />
      <Link href={href} aria-label={ariaLabel} className="text-muted-foreground hover:text-foreground transition-colors z-10 relative flex items-center justify-center w-full h-full">
        {icon}
      </Link>
    </motion.div>
  );
};

/* ─── Canvas Reveal Effect (the animated dot matrix) ─── */
const CanvasRevealEffect = ({
  animationSpeed = 5, opacities = [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1],
  colors = [[59, 130, 246]], containerClassName, dotSize, showGradient = true,
}: {
  animationSpeed?: number; opacities?: number[]; colors?: number[][]; containerClassName?: string;
  dotSize?: number; showGradient?: boolean;
}) => {
  const [mousePos, setMousePos] = useState<[number, number]>([0.5, 0.5]);
  const [lastMouse, setLastMouse] = useState<[number, number]>([0.5, 0.5]);
  const [hovering, setHovering] = useState(false);
  const [intensity, setIntensity] = useState(0);

  useEffect(() => {
    let id: number;
    const start = intensity;
    const target = hovering ? 1 : 0;
    const dur = 0.5;
    const t0 = performance.now();
    const step = () => {
      const p = Math.min((performance.now() - t0) / 1000 / dur, 1);
      setIntensity(start + (target - start) * p);
      if (p < 1) id = requestAnimationFrame(step);
    };
    id = requestAnimationFrame(step);
    return () => { if (id) cancelAnimationFrame(id); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hovering]);

  const handleMouse = useCallback((e: MouseEvent) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    setMousePos([x, y]);
    if (!hovering) setLastMouse([x, y]);
  }, [hovering]);

  const pos = hovering ? mousePos : lastMouse;

  return (
    <div className={cn("h-full relative w-full bg-transparent", containerClassName)}
      onMouseMove={handleMouse} onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}>
      <div className="h-full w-full">
        <DotMatrix colors={colors} dotSize={dotSize ?? 3} opacities={opacities}
          shader={`
            float anim = ${animationSpeed.toFixed(1)};
            float off = distance(u_resolution / 2.0 / u_total_size, st2) * 0.01 + (random(st2) * 0.15);
            opacity *= step(off, u_time * anim);
            opacity *= clamp((1.0 - step(off + 0.1, u_time * anim)) * 1.25, 1.0, 1.25);
            float hf = ${intensity.toFixed(4)};
            vec2 mp = vec2(${pos[0].toFixed(4)}, ${pos[1].toFixed(4)}) * u_resolution / u_total_size;
            float d = distance(st2, mp);
            if (d < 150.0) {
              float cf = smoothstep(150.0, 0.0, d) * hf;
              vec3 hc = clamp(u_colors[int(mod(random(st2) * 10.0, 6.0))] * 1.5, vec3(0.0), vec3(1.0));
              color = mix(color, hc, cf * 0.9);
              opacity = mix(opacity, min(opacity * 1.5, 1.0), cf * 0.7);
            }`}
          center={["x", "y"]} />
      </div>
      {showGradient && <div className="absolute inset-0 bg-gradient-to-t from-background to-[60%]" />}
    </div>
  );
};

/* ─── Three.js Shader Wrapper ─── */
const ShaderMaterial = ({ source, uniforms, maxFps = 60 }: { source: string; maxFps?: number; uniforms: Uniforms }) => {
  const { size } = useThree();
  const ref = useRef<THREE.Mesh>(null);
  let lastTime = 0;

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    if (t - lastTime < 1 / maxFps) return;
    lastTime = t;
    (ref.current.material as unknown as { uniforms: { u_time: { value: number } } }).uniforms.u_time.value = t;
  });

  const material = useMemo(() => {
    const getUniforms = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const u: Record<string, any> = {};
      for (const k in uniforms) {
        const v = uniforms[k];
        switch (v.type) {
          case "uniform1f": u[k] = { value: v.value, type: "1f" }; break;
          case "uniform3f": u[k] = { value: new THREE.Vector3().fromArray(v.value as number[]), type: "3f" }; break;
          case "uniform1fv": u[k] = { value: v.value, type: "1fv" }; break;
          case "uniform3fv": u[k] = { value: (v.value as number[][]).map((a) => new THREE.Vector3().fromArray(a)), type: "3fv" }; break;
          case "uniform2f": u[k] = { value: new THREE.Vector2().fromArray(v.value as number[]), type: "2f" }; break;
        }
      }
      u.u_time = { value: 0, type: "1f" };
      u.u_resolution = { value: new THREE.Vector2(size.width * 2, size.height * 2) };
      return u;
    };
    return new THREE.ShaderMaterial({
      vertexShader: `
        precision mediump float; in vec2 coordinates; uniform vec2 u_resolution; out vec2 fragCoord;
        void main(){
          gl_Position = vec4(position.x, position.y, 0.0, 1.0);
          fragCoord = (position.xy + vec2(1.0)) * 0.5 * u_resolution;
          fragCoord.y = u_resolution.y - fragCoord.y;
        }`,
      fragmentShader: source,
      uniforms: getUniforms(),
      glslVersion: THREE.GLSL3,
      blending: THREE.CustomBlending, blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneFactor,
    });
  }, [size.width, size.height, source, uniforms]);

  return (
    <mesh ref={ref as React.Ref<THREE.Mesh>}>
      <planeGeometry args={[2, 2]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
};

const Shader: React.FC<ShaderProps> = ({ source, uniforms, maxFps = 60 }) => (
  <Canvas className="absolute inset-0 h-full w-full">
    <ShaderMaterial source={source} uniforms={uniforms} maxFps={maxFps} />
  </Canvas>
);

/* ─── Main Footer Export ─── */
export function AnimatedFooter({
  heading = { line1: "Ready to", line2: "contribute?", line3: "Let's go." },
  socialLinks = [
    { href: "https://github.com/eniyos/oprepo", icon: <FaGithub size={20} />, ariaLabel: "GitHub" },
    { href: "https://x.com", icon: <FaXTwitter size={20} />, ariaLabel: "Twitter" },
  ],
  links = [
    { label: "Discover", href: "/" }, { label: "Recommend", href: "/recommend" },
    { label: "History", href: "/history" }, { label: "Add Repo", href: "/ingest" },
    { label: "GitHub", href: "https://github.com/eniyos/oprepo" },
  ],
  companyDescription = "OpRepo connects developers with open-source repositories they'll love contributing to. Our ML-powered engine analyzes your skills and matches you with projects that fit.",
  copyright = { companyName: "OpRepo", year: new Date().getFullYear(), additionalText: "Find your next open-source contribution." },
}: FooterProps) {
  return (
    <footer className="w-full bg-background border-t border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        {/* Heading */}
        <div className="text-center mb-16 lg:mb-20">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight leading-[1.15]">
            {heading.line1}<br />
            <span className="text-gradient font-medium">{heading.line2}</span><br />
            {heading.line3}
          </h2>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-12 border-t border-border/50">

          {/* Social icons (desktop: cols 1-2) */}
          <div className="hidden lg:flex lg:col-span-1 border-r border-b border-border/50 items-center justify-center py-10">
            <AnimatedIconLink href={socialLinks[0]?.href ?? "#"} icon={socialLinks[0]?.icon} ariaLabel={socialLinks[0]?.ariaLabel ?? ""} />
          </div>
          <div className="hidden lg:flex lg:col-span-1 border-r border-b border-border/50 items-center justify-center py-10">
            <AnimatedIconLink href={socialLinks[1]?.href ?? "#"} icon={socialLinks[1]?.icon} ariaLabel={socialLinks[1]?.ariaLabel ?? ""} />
          </div>

          {/* Canvas (desktop: cols 3-10) */}
          <div className="hidden lg:block lg:col-span-8 border-r border-b border-border/50 relative h-64">
            <CanvasRevealEffect animationSpeed={5} colors={[[59, 130, 246], [99, 102, 241]]} dotSize={3} />
          </div>

          {/* Desktop nav right side (cols 11-12) */}
          <div className="hidden lg:flex lg:col-span-2 flex-col border-b border-border/50">
            {links.slice(0, 2).map((link) => (
              <AnimatedLink key={link.label} href={link.href} className="flex-1 text-sm border-b border-border/50 last:border-b-0">
                {link.label}
              </AnimatedLink>
            ))}
          </div>

          {/* Description (desktop: cols 1-9) */}
          <div className="hidden lg:block lg:col-span-9 border-r border-border/50 p-8 text-sm text-muted-foreground leading-relaxed">
            <p>{companyDescription}</p>
          </div>

          {/* Desktop nav bottom right (cols 10-12) */}
          <div className="hidden lg:flex lg:col-span-3">
            {links.slice(2, 5).map((link, i) => (
              <AnimatedLink key={link.label} href={link.href} className={`flex-1 text-sm ${i < 2 ? 'border-r border-border/50' : ''}`}>
                {link.label}
              </AnimatedLink>
            ))}
          </div>

          {/* ─── Mobile layout ─── */}

          {/* Social (mobile) */}
          <div className="flex lg:hidden col-span-2 border-b border-border/50">
            {socialLinks.slice(0, 2).map((link, i) => (
              <AnimatedIconLink key={link.ariaLabel} href={link.href} icon={link.icon} ariaLabel={link.ariaLabel}
                className={cn("flex-1 py-8 flex items-center justify-center", i === 0 ? "border-r border-border/50" : "")} />
            ))}
          </div>

          {/* Canvas (mobile) */}
          <div className="lg:hidden col-span-2 border-b border-border/50 relative h-48">
            <CanvasRevealEffect animationSpeed={5} colors={[[59, 130, 246], [99, 102, 241]]} dotSize={3} />
          </div>

          {/* Nav links (mobile) */}
          {links.slice(0, 4).map((link, i) => (
            <AnimatedLink key={link.label} href={link.href}
              className={`py-8 text-sm border-b border-border/50 ${i % 2 === 0 ? 'border-r border-border/50' : ''} ${i >= 2 ? 'border-b-0' : ''}`}>
              {link.label}
            </AnimatedLink>
          ))}
        </div>

        {/* Copyright */}
        <div className="pt-10 text-center text-xs text-muted-foreground/60">
          <p>{copyright.companyName} &copy;{copyright.year} All rights reserved</p>
          {copyright.additionalText && <p className="mt-1">{copyright.additionalText}</p>}
        </div>
      </div>
    </footer>
  );
}

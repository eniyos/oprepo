"use client";

import Link from "next/link";
import { FaGithub, FaLinkedinIn } from "react-icons/fa6";
import { cn } from "@/lib/utils";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import React, { useMemo, useRef, useState, MouseEvent, useCallback, useEffect } from "react";
import * as THREE from "three";
import { motion } from "framer-motion";

interface ShinyTextProps {
  text?: string;
  isShining?: boolean;
  speed?: number;
  className?: string;
  children?: React.ReactNode;
}

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
  uniforms: {
    [key: string]: {
      value: number[] | number[][] | number;
      type: string;
    };
  };
  maxFps?: number;
}

interface FooterLink {
  label: string;
  href: string;
}

interface SocialLink {
  href: string;
  icon: React.ReactNode;
  ariaLabel: string;
}

interface FooterProps {
  tagline?: string;
  socialLinks?: SocialLink[];
  productLinks?: FooterLink[];
  projectLinks?: FooterLink[];
  connectLinks?: FooterLink[];
  companyDescription?: string;
}

type Uniforms = {
  [key: string]: {
    value: number[] | number[][] | number;
    type: string;
  };
};

// ---------------------------------------------------------------------------
// AURALIS CHANGES — summary
// ---------------------------------------------------------------------------
// 1. Footer is no longer `fixed` — it was pinned to the viewport and would
//    sit permanently on top of page content. Now a normal in-flow <footer>.
// 2. Removed the hard `bg-black` fill. The footer is transparent so the
//    Auralis WebGL background (glow + noise + grain) shows straight through,
//    same as the rest of the page.
// 3. Removed the giant "Footer / Component / With cool animations" hero-
//    sized heading — a footer shouldn't repeat a hero-scale headline, and it
//    was visually competing with the page's actual hero.
// 4. Retinted the CanvasRevealEffect dot-matrix from generic blue/purple
//    (rgb 59,130,246 / 139,92,246) to the exact Auralis glow colors
//    (#2A4A8C / #4A6FBF), and turned its intensity way down — it's now a
//    quiet accent panel, not a second competing background.
// 5. All borders changed from border-white/20 to border-white/[0.12] to
//    match the thin-hairline style already used elsewhere in the Auralis UI.
// 6. Text colors changed from white/white-70/white-50 to the Auralis text
//    ramp: #F2F4F8 (headings), #8B92A3 (body/links), muted further for
//    copyright line.
// 7. Social icons fixed to actually match their hrefs (GitHub + X), since
//    the original had a GitHub href paired with a LinkedIn icon.
// 8. Default copy replaced with OpRepo's real footer content instead of
//    placeholder "Company Name" / "Link 1..5" text.
// ---------------------------------------------------------------------------

const DotMatrix: React.FC<DotMatrixProps> = ({
  colors = [[42, 74, 140]],
  opacities = [0.02, 0.02, 0.02, 0.02, 0.02, 0.04, 0.04, 0.04, 0.04, 0.07],
  totalSize = 4,
  dotSize = 2,
  shader = "",
  center = ["x", "y"],
}) => {
  const uniforms = React.useMemo(() => {
    let colorsArray = [
      colors[0],
      colors[0],
      colors[0],
      colors[0],
      colors[0],
      colors[0],
    ];
    if (colors.length === 2) {
      colorsArray = [
        colors[0],
        colors[0],
        colors[0],
        colors[1],
        colors[1],
        colors[1],
      ];
    } else if (colors.length === 3) {
      colorsArray = [
        colors[0],
        colors[0],
        colors[1],
        colors[1],
        colors[2],
        colors[2],
      ];
    }

    return {
      u_colors: {
        value: colorsArray.map((color) => [
          color[0] / 255,
          color[1] / 255,
          color[2] / 255,
        ]),
        type: "uniform3fv",
      },
      u_opacities: {
        value: opacities,
        type: "uniform1fv",
      },
      u_total_size: {
        value: totalSize,
        type: "uniform1f",
      },
      u_dot_size: {
        value: dotSize,
        type: "uniform1f",
      },
    };
  }, [colors, opacities, totalSize, dotSize]);

  return (
    <Shader
      source={`
        precision mediump float;
        in vec2 fragCoord;

        uniform float u_time;
        uniform float u_opacities[10];
        uniform vec3 u_colors[6];
        uniform float u_total_size;
        uniform float u_dot_size;
        uniform vec2 u_resolution;
        out vec4 fragColor;
        float PHI = 1.61803398874989484820459;
        float random(vec2 xy) {
            return fract(tan(distance(xy * PHI, xy) * 0.5) * xy.x);
        }
        float map(float value, float min1, float max1, float min2, float max2) {
            return min2 + (value - min1) * (max2 - min1) / (max1 - min1);
        }
        void main() {
            vec2 st = fragCoord.xy;
            ${
              center.includes("x")
                ? "st.x -= abs(floor((mod(u_resolution.x, u_total_size) - u_dot_size) * 0.5));"
                : ""
            }
            ${
              center.includes("y")
                ? "st.y -= abs(floor((mod(u_resolution.y, u_total_size) - u_dot_size) * 0.5));"
                : ""
            }
      float opacity = step(0.0, st.x);
      opacity *= step(0.0, st.y);

      vec2 st2 = vec2(int(st.x / u_total_size), int(st.y / u_total_size));

      float frequency = 5.0;
      float show_offset = random(st2);
      float rand = random(st2 * floor((u_time / frequency) + show_offset + frequency) + 1.0);
      opacity *= u_opacities[int(rand * 10.0)];
      opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.x / u_total_size));
      opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.y / u_total_size));

      vec3 color = u_colors[int(show_offset * 6.0)];

      ${shader}

      fragColor = vec4(color, opacity);
        }`}
      uniforms={uniforms}
      maxFps={60}
    />
  );
};

const ShinyText = ({
  text,
  children,
  isShining = false,
  speed = 1,
  className = "",
}: ShinyTextProps) => {
  const content = children || text;

  return (
    <div
      className={cn("text-inherit bg-clip-text inline-block transition-opacity", className)}
      style={{
        backgroundImage:
          "linear-gradient(120deg, rgba(124,156,240,0) 40%, rgba(124,156,240,0.9) 50%, rgba(124,156,240,0) 60%)",
        backgroundSize: "200% 100%",
        WebkitBackgroundClip: "text",
        backgroundPosition: isShining ? "-100%" : "110%",
        transition: isShining ? `background-position ${speed}s linear` : "none",
      }}
    >
      {content}
    </div>
  );
};

const DecryptText = ({
  text,
  className,
  isDecrypting = false,
  duration = 0.1,
}: {
  text: string;
  className?: string;
  isDecrypting?: boolean;
  duration?: number;
}) => {
  const [displayText, setDisplayText] = useState(text);
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+[]{}|;:,.<>?/";

  useEffect(() => {
    if (!isDecrypting) {
      setDisplayText(text);
      return;
    }

    let iteration = 0;

    const interval: NodeJS.Timeout = setInterval(() => {
      setDisplayText((prev) =>
        prev
          .split("")
          .map((char, index) => {
            if (char === " ") return " ";
            if (index < iteration) return text[index];
            return characters[Math.floor(Math.random() * characters.length)];
          })
          .join("")
      );

      iteration += 1 / 3;

      if (iteration >= text.length) {
        clearInterval(interval);
        setDisplayText(text);
      }
    }, (duration * 1000) / text.length);

    return () => {
      clearInterval(interval);
    };
  }, [isDecrypting, text, duration]);

  return <span className={className}>{displayText}</span>;
};

const AnimatedLink = ({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const textContent = typeof children === "string" ? children : "";

  return (
    <motion.div
      className="relative overflow-hidden"
      whileHover="hover"
      initial="initial"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        className="absolute inset-0 bg-white/[0.05] z-0"
        variants={{ initial: { x: "-100%" }, hover: { x: 0 } }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      />
      <Link href={href} className={cn("z-10 relative h-full", className)}>
        {typeof children === "string" ? (
          <ShinyText isShining={isHovered} speed={1.2}>
            <DecryptText text={textContent} isDecrypting={isHovered} />
          </ShinyText>
        ) : (
          children
        )}
      </Link>
    </motion.div>
  );
};

const AnimatedIconLink = ({
  href,
  icon,
  ariaLabel,
  className,
}: {
  href: string;
  icon: React.ReactNode;
  ariaLabel: string;
  className?: string;
}) => {
  return (
    <motion.div
      className={cn("relative overflow-hidden", className)}
      whileHover="hover"
      initial="initial"
    >
      <motion.div
        className="absolute inset-0 bg-white/[0.05] z-0"
        variants={{ initial: { x: "-100%" }, hover: { x: 0 } }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      />
      <Link
        href={href}
        aria-label={ariaLabel}
        className="text-[#8B92A3] hover:text-[#F2F4F8] transition-colors z-10 relative"
      >
        {icon}
      </Link>
    </motion.div>
  );
};

const CanvasRevealEffect = ({
  animationSpeed = 3,
  opacities = [0.08, 0.08, 0.08, 0.12, 0.12, 0.12, 0.18, 0.18, 0.18, 0.28],
  colors = [
    [42, 74, 140],
    [74, 111, 191],
  ],
  containerClassName,
  dotSize,
}: {
  animationSpeed?: number;
  opacities?: number[];
  colors?: number[][];
  containerClassName?: string;
  dotSize?: number;
  showGradient?: boolean;
}) => {
  const [mousePosition, setMousePosition] = useState<[number, number]>([0, 0]);
  const [lastMousePosition, setLastMousePosition] = useState<[number, number]>([0, 0]);
  const [isHovering, setIsHovering] = useState(false);
  const [hoverIntensity, setHoverIntensity] = useState(0);

  useEffect(() => {
    let requestId: number;
    const start = hoverIntensity;
    const target = isHovering ? 1 : 0;
    const duration = 0.5;
    const startTime = performance.now();

    const updateFrame = () => {
      const elapsed = (performance.now() - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      setHoverIntensity(start + (target - start) * progress);
      if (progress < 1) requestId = requestAnimationFrame(updateFrame);
    };
    requestId = requestAnimationFrame(updateFrame);

    if (!isHovering) setLastMousePosition(mousePosition);

    return () => cancelAnimationFrame(requestId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHovering]);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      setMousePosition([x, y]);
      if (!isHovering) setLastMousePosition([x, y]);
    },
    [isHovering]
  );

  const hoverIntensityValue = hoverIntensity.toFixed(4);
  const currentMousePosition = isHovering ? mousePosition : lastMousePosition;

  return (
    <div
      className={cn("h-full relative w-full", containerClassName)}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="h-full w-full">
        <DotMatrix
          colors={colors}
          dotSize={dotSize ?? 3}
          opacities={opacities}
          shader={`
              float animation_speed_factor = ${animationSpeed.toFixed(1)};
              float intro_offset = distance(u_resolution / 2.0 / u_total_size, st2) * 0.01 + (random(st2) * 0.15);
              opacity *= step(intro_offset, u_time * animation_speed_factor);
              opacity *= clamp((1.0 - step(intro_offset + 0.1, u_time * animation_speed_factor)) * 1.1, 1.0, 1.1);

              float hoverFactor = ${hoverIntensityValue};
              vec2 mousePos = vec2(${currentMousePosition[0].toFixed(4)}, ${currentMousePosition[1].toFixed(4)}) * u_resolution / u_total_size;
              float distToMouse = distance(st2, mousePos);
              float hoverRadius = 120.0;
              if (distToMouse < hoverRadius) {
                float colorFactor = smoothstep(hoverRadius, 0.0, distToMouse) * hoverFactor;
                vec3 hoverColor = u_colors[int(mod(random(st2) * 10.0, 6.0))];
                hoverColor = clamp(hoverColor * 1.3, vec3(0.0), vec3(1.0));
                color = mix(color, hoverColor, colorFactor * 0.6);
                opacity = mix(opacity, min(opacity * 1.3, 1.0), colorFactor * 0.5);
              }
            `}
          center={["x", "y"]}
        />
      </div>
      {/* No gradient overlay here — the Auralis background behind the footer
          already provides the fade; an extra gradient would just double up. */}
    </div>
  );
};

const ShaderMaterial = ({
  source,
  uniforms,
  maxFps = 60,
}: {
  source: string;
  hovered?: boolean;
  maxFps?: number;
  uniforms: Uniforms;
}) => {
  const { size } = useThree();
  const ref = useRef<THREE.Mesh>(null);
  let lastFrameTime = 0;

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const timestamp = clock.getElapsedTime();
    if (timestamp - lastFrameTime < 1 / maxFps) return;
    lastFrameTime = timestamp;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const material = (ref.current.material as any);
    material.uniforms.u_time.value = timestamp;
  });

  const getUniforms = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const preparedUniforms: any = {};
    for (const uniformName in uniforms) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const uniform: any = uniforms[uniformName];
      switch (uniform.type) {
        case "uniform1f":
          preparedUniforms[uniformName] = { value: uniform.value, type: "1f" };
          break;
        case "uniform3f":
          preparedUniforms[uniformName] = {
            value: new THREE.Vector3().fromArray(uniform.value),
            type: "3f",
          };
          break;
        case "uniform1fv":
          preparedUniforms[uniformName] = { value: uniform.value, type: "1fv" };
          break;
        case "uniform3fv":
          preparedUniforms[uniformName] = {
            value: uniform.value.map((v: number[]) => new THREE.Vector3().fromArray(v)),
            type: "3fv",
          };
          break;
        case "uniform2f":
          preparedUniforms[uniformName] = {
            value: new THREE.Vector2().fromArray(uniform.value),
            type: "2f",
          };
          break;
        default:
          console.error(`Invalid uniform type for '${uniformName}'.`);
          break;
      }
    }
    preparedUniforms["u_time"] = { value: 0, type: "1f" };
    preparedUniforms["u_resolution"] = {
      value: new THREE.Vector2(size.width * 2, size.height * 2),
    };
    return preparedUniforms;
  };

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: `
      precision mediump float;
      in vec2 coordinates;
      uniform vec2 u_resolution;
      out vec2 fragCoord;
      void main(){
        float x = position.x;
        float y = position.y;
        gl_Position = vec4(x, y, 0.0, 1.0);
        fragCoord = (position.xy + vec2(1.0)) * 0.5 * u_resolution;
        fragCoord.y = u_resolution.y - fragCoord.y;
      }
      `,
      fragmentShader: source,
      uniforms: getUniforms(),
      glslVersion: THREE.GLSL3,
      blending: THREE.CustomBlending,
      blendSrc: THREE.SrcAlphaFactor,
      blendDst: THREE.OneFactor,
      transparent: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.width, size.height, source]);

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <mesh ref={ref as any}>
      <planeGeometry args={[2, 2]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
};

const Shader: React.FC<ShaderProps> = ({ source, uniforms, maxFps = 60 }) => {
  return (
    <Canvas className="absolute inset-0 h-full w-full" gl={{ alpha: true }}>
      <ShaderMaterial source={source} uniforms={uniforms} maxFps={maxFps} />
    </Canvas>
  );
};

export function Footer({
  tagline = "OpRepo connects developers with open-source repositories they'll love contributing to.",
  socialLinks = [
    { href: "https://github.com/eniyos", icon: <FaGithub size={18} />, ariaLabel: "GitHub" },
    { href: "https://linkedin.com/in/eniyos", icon: <FaLinkedinIn size={18} />, ariaLabel: "LinkedIn" },
  ],
  productLinks = [
    { label: "Discover", href: "/" },
    { label: "Recommend", href: "/recommend" },
    { label: "History", href: "/history" },
    { label: "Add Repo", href: "/ingest" },
  ],
  projectLinks = [
    { label: "Source code", href: "https://github.com/eniyos/oprepo" },
    { label: "How it\u2019s built", href: "/architecture" },
    { label: "Tech stack", href: "/architecture" },
  ],
  connectLinks = [
    { label: "GitHub", href: "https://github.com/eniyos" },
    { label: "LinkedIn", href: "https://linkedin.com/in/eniyos" },
    { label: "Email", href: "mailto:hi@oprepo.dev" },
  ],
  companyDescription,
}: FooterProps) {
  const description = companyDescription ?? tagline;

  return (
    // relative, not fixed — the footer now sits in normal page flow at the
    // end of the scroll, letting the Auralis canvas behind it show through
    <footer className="relative w-full bg-transparent text-[#F2F4F8]">
      <div className="w-full pt-10 min-[1250px]:pt-14">
        <div className="grid grid-cols-1 min-[1250px]:grid-cols-12 border-t border-white/[0.12]">
          {/* social icons */}
          <div className="flex border-b border-white/[0.12] min-[1250px]:hidden">
            {socialLinks.map((link, i) => (
              <AnimatedIconLink
                key={link.ariaLabel}
                href={link.href}
                icon={link.icon}
                ariaLabel={link.ariaLabel}
                className={cn(
                  "flex-1 py-5 flex items-center justify-center",
                  i < socialLinks.length - 1 ? "border-r border-white/[0.12]" : ""
                )}
              />
            ))}
          </div>
          {socialLinks.map((link) => (
            <AnimatedIconLink
              key={link.ariaLabel}
              href={link.href}
              icon={link.icon}
              ariaLabel={link.ariaLabel}
              className="hidden min-[1250px]:flex min-[1250px]:col-span-1 border-r border-b border-white/[0.12] py-7 items-center justify-center"
            />
          ))}

          {/* quiet Auralis-tinted accent panel, replaces the old competing
              blue/purple canvas — same mechanism, tuned to sit in the
              background instead of on top of it */}
          <div className="h-24 min-[1250px]:h-32 min-[1250px]:col-span-6 border-b border-white/[0.12] min-[1250px]:border-r relative overflow-hidden">
            <CanvasRevealEffect containerClassName="absolute inset-0 pointer-events-none" />
          </div>

          {/* description */}
          <div className="px-4 py-6 min-[1250px]:py-7 min-[1250px]:col-span-4 border-b border-white/[0.12] text-xs text-[#8B92A3] leading-relaxed flex items-center">
            <p>{description}</p>
          </div>
        </div>

        {/* link columns */}
        <div className="grid grid-cols-1 min-[1250px]:grid-cols-3 border-b border-white/[0.12]">
          <div className="px-4 py-6 border-b min-[1250px]:border-b-0 min-[1250px]:border-r border-white/[0.12]">
            <p className="text-xs text-[#F2F4F8] mb-3">Product</p>
            <div className="flex flex-col gap-2">
              {productLinks.map((link) => (
                <AnimatedLink key={link.label} href={link.href} className="text-xs text-[#8B92A3] hover:text-[#F2F4F8] w-fit">
                  {link.label}
                </AnimatedLink>
              ))}
            </div>
          </div>
          <div className="px-4 py-6 border-b min-[1250px]:border-b-0 min-[1250px]:border-r border-white/[0.12]">
            <p className="text-xs text-[#F2F4F8] mb-3">Project</p>
            <div className="flex flex-col gap-2">
              {projectLinks.map((link) => (
                <AnimatedLink key={link.label} href={link.href} className="text-xs text-[#8B92A3] hover:text-[#F2F4F8] w-fit">
                  {link.label}
                </AnimatedLink>
              ))}
            </div>
          </div>
          <div className="px-4 py-6">
            <p className="text-xs text-[#F2F4F8] mb-3">Connect</p>
            <div className="flex flex-col gap-2">
              {connectLinks.map((link) => (
                <AnimatedLink key={link.label} href={link.href} className="text-xs text-[#8B92A3] hover:text-[#F2F4F8] w-fit">
                  {link.label}
                </AnimatedLink>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

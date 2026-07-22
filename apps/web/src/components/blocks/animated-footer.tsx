"use client";

import Link from "next/link";
import { FaGithub, FaXTwitter } from "react-icons/fa6";

const COLUMNS = [
  { title: "Product", links: [{ label: "Discover", href: "/" }, { label: "Recommend", href: "/recommend" }, { label: "History", href: "/history" }, { label: "Add Repo", href: "/ingest" }] },
  { title: "Company", links: [{ label: "GitHub", href: "https://github.com/eniyos/oprepo" }, { label: "About", href: "/" }] },
  { title: "Resources", links: [{ label: "Documentation", href: "#" }, { label: "Contact", href: "#" }] },
];

export function AnimatedFooter() {
  return (
    <footer style={{ borderTop: '1px solid rgba(255,255,255,0.12)', background: 'transparent' }}>
      <div style={{ maxWidth: '48rem', margin: '0 auto', padding: '4rem 1rem 3rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '2rem' }}>
          {/* Brand */}
          <div>
            <span style={{ fontSize: '0.8125rem', color: '#F2F4F8', fontWeight: 400, letterSpacing: '0.01em' }}>OpRepo</span>
            <p style={{ marginTop: '0.625rem', fontSize: '0.75rem', color: '#8B92A3', maxWidth: '14rem', lineHeight: 1.5 }}>
              Connects developers with open-source repositories they&apos;ll love contributing to.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              {[{ href: "https://github.com/eniyos/oprepo", icon: <FaGithub size={14} />, label: "GitHub" },
                { href: "https://x.com", icon: <FaXTwitter size={14} />, label: "X" }].map(({ href, icon, label }) => (
                <Link key={label} href={href} aria-label={label}
                  style={{ color: '#8B92A3', transition: 'color 600ms ease-out' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#F2F4F8'}
                  onMouseLeave={e => e.currentTarget.style.color = '#8B92A3'}>{icon}</Link>
              ))}
            </div>
          </div>

          {COLUMNS.map(col => (
            <div key={col.title}>
              <h3 style={{ fontSize: '0.75rem', color: '#F2F4F8', fontWeight: 400, letterSpacing: '0.01em', marginBottom: '0.75rem' }}>{col.title}</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {col.links.map(link => (
                  <li key={link.label}>
                    <Link href={link.href}
                      style={{ fontSize: '0.75rem', color: '#8B92A3', textDecoration: 'none', transition: 'color 600ms ease-out' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#F2F4F8'}
                      onMouseLeave={e => e.currentTarget.style.color = '#8B92A3'}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ fontSize: '0.6875rem', color: '#8B92A3', textAlign: 'center', margin: 0 }}>
            OpRepo &copy; {new Date().getFullYear()}. Find your next open-source contribution.
          </p>
        </div>
      </div>
    </footer>
  );
}

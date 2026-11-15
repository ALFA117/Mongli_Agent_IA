import { NavLink, Link } from "react-router-dom";
import { Activity, Wallet, BarChart3, FlaskConical } from "lucide-react";

export const NAV = [
  { to: "/",          label: "Live feed",       short: "Feed",      Icon: Activity  },
  { to: "/wallet",    label: "Wallet explorer", short: "Wallets",   Icon: Wallet    },
  { to: "/analytics", label: "Analytics",       short: "Analytics", Icon: BarChart3 },
];

export function BrandMark({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect x="1" y="1" width="30" height="30" rx="4" fill="rgb(var(--ink))" />
      <path d="M18.5 5 9.5 18h6l-1.5 9 9-13h-6z" fill="#3FBF8C" />
    </svg>
  );
}

function StatusPill({ live }) {
  return live ? (
    <span className="inline-flex items-center gap-2 rounded-sm border border-accent bg-accent-soft px-2.5 py-1 text-[13px] font-medium text-accent-ink">
      <span className="h-2 w-2 rounded-full bg-accent animate-pulse2" aria-hidden="true" />
      Live · Mantle
    </span>
  ) : (
    <span
      className="inline-flex items-center gap-1.5 rounded-sm border border-ink bg-surface px-2.5 py-1 text-[13px] font-medium text-ink"
      title="Sample signals: the contract is not deployed yet"
    >
      <FlaskConical size={14} strokeWidth={2} aria-hidden="true" />
      Demo data
    </span>
  );
}

export default function Navbar({ live = false }) {
  return (
    <header className="sticky top-0 z-40 border-b border-ink bg-surface">
      <div className="max-w-6xl mx-auto h-16 px-4 sm:px-6 flex items-center gap-6">
        <Link to="/" className="flex items-center gap-3 shrink-0 rounded-sm" aria-label="Mongli Agent IA, home">
          <BrandMark />
          <span className="flex flex-col leading-tight">
            <span className="font-display text-[18px] font-semibold text-ink">Mongli Agent IA</span>
            <span className="text-[12px] text-muted">Signal Intelligence</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-stretch h-16 gap-1" aria-label="Main">
          {NAV.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `relative flex items-center px-3 text-[15px] transition-colors ${
                  isActive
                    ? "text-ink font-medium after:absolute after:inset-x-3 after:bottom-0 after:h-[3px] after:bg-accent"
                    : "text-ink-2 hover:text-ink"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto">
          <StatusPill live={live} />
        </div>
      </div>
    </header>
  );
}

// Phone navigation: one tap to any section, always visible.
export function TabBar() {
  return (
    <nav
      className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-ink bg-surface"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Sections"
    >
      <ul className="grid grid-cols-3">
        {NAV.map(({ to, short, Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex h-16 flex-col items-center justify-center gap-1 text-[12px] ${
                  isActive ? "text-ink font-semibold bg-accent-soft" : "text-ink-2"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2.25 : 1.75}
                    aria-hidden="true"
                    className={isActive ? "text-accent" : ""}
                  />
                  {short}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

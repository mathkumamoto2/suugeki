"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  ["/dashboard", "ホーム", "◆"],
  ["/learn", "学習", "∫"],
  ["/history", "履歴", "◷"],
];

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login";

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/dashboard" className="brand">
          <div className="logo-mark">∫</div>
          <div>
            <div className="brand-title">数隙</div>
            <div className="brand-sub">Sukima Flow</div>
          </div>
        </Link>

        <nav className="nav">
          {links.map(([href, label, icon]) => (
            <Link href={href} key={href} className={pathname === href ? "nav-active" : ""}>
              <span className="nav-icon">{icon}</span>
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-note">
          <strong>Learning Flow</strong>
          <p>今日の1問から、解説・再現・診断・復習へ進む。</p>
          <Link href="/system" className="dev-link">System</Link>
        </div>
      </aside>

      <div className="main">
        <main className="shell">{children}</main>
      </div>
    </div>
  );
}

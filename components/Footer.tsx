import Link from "next/link";

const footerLinks = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/insights", label: "Insights" },
  { href: "/platform", label: "Platform" },
  { href: "/login", label: "Login" },
  { href: "/team", label: "Developer" }
];

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <p className="text-base font-medium text-slate-700">© 2025 ShikshaNetra. All rights reserved.</p>
          <p className="text-xs">
            Built for HCL GUVI – UpSkill India Challenge, Techfest IIT Bombay.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs sm:justify-end">
          {footerLinks.map((link, idx) => (
            <span key={link.href} className="flex items-center gap-3">
              <Link
                href={link.href}
                className="transition hover:text-primary-600"
              >
                {link.label}
              </Link>
              {idx < footerLinks.length - 1 && (
                <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:inline-block" />
              )}
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}



"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useToast } from "@/components/ToastContext";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    const checkLogin = () => {
      const token = localStorage.getItem("shikshanetra_token");
      const loggedIn = localStorage.getItem("shikshanetra_logged_in") === "true";
      setIsLoggedIn(!!token || loggedIn);
    };
    checkLogin();
    window.addEventListener("storage", checkLogin);
    const interval = setInterval(checkLogin, 1000);
    return () => {
      window.removeEventListener("storage", checkLogin);
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("shikshanetra_token");
    localStorage.removeItem("shikshanetra_user");
    localStorage.removeItem("shikshanetra_logged_in");
    document.cookie = "shikshanetra_logged_in=; path=/; max-age=0";
    showToast("Logged out successfully");
    router.push("/");
  };

  const authenticatedNavLinks = [
    { href: "/upload", label: "Upload" },
    { href: "/", label: "Home" },
    { href: "/history", label: "History" },
    { href: "/insights", label: "Insights" },
  ];

  return (
    <header className="sticky top-0 z-40">
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:py-3.5">
          {/* Logo - Always visible, always links to home page */}
          <div className="flex items-center gap-2">
            <Link 
              href="/" 
              className="flex items-center gap-2"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-600 text-sm font-bold text-white shadow-sm">
                SN
              </div>
              <span className="text-lg font-semibold tracking-tight text-slate-900">
                <span className="text-primary-600">Shiksha</span>Netra
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-6 md:flex">
            {isLoggedIn ? (
              <>
                {authenticatedNavLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-sm font-medium transition ${
                      pathname === link.href
                        ? "text-primary-700"
                        : "text-slate-700 hover:text-primary-700"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                <button
                  onClick={handleLogout}
                  className="rounded-lg border border-rose-300 bg-white px-4 py-1.5 text-sm font-medium text-rose-700 transition hover:bg-rose-50"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="btn-primary text-sm px-4 py-1.5"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setOpen((o) => !o)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 md:hidden"
            aria-label="Toggle navigation"
          >
            <span className="sr-only">Open menu</span>
            <div className="space-y-1.5">
              <span className="block h-0.5 w-5 rounded-full bg-slate-700" />
              <span className="block h-0.5 w-5 rounded-full bg-slate-700" />
              <span className="block h-0.5 w-5 rounded-full bg-slate-700" />
            </div>
          </button>
        </div>

        {/* Mobile Menu */}
        {open && (
          <div className="border-t border-slate-200 bg-white px-4 pb-4 pt-2 md:hidden">
            {isLoggedIn ? (
              <div className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                {authenticatedNavLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={`rounded-md px-2 py-2 transition ${
                      pathname === link.href
                        ? "bg-primary-50 text-primary-700"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                <button
                  onClick={() => {
                    handleLogout();
                    setOpen(false);
                  }}
                  className="rounded-md border border-rose-300 bg-white px-2 py-2 text-left text-rose-700 transition hover:bg-rose-50"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="btn-primary w-full text-sm"
                >
                  Login
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}

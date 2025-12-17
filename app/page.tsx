"use client";

import Link from "next/link";
import { Card } from "@/components/Card";
import { useEffect, useState } from "react";

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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

  const getStartedLink = isLoggedIn ? "/upload" : "/signup";

  return (
    <div className="mx-auto max-w-6xl px-4 pb-12 pt-8 sm:pt-10">
      {/* Hero */}
      <section className="grid gap-10 md:grid-cols-2 md:items-center">
        <div className="space-y-6">
          <div className="inline-flex flex-wrap items-center gap-2">
            <span className="badge-pill">AI Mentor Evaluation Platform</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Transform Teaching Quality with{" "}
            <span className="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
              AI-Powered Evaluation
            </span>
          </h1>
          <p className="max-w-xl text-base text-slate-600 sm:text-lg">
            Analyze recorded teaching sessions using multimodal AI and deliver fair, actionable
            feedback to mentors and institutions. Elevate teaching standards with data-driven insights.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href={getStartedLink} className="btn-primary text-sm sm:text-base px-6 py-3">
              Get Started Free
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="text-emerald-600">✓</span>
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-emerald-600">✓</span>
              <span>Instant access</span>
            </div>
          </div>
        </div>
        <div className="md:pl-4">
          <Card className="relative overflow-hidden border-slate-200 bg-gradient-to-br from-white via-primary-50/50 to-accent-50/50 p-6 shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(20,184,166,0.1),transparent_75%)]" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-300/30 to-transparent" />
            
            <div className="relative">
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-1.5 mb-2">
                  <div className="h-1 w-6 bg-gradient-to-r from-primary-400 to-accent-400 rounded-full" />
                  <h3 className="text-lg font-bold text-slate-900">
                    How It Works
                  </h3>
                  <div className="h-1 w-6 bg-gradient-to-l from-primary-400 to-accent-400 rounded-full" />
                </div>
                <p className="text-xs text-slate-600 font-medium">
                  Three data streams analyzed by AI for comprehensive evaluation
                </p>
              </div>

              {/* Enhanced Compact Flow Design */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { icon: "🎥", label: "Video", desc: "Visual cues", color: "primary", gradient: "from-primary-400 to-primary-600", bg: "from-primary-50 to-primary-100" },
                  { icon: "🎤", label: "Audio", desc: "Speech clarity", color: "accent", gradient: "from-accent-400 to-accent-600", bg: "from-accent-50 to-accent-100" },
                  { icon: "📝", label: "Text", desc: "Content depth", color: "slate", gradient: "from-slate-400 to-slate-600", bg: "from-slate-50 to-slate-100" }
                ].map((item) => (
                  <div 
                    key={item.label} 
                    className="group relative flex flex-col items-center rounded-xl bg-white/95 backdrop-blur-sm p-4 shadow-lg border-2 border-slate-200/60 transition-all hover:shadow-2xl hover:scale-110 hover:-translate-y-1.5 hover:border-primary-300/80"
                  >
                    <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${item.bg} opacity-0 group-hover:opacity-100 transition-opacity`} />
                    <div className={`relative flex h-14 w-14 items-center justify-center rounded-xl mb-3 transition-all group-hover:scale-125 group-hover:rotate-6 group-hover:shadow-xl ${
                      item.color === "primary" ? "bg-gradient-to-br from-primary-100 to-primary-200 ring-2 ring-primary-200/50" :
                      item.color === "accent" ? "bg-gradient-to-br from-accent-100 to-accent-200 ring-2 ring-accent-200/50" :
                      "bg-gradient-to-br from-slate-100 to-slate-200 ring-2 ring-slate-200/50"
                    }`}>
                      <span className="text-2xl relative z-10">{item.icon}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 relative z-10">{item.label}</p>
                    <p className="text-[10px] text-slate-500 mt-1 font-semibold relative z-10">{item.desc}</p>
                  </div>
                ))}
              </div>

              {/* Enhanced Processing Center */}
              <div className="relative flex items-center justify-center mb-5">
                <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-primary-300/70 via-accent-300/70 to-transparent -translate-y-1/2" />
                <div className="relative z-10">
                  <div className="absolute -inset-3 bg-gradient-to-r from-primary-400/50 via-accent-400/50 to-primary-400/50 rounded-full blur-xl animate-pulse" />
                  <div className="absolute -inset-1.5 bg-gradient-to-r from-primary-300/30 to-accent-300/30 rounded-full blur-md" />
                  <div className="relative flex items-center justify-center rounded-full bg-gradient-to-br from-primary-500 via-accent-500 to-primary-600 p-3.5 shadow-2xl border-4 border-white ring-4 ring-primary-200/30">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-xs font-bold tracking-widest">AI</span>
                      <span className="text-white text-sm animate-pulse">⚡</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Output */}
              <div className="relative rounded-xl bg-gradient-to-r from-emerald-50 via-primary-50 to-accent-50 px-6 py-4 text-center border-2 border-emerald-200/60 shadow-lg backdrop-blur-sm transition-all hover:shadow-xl hover:border-emerald-300/80 hover:scale-105">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-100/30 to-primary-100/30 opacity-0 hover:opacity-100 transition-opacity" />
                <div className="relative flex items-center justify-center gap-3">
                  <span className="text-xl animate-pulse">✨</span>
                  <p className="text-xs font-bold text-slate-800">
                    Comprehensive evaluation & feedback
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Why ShikshaNetra */}
      <section className="mt-16 space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Why ShikshaNetra?</h2>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            A focused evaluation layer purpose-built for teaching and mentoring workflows.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Multimodal Evaluation",
              description: "Video, audio, and transcript combined into one composite mentor score.",
              icon: "🎥"
            },
            {
              title: "AI-generated Feedback",
              description: "Human-readable strengths and suggestions for each recorded session.",
              icon: "✨"
            },
            {
              title: "Fair Scoring",
              description: "Signals tuned to reduce accent and delivery-style bias across cohorts.",
              icon: "⚖️"
            },
            {
              title: "Dashboard-ready Insights",
              description: "Visual breakdown of performance across batches, subjects, and time.",
              icon: "📊"
            }
          ].map((f) => (
            <Card key={f.title} className="h-full p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-lg">
                <span aria-hidden>{f.icon}</span>
              </div>
              <h3 className="mt-3 text-sm font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-xs text-slate-600 sm:text-sm">{f.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mt-16">
        <Card className="flex flex-col items-start justify-between gap-4 bg-gradient-to-r from-primary-50 via-slate-50 to-accent-50 p-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Ready to Transform Teaching Evaluation?
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Join institutions using AI to improve mentor performance and student outcomes.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={getStartedLink} className="btn-primary">
              Get Started Free
            </Link>
          </div>
        </Card>
      </section>
    </div>
  );
}



import React from "react";

type StructuredFeedbackProps = {
  strengths: string[];
  improvementAreas: string[];
  actionableSuggestion: string;
  title?: string;
};

export function StructuredFeedback({
  strengths,
  improvementAreas,
  actionableSuggestion,
  title = "Feedback Summary",
}: StructuredFeedbackProps) {
  return (
    <div className="w-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-6 text-lg font-semibold text-slate-900">{title}</h3>

      <div className="space-y-6">
        {/* Strengths Section */}
        {strengths && strengths.length > 0 && (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                <svg
                  className="h-5 w-5 text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h4 className="text-base font-semibold text-slate-900">Strengths</h4>
            </div>
            <ul className="space-y-2.5 pl-10">
              {strengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="mt-1.5 flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-emerald-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                  <span className="text-sm leading-relaxed text-slate-700">
                    {strength}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Improvement Areas Section */}
        {improvementAreas && improvementAreas.length > 0 && (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
                <svg
                  className="h-5 w-5 text-amber-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h4 className="text-base font-semibold text-slate-900">
                Areas for Improvement
              </h4>
            </div>
            <ul className="space-y-2.5 pl-10">
              {improvementAreas.map((area, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="mt-1.5 flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-amber-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </span>
                  <span className="text-sm leading-relaxed text-slate-700">
                    {area}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actionable Suggestion Section */}
        {actionableSuggestion && (
          <div className="rounded-lg border-2 border-primary-200 bg-gradient-to-br from-primary-50 to-accent-50/30 p-5">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100">
                <svg
                  className="h-5 w-5 text-primary-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h4 className="text-base font-semibold text-slate-900">
                Recommended Action
              </h4>
            </div>
            <div className="flex items-start gap-3 pl-10">
              <span className="mt-1.5 flex-shrink-0">
                <svg
                  className="h-5 w-5 text-primary-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <p className="text-sm font-medium leading-relaxed text-slate-800">
                {actionableSuggestion}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


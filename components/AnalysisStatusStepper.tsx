import React from "react";

export type StatusValue = "done" | "pending";

export type AnalysisStatus = {
  audio: StatusValue;
  video: StatusValue;
  text: StatusValue;
  coach: StatusValue;
};

type AnalysisStatusStepperProps = {
  status: AnalysisStatus;
};

type Stage = {
  key: keyof AnalysisStatus;
  label: string;
  order: number;
};

const stages: Stage[] = [
  { key: "audio", label: "Audio", order: 0 },
  { key: "video", label: "Video", order: 1 },
  { key: "text", label: "Text", order: 2 },
  { key: "coach", label: "Coach Feedback", order: 3 },
];

export function AnalysisStatusStepper({ status }: AnalysisStatusStepperProps) {
  // Find the first pending stage (active stage)
  const activeStageIndex = stages.findIndex((stage) => status[stage.key] === "pending");
  const activeOrder = activeStageIndex !== -1 ? stages[activeStageIndex].order : -1;

  return (
    <div className="relative flex flex-col p-6">
      {stages.map((stage, index) => {
        const isDone = status[stage.key] === "done";
        const isActive = stage.order === activeOrder;
        const isPending = status[stage.key] === "pending" && !isActive;
        const nextStage = stages[index + 1];
        const nextIsDone = nextStage ? status[nextStage.key] === "done" : false;

        return (
          <div key={stage.key} className="relative flex items-start gap-4">
            {/* Connector Line */}
            {index < stages.length - 1 && (
              <div className="absolute left-6 top-12 w-0.5 h-16 -z-0">
                <div
                  className={`h-full w-full transition-colors ${
                    isDone && nextIsDone
                      ? "bg-emerald-500"
                      : isDone
                      ? "bg-emerald-500"
                      : "bg-slate-200"
                  }`}
                />
              </div>
            )}

            {/* Status Circle */}
            <div className="relative z-10 flex-shrink-0">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all ${
                  isDone
                    ? "border-emerald-500 bg-emerald-50"
                    : isActive
                    ? "border-primary-500 bg-primary-50 ring-4 ring-primary-200"
                    : "border-slate-300 bg-slate-50"
                }`}
              >
                {isDone ? (
                  <svg
                    className="h-6 w-6 text-emerald-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : isActive ? (
                  <div className="h-4 w-4 rounded-full bg-primary-500 animate-pulse" />
                ) : (
                  <div className="h-4 w-4 rounded-full bg-slate-300" />
                )}
              </div>
            </div>

            {/* Stage Content */}
            <div
              className={`flex-1 pt-2 transition-colors ${
                isDone
                  ? "text-slate-900"
                  : isActive
                  ? "text-primary-700"
                  : "text-slate-400"
              }`}
            >
              <h3
                className={`text-base font-semibold ${
                  isActive ? "text-primary-700" : ""
                }`}
              >
                {stage.label}
              </h3>
              {isActive && (
                <p className="mt-1 text-sm text-primary-600">Processing...</p>
              )}
              {isDone && (
                <p className="mt-1 text-sm text-slate-600">Completed</p>
              )}
              {isPending && (
                <p className="mt-1 text-sm text-slate-400">Pending</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}


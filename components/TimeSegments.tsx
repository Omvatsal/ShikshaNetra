import React from "react";

export type TimeSegment = {
  startTime: number; // in seconds
  endTime: number; // in seconds
  label: string;
  type: "highlight" | "warning" | "issue";
  description?: string;
};

type TimeSegmentsProps = {
  segments: TimeSegment[];
  onSegmentClick?: (segment: TimeSegment) => void;
  videoRef?: React.RefObject<HTMLVideoElement>;
};

export function TimeSegments({
  segments,
  onSegmentClick,
  videoRef,
}: TimeSegmentsProps) {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getTypeStyles = (type: TimeSegment["type"]) => {
    switch (type) {
      case "highlight":
        return {
          bg: "bg-emerald-50",
          border: "border-emerald-200",
          text: "text-emerald-700",
          icon: "✓",
        };
      case "warning":
        return {
          bg: "bg-amber-50",
          border: "border-amber-200",
          text: "text-amber-700",
          icon: "⚠",
        };
      case "issue":
        return {
          bg: "bg-red-50",
          border: "border-red-200",
          text: "text-red-700",
          icon: "!",
        };
    }
  };

  const handleSegmentClick = (segment: TimeSegment) => {
    // Jump video to segment start time if video ref is provided
    if (videoRef?.current) {
      videoRef.current.currentTime = segment.startTime;
      videoRef.current.play();
    }
    
    // Call custom handler if provided
    if (onSegmentClick) {
      onSegmentClick(segment);
    }
  };

  if (!segments || segments.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center">
        <p className="text-sm text-slate-500">No time segments available</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {segments.map((segment, index) => {
        const styles = getTypeStyles(segment.type);
        const duration = segment.endTime - segment.startTime;

        return (
          <button
            key={index}
            onClick={() => handleSegmentClick(segment)}
            className={`w-full rounded-lg border-2 ${styles.border} ${styles.bg} p-4 text-left transition-all hover:shadow-md hover:scale-[1.02] ${
              videoRef ? "cursor-pointer" : "cursor-default"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-sm font-semibold ${styles.text}`}>
                    {styles.icon}
                  </span>
                  <span className={`text-sm font-semibold ${styles.text}`}>
                    {segment.label}
                  </span>
                </div>
                {segment.description && (
                  <p className="text-xs text-slate-600 mt-1">
                    {segment.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span className="font-mono font-medium">
                  {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
                </span>
                <span className="text-slate-400">•</span>
                <span>{Math.round(duration)}s</span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}


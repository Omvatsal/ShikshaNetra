import React from "react";

type MetricValues = {
  engagement: number;
  clarity: number;
  interaction: number;
};

type MetricsComparisonCardProps = {
  prev: MetricValues;
  curr: MetricValues;
  title?: string;
};

type ComparisonResult = {
  label: string;
  prevValue: number;
  currValue: number;
  difference: number;
  percentageChange: number;
  trend: "up" | "down" | "neutral";
};

export function MetricsComparisonCard({
  prev,
  curr,
  title = "Metrics Comparison",
}: MetricsComparisonCardProps) {
  const calculateComparison = (
    prevValue: number,
    currValue: number
  ): { difference: number; percentageChange: number; trend: "up" | "down" | "neutral" } => {
    const difference = currValue - prevValue;
    const percentageChange = prevValue !== 0 ? (difference / prevValue) * 100 : 0;
    
    let trend: "up" | "down" | "neutral";
    if (Math.abs(percentageChange) < 0.1) {
      // Consider changes less than 0.1% as neutral
      trend = "neutral";
    } else if (difference > 0) {
      trend = "up";
    } else {
      trend = "down";
    }

    return { difference, percentageChange, trend };
  };

  const metrics: ComparisonResult[] = [
    {
      label: "Engagement",
      prevValue: prev.engagement,
      currValue: curr.engagement,
      ...calculateComparison(prev.engagement, curr.engagement),
    },
    {
      label: "Clarity",
      prevValue: prev.clarity,
      currValue: curr.clarity,
      ...calculateComparison(prev.clarity, curr.clarity),
    },
    {
      label: "Interaction",
      prevValue: prev.interaction,
      currValue: curr.interaction,
      ...calculateComparison(prev.interaction, curr.interaction),
    },
  ];

  const getTrendIcon = (trend: "up" | "down" | "neutral") => {
    switch (trend) {
      case "up":
        return "↑";
      case "down":
        return "↓";
      case "neutral":
        return "→";
    }
  };

  const getTrendColor = (trend: "up" | "down" | "neutral") => {
    switch (trend) {
      case "up":
        return "text-emerald-600";
      case "down":
        return "text-red-600";
      case "neutral":
        return "text-slate-500";
    }
  };

  const getTrendBgColor = (trend: "up" | "down" | "neutral") => {
    switch (trend) {
      case "up":
        return "bg-emerald-50";
      case "down":
        return "bg-red-50";
      case "neutral":
        return "bg-slate-50";
    }
  };

  const formatPercentage = (value: number): string => {
    return `${Math.round(value)}%`;
  };

  const formatDifference = (percentageChange: number, trend: "up" | "down" | "neutral"): string => {
    if (trend === "neutral") {
      return "(0)";
    }
    const sign = percentageChange > 0 ? "+" : "";
    return `(${sign}${Math.abs(percentageChange).toFixed(1)}%)`;
  };

  return (
    <div className="w-full rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-slate-900">{title}</h3>
      
      <div className="space-y-3">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 px-4 py-3 transition-colors hover:bg-slate-50"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-700">
                {metric.label}:
              </span>
              <span className="text-base font-semibold text-slate-900">
                {formatPercentage(metric.currValue)}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <span
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${getTrendBgColor(
                  metric.trend
                )} ${getTrendColor(metric.trend)}`}
              >
                <span className="text-sm">{getTrendIcon(metric.trend)}</span>
                <span>{formatDifference(metric.percentageChange, metric.trend)}</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Optional: Show previous values in a subtle way */}
      <div className="mt-4 border-t border-slate-100 pt-3">
        <p className="text-xs text-slate-500">
          Previous: Engagement {formatPercentage(prev.engagement)}, Clarity{" "}
          {formatPercentage(prev.clarity)}, Interaction {formatPercentage(prev.interaction)}
        </p>
      </div>
    </div>
  );
}


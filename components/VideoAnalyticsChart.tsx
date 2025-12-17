"use client";

import React, { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export type VideoAnalyticsDataPoint = {
  time: number;
  engagement: number;
  clarity: number;
};

type VideoAnalyticsChartProps = {
  data: VideoAnalyticsDataPoint[];
  dropThreshold?: number; // Percentage drop to consider as a "drop" (default: 20%)
};

export function VideoAnalyticsChart({
  data,
  dropThreshold = 20,
}: VideoAnalyticsChartProps) {
  // Detect drop segments
  const dropMarkers = useMemo(() => {
    const markers: Array<{ time: number; metric: "engagement" | "clarity" }> = [];

    for (let i = 1; i < data.length; i++) {
      const prev = data[i - 1];
      const curr = data[i];

      // Check engagement drop
      if (prev.engagement > 0) {
        const engagementDrop = ((prev.engagement - curr.engagement) / prev.engagement) * 100;
        if (engagementDrop >= dropThreshold) {
          markers.push({ time: curr.time, metric: "engagement" });
        }
      }

      // Check clarity drop
      if (prev.clarity > 0) {
        const clarityDrop = ((prev.clarity - curr.clarity) / prev.clarity) * 100;
        if (clarityDrop >= dropThreshold) {
          markers.push({ time: curr.time, metric: "clarity" });
        }
      }
    }

    return markers;
  }, [data, dropThreshold]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Prepare chart data
  const chartData = useMemo(() => {
    const labels = data.map((point) => formatTime(point.time));
    const engagementData = data.map((point) => point.engagement);
    const clarityData = data.map((point) => point.clarity);

    // Create arrays for dynamic point styling
    const engagementPointRadius = data.map((point) =>
      dropMarkers.some(
        (m) => m.time === point.time && m.metric === "engagement"
      )
        ? 6
        : 3
    );
    const engagementPointBackgroundColor = data.map((point) =>
      dropMarkers.some(
        (m) => m.time === point.time && m.metric === "engagement"
      )
        ? "rgb(239, 68, 68)" // red-500
        : "rgb(59, 130, 246)" // blue-500
    );
    const engagementPointBorderColor = data.map((point) =>
      dropMarkers.some(
        (m) => m.time === point.time && m.metric === "engagement"
      )
        ? "rgb(239, 68, 68)" // red-500
        : "rgb(59, 130, 246)" // blue-500
    );
    const engagementPointBorderWidth = data.map((point) =>
      dropMarkers.some(
        (m) => m.time === point.time && m.metric === "engagement"
      )
        ? 3
        : 1
    );

    const clarityPointRadius = data.map((point) =>
      dropMarkers.some(
        (m) => m.time === point.time && m.metric === "clarity"
      )
        ? 6
        : 3
    );
    const clarityPointBackgroundColor = data.map((point) =>
      dropMarkers.some(
        (m) => m.time === point.time && m.metric === "clarity"
      )
        ? "rgb(239, 68, 68)" // red-500
        : "rgb(16, 185, 129)" // emerald-500
    );
    const clarityPointBorderColor = data.map((point) =>
      dropMarkers.some(
        (m) => m.time === point.time && m.metric === "clarity"
      )
        ? "rgb(239, 68, 68)" // red-500
        : "rgb(16, 185, 129)" // emerald-500
    );
    const clarityPointBorderWidth = data.map((point) =>
      dropMarkers.some(
        (m) => m.time === point.time && m.metric === "clarity"
      )
        ? 3
        : 1
    );

    // Create datasets with drop markers
    const engagementDataset = {
      label: "Engagement",
      data: engagementData,
      borderColor: "rgb(59, 130, 246)", // blue-500
      backgroundColor: "rgba(59, 130, 246, 0.1)",
      tension: 0.4,
      fill: true,
      pointRadius: engagementPointRadius,
      pointBackgroundColor: engagementPointBackgroundColor,
      pointBorderColor: engagementPointBorderColor,
      pointBorderWidth: engagementPointBorderWidth,
    };

    const clarityDataset = {
      label: "Clarity",
      data: clarityData,
      borderColor: "rgb(16, 185, 129)", // emerald-500
      backgroundColor: "rgba(16, 185, 129, 0.1)",
      tension: 0.4,
      fill: true,
      pointRadius: clarityPointRadius,
      pointBackgroundColor: clarityPointBackgroundColor,
      pointBorderColor: clarityPointBorderColor,
      pointBorderWidth: clarityPointBorderWidth,
    };

    return {
      labels,
      datasets: [engagementDataset, clarityDataset],
    };
  }, [data, dropMarkers]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
            family: "system-ui, sans-serif",
          },
        },
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        padding: 12,
        titleFont: {
          size: 13,
          weight: "600" as const,
        },
        bodyFont: {
          size: 12,
        },
        titleColor: "rgb(255, 255, 255)",
        bodyColor: "rgb(255, 255, 255)",
        borderColor: "rgba(148, 163, 184, 0.3)",
        borderWidth: 1,
        callbacks: {
          title: (tooltipItems: any[]) => {
            const index = tooltipItems[0].dataIndex;
            const point = data[index];
            return `Time: ${formatTime(point.time)}`;
          },
          label: (context: any) => {
            const label = context.dataset.label || "";
            const value = context.parsed.y;
            const index = context.dataIndex;
            const point = data[index];
            const isDrop = dropMarkers.some(
              (m) => m.time === point.time && m.metric === label.toLowerCase()
            );
            return `${label}: ${value.toFixed(1)}${isDrop ? " ⚠️ Drop detected" : ""}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
          color: "rgb(100, 116, 139)",
        },
      },
      y: {
        beginAtZero: true,
        max: 10,
        grid: {
          color: "rgba(148, 163, 184, 0.1)",
        },
        ticks: {
          font: {
            size: 11,
          },
          color: "rgb(100, 116, 139)",
          stepSize: 2,
        },
      },
    },
  };

  if (!data || data.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
        <p className="text-sm text-slate-500">No data available</p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">
          Video Analytics Timeline
        </h3>
        {dropMarkers.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="flex h-3 w-3 items-center justify-center rounded-full bg-red-500"></span>
            <span>{dropMarkers.length} drop{dropMarkers.length !== 1 ? "s" : ""} detected</span>
          </div>
        )}
      </div>
      <div className="h-96">
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}


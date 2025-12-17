"use client";

import React, { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

type TimelineDataPoint = {
  date: string;
  clarity: number;
  engagement: number;
  confidence: number;
};

type TimelineSummaryProps = {
  data: TimelineDataPoint[];
};

export function TimelineSummary({ data }: TimelineSummaryProps) {
  const chartData = useMemo(() => {
    const sortedData = [...data].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const labels = sortedData.map((point) => {
      const date = new Date(point.date);
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    });

    return {
      labels,
      datasets: [
        {
          label: "Clarity",
          data: sortedData.map((point) => point.clarity),
          borderColor: "rgb(59, 130, 246)",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          tension: 0.4,
          fill: true,
        },
        {
          label: "Engagement",
          data: sortedData.map((point) => point.engagement),
          borderColor: "rgb(16, 185, 129)",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          tension: 0.4,
          fill: true,
        },
        {
          label: "Confidence",
          data: sortedData.map((point) => point.confidence),
          borderColor: "rgb(245, 158, 11)",
          backgroundColor: "rgba(245, 158, 11, 0.1)",
          tension: 0.4,
          fill: true,
        },
      ],
    };
  }, [data]);

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
            size: 11,
          },
        },
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        padding: 10,
        titleFont: {
          size: 12,
        },
        bodyFont: {
          size: 11,
        },
        titleColor: "rgb(255, 255, 255)",
        bodyColor: "rgb(255, 255, 255)",
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 10,
          },
          color: "rgb(100, 116, 139)",
        },
      },
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: "rgba(148, 163, 184, 0.1)",
        },
        ticks: {
          font: {
            size: 10,
          },
          color: "rgb(100, 116, 139)",
          stepSize: 20,
        },
      },
    },
  };

  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
        <p className="text-sm text-slate-500">No timeline data available</p>
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <Line data={chartData} options={chartOptions} />
    </div>
  );
}


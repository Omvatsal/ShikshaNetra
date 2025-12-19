"use client";

import React, { useMemo } from "react";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Radar } from "react-chartjs-2";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

export type MetricsData = {
  clarity: number;
  confidence: number;
  engagement: number;
  technicalDepth: number;
  interaction: number;
  topicRelevance: number;
};

type MetricsRadarChartProps = {
  data: MetricsData;
  label?: string;
};

export function MetricsRadarChart({ data, label = "Current Session" }: MetricsRadarChartProps) {
  const chartData = useMemo(() => {
    return {
      labels: [
        "Clarity",
        "Confidence",
        "Engagement",
        "Technical Depth",
        "Interaction",
        "Topic Relevance",
      ],
      datasets: [
        {
          label,
          data: [
            data.clarity,
            data.confidence,
            data.engagement,
            data.technicalDepth,
            data.interaction || 0,
            data.topicRelevance || 0,
          ],
          backgroundColor: "rgba(59, 130, 246, 0.2)",
          borderColor: "rgb(59, 130, 246)",
          pointBackgroundColor: "rgb(59, 130, 246)",
          pointBorderColor: "#fff",
          pointHoverBackgroundColor: "#fff",
          pointHoverBorderColor: "rgb(59, 130, 246)",
          borderWidth: 2,
        },
      ],
    };
  }, [data, label]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20,
          font: {
            size: 11,
          },
          color: "rgb(100, 116, 139)",
        },
        grid: {
          color: "rgba(148, 163, 184, 0.2)",
        },
        pointLabels: {
          font: {
            size: 12,
            weight: 600,
          },
          color: "rgb(51, 65, 85)",
        },
      },
    },
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
          label: (context: any) => {
            return `${context.label}: ${context.parsed.r.toFixed(1)}/100`;
          },
        },
      },
    },
  };

  return (
    <div className="h-96 w-full">
      <Radar data={chartData} options={chartOptions} />
    </div>
  );
}


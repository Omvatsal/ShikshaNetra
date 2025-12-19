"use client";

import { useState } from "react";
import { Card } from "./Card";

interface PerMinuteData {
  minute: number;
  start_sec: number;
  end_sec: number;
  [key: string]: number | string;
}

interface MinuteWiseAnalyticsProps {
  audioPerMinute?: PerMinuteData[];
  videoPerMinute?: PerMinuteData[];
  previousMetrics?: {
    avgClarityScore?: number;
    avgConfidenceScore?: number;
    avgEngagementScore?: number;
  };
}

// Calculate IQR and identify outliers
function calculateOutliers(values: number[]): { outliers: Set<number>; q1: number; q3: number; iqr: number } {
  if (values.length < 4) return { outliers: new Set(), q1: 0, q3: 0, iqr: 0 };

  const sorted = [...values].sort((a, b) => a - b);
  const q1Idx = Math.floor(sorted.length / 4);
  const q3Idx = Math.floor((sorted.length * 3) / 4);

  const q1 = sorted[q1Idx];
  const q3 = sorted[q3Idx];
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  const outliers = new Set<number>();
  values.forEach((val) => {
    if (val < lowerBound || val > upperBound) {
      outliers.add(val);
    }
  });

  return { outliers, q1, q3, iqr };
}

function getTrendIcon(current: number, previous: number | undefined): string {
  if (previous === undefined) return "→";
  if (current > previous) return "↑";
  if (current < previous) return "↓";
  return "→";
}

function getTrendColor(current: number, previous: number | undefined): string {
  if (previous === undefined) return "text-slate-600";
  if (current > previous) return "text-green-600";
  if (current < previous) return "text-red-600";
  return "text-slate-600";
}

export function MinuteWiseAnalytics({ audioPerMinute, videoPerMinute, previousMetrics }: MinuteWiseAnalyticsProps) {
  const [selectedMetric, setSelectedMetric] = useState<"clarity" | "engagement">("clarity");

  if (!audioPerMinute && !videoPerMinute) {
    return (
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <p className="text-slate-600">No minute-wise data available</p>
      </Card>
    );
  }

  // Audio metrics
  const clarityScores = audioPerMinute?.map((d) => d.clarity_score as number) || [];
  const confidenceScores = audioPerMinute?.map((d) => d.confidence_score as number) || [];
  const clarityOutliers = calculateOutliers(clarityScores);
  const confidenceOutliers = calculateOutliers(confidenceScores);

  // Video metrics
  const engagementScores = videoPerMinute?.map((d) => d.engagement_score as number) || [];
  const gestureScores = videoPerMinute?.map((d) => d.gesture_index as number) || [];
  const engagementOutliers = calculateOutliers(engagementScores);

  const getPointColor = (value: number, isOutlier: boolean): string => {
    if (isOutlier) return "#ef4444"; // red for outliers
    if (value >= 80) return "#22c55e"; // green
    if (value >= 60) return "#3b82f6"; // blue
    if (value >= 40) return "#eab308"; // yellow
    return "#f97316"; // orange
  };

  const renderAudioMetrics = () => (
    <div className="space-y-6">
      {/* Clarity Score Chart */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-slate-900">Audio Clarity Score</h4>
            <p className="text-sm text-slate-600">Per-minute breakdown with outlier detection</p>
          </div>
          <div className="flex items-center gap-2">
            {getTrendIcon(clarityScores[clarityScores.length - 1] || 0, previousMetrics?.avgClarityScore) === "↑" && (
              <span className={`text-lg font-bold ${getTrendColor(clarityScores[clarityScores.length - 1] || 0, previousMetrics?.avgClarityScore)}`}>
                ↑ Improving
              </span>
            )}
            {getTrendIcon(clarityScores[clarityScores.length - 1] || 0, previousMetrics?.avgClarityScore) === "↓" && (
              <span className={`text-lg font-bold ${getTrendColor(clarityScores[clarityScores.length - 1] || 0, previousMetrics?.avgClarityScore)}`}>
                ↓ Declining
              </span>
            )}
          </div>
        </div>

        <div className="mb-4 flex h-48 items-end gap-2">
          {audioPerMinute?.map((data, idx) => {
            const value = data.clarity_score as number;
            const isOutlier = clarityOutliers.outliers.has(value);
            const height = (value / 100) * 160;
            const color = getPointColor(value, isOutlier);

            return (
              <div key={idx} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className={`w-full rounded-t transition-all ${isOutlier ? "ring-2 ring-red-400" : ""}`}
                  style={{ height: `${height}px`, backgroundColor: color }}
                  title={`Min ${data.minute}: ${value.toFixed(1)}`}
                />
                <span className="text-xs font-medium text-slate-600">{data.minute}m</span>
                {isOutlier && <span className="text-xs font-bold text-red-600">⚠</span>}
              </div>
            );
          })}
        </div>

        <div className="flex gap-4 border-t border-slate-200 pt-4 text-sm">
          <div>
            <p className="text-slate-600">Average:</p>
            <p className="text-lg font-bold text-slate-900">{(clarityScores.reduce((a, b) => a + b, 0) / clarityScores.length).toFixed(1)}</p>
          </div>
          <div>
            <p className="text-slate-600">Range:</p>
            <p className="text-lg font-bold text-slate-900">
              {Math.min(...clarityScores).toFixed(1)} - {Math.max(...clarityScores).toFixed(1)}
            </p>
          </div>
          {clarityOutliers.outliers.size > 0 && (
            <div>
              <p className="text-slate-600">Outliers:</p>
              <p className="text-lg font-bold text-red-600">🚨 {clarityOutliers.outliers.size}</p>
            </div>
          )}
        </div>
      </div>

      {/* Confidence Score Chart */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-4">
          <h4 className="font-semibold text-slate-900">Audio Confidence Score</h4>
          <p className="text-sm text-slate-600">Speaker confidence throughout the session</p>
        </div>

        <div className="mb-4 flex h-48 items-end gap-2">
          {audioPerMinute?.map((data, idx) => {
            const value = data.confidence_score as number;
            const isOutlier = confidenceOutliers.outliers.has(value);
            const height = (value / 100) * 160;
            const color = getPointColor(value, isOutlier);

            return (
              <div key={idx} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className={`w-full rounded-t transition-all ${isOutlier ? "ring-2 ring-red-400" : ""}`}
                  style={{ height: `${height}px`, backgroundColor: color }}
                  title={`Min ${data.minute}: ${value.toFixed(1)}`}
                />
                <span className="text-xs font-medium text-slate-600">{data.minute}m</span>
                {isOutlier && <span className="text-xs font-bold text-red-600">⚠</span>}
              </div>
            );
          })}
        </div>

        <div className="flex gap-4 border-t border-slate-200 pt-4 text-sm">
          <div>
            <p className="text-slate-600">Average:</p>
            <p className="text-lg font-bold text-slate-900">{(confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length).toFixed(1)}</p>
          </div>
          <div>
            <p className="text-slate-600">Range:</p>
            <p className="text-lg font-bold text-slate-900">
              {Math.min(...confidenceScores).toFixed(1)} - {Math.max(...confidenceScores).toFixed(1)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderVideoMetrics = () => (
    <div className="space-y-6">
      {/* Engagement Score Chart */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-slate-900">Engagement Score</h4>
            <p className="text-sm text-slate-600">Student engagement per minute</p>
          </div>
          <div className="flex items-center gap-2">
            {getTrendIcon(engagementScores[engagementScores.length - 1] || 0, previousMetrics?.avgEngagementScore) === "↑" && (
              <span className="text-lg font-bold text-green-600">↑ Better</span>
            )}
            {getTrendIcon(engagementScores[engagementScores.length - 1] || 0, previousMetrics?.avgEngagementScore) === "↓" && (
              <span className="text-lg font-bold text-red-600">↓ Lower</span>
            )}
          </div>
        </div>

        <div className="mb-4 flex h-48 items-end gap-2">
          {videoPerMinute?.map((data, idx) => {
            const value = data.engagement_score as number;
            const isOutlier = engagementOutliers.outliers.has(value);
            const height = (value / 100) * 160;
            const color = getPointColor(value, isOutlier);

            return (
              <div key={idx} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className={`w-full rounded-t transition-all ${isOutlier ? "ring-2 ring-red-400" : ""}`}
                  style={{ height: `${height}px`, backgroundColor: color }}
                  title={`Min ${data.minute}: ${value.toFixed(1)}`}
                />
                <span className="text-xs font-medium text-slate-600">{data.minute}m</span>
                {isOutlier && <span className="text-xs font-bold text-red-600">⚠</span>}
              </div>
            );
          })}
        </div>

        <div className="flex gap-4 border-t border-slate-200 pt-4 text-sm">
          <div>
            <p className="text-slate-600">Average:</p>
            <p className="text-lg font-bold text-slate-900">{(engagementScores.reduce((a, b) => a + b, 0) / engagementScores.length).toFixed(1)}</p>
          </div>
          <div>
            <p className="text-slate-600">Range:</p>
            <p className="text-lg font-bold text-slate-900">
              {Math.min(...engagementScores).toFixed(1)} - {Math.max(...engagementScores).toFixed(1)}
            </p>
          </div>
          {engagementOutliers.outliers.size > 0 && (
            <div>
              <p className="text-slate-600">Alerts:</p>
              <p className="text-lg font-bold text-red-600">🚨 {engagementOutliers.outliers.size}</p>
            </div>
          )}
        </div>
      </div>

      {/* Gesture Index Chart */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-4">
          <h4 className="font-semibold text-slate-900">Gesture Index</h4>
          <p className="text-sm text-slate-600">Physical expressiveness throughout the session</p>
        </div>

        <div className="mb-4 flex h-48 items-end gap-2">
          {videoPerMinute?.map((data, idx) => {
            const value = Math.min((data.gesture_index as number) * 1.5, 100); // Scale for visibility
            const height = (value / 100) * 160;
            const color = value >= 50 ? "#3b82f6" : "#eab308";

            return (
              <div key={idx} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t transition-all"
                  style={{ height: `${height}px`, backgroundColor: color }}
                  title={`Min ${data.minute}: ${(data.gesture_index as number).toFixed(1)}`}
                />
                <span className="text-xs font-medium text-slate-600">{data.minute}m</span>
              </div>
            );
          })}
        </div>

        <div className="flex gap-4 border-t border-slate-200 pt-4 text-sm">
          <div>
            <p className="text-slate-600">Average:</p>
            <p className="text-lg font-bold text-slate-900">{(gestureScores.reduce((a, b) => a + b, 0) / gestureScores.length).toFixed(1)}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-slate-900">Minute-wise Analytics</h3>
        <p className="mt-1 text-slate-600">Detailed breakdown with outlier detection using IQR method</p>
      </div>

      <div className="mb-6 flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setSelectedMetric("clarity")}
          className={`px-4 py-2 font-medium transition-colors ${
            selectedMetric === "clarity"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          🎙️ Audio Metrics
        </button>
        <button
          onClick={() => setSelectedMetric("engagement")}
          className={`px-4 py-2 font-medium transition-colors ${
            selectedMetric === "engagement"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          📹 Video Metrics
        </button>
      </div>

      {selectedMetric === "clarity" ? renderAudioMetrics() : renderVideoMetrics()}

      <div className="mt-6 rounded-lg bg-blue-50 p-4">
        <p className="text-sm text-blue-900">
          <strong>💡 Legend:</strong> <span className="text-green-600">●</span> Excellent (80+) |{" "}
          <span className="text-blue-600">●</span> Good (60-79) | <span className="text-yellow-600">●</span> Fair (40-59) |{" "}
          <span className="text-orange-600">●</span> Needs Improvement (0-39) | <span className="text-red-600">⚠️</span> Statistical Outlier
        </p>
      </div>
    </Card>
  );
}

"use client";

import { MemoryResponse } from "@/lib/types/memory";
import { Card } from "./Card";

interface MemoryInsightsProps {
  memory: MemoryResponse | null;
  loading?: boolean;
}

function getTrendTag(trend: number): { icon: string; color: string; label: string; direction: string } {
  if (trend > 5) return { icon: "📈", color: "bg-green-100 text-green-800", label: "Strong Growth", direction: "Excellent progress!" };
  if (trend > 0) return { icon: "↗️", color: "bg-green-50 text-green-700", label: "Improving", direction: "Keep it up!" };
  if (trend < -5) return { icon: "📉", color: "bg-red-100 text-red-800", label: "Declining", direction: "Needs focus" };
  if (trend < 0) return { icon: "↘️", color: "bg-red-50 text-red-700", label: "Slight Dip", direction: "Watch out" };
  return { icon: "→", color: "bg-slate-100 text-slate-700", label: "Stable", direction: "Consistent" };
}

function getPerformanceLevel(score: number): { level: string; color: string; emoji: string } {
  if (score >= 85) return { level: "Expert", color: "from-green-400 to-emerald-600", emoji: "⭐⭐⭐" };
  if (score >= 75) return { level: "Advanced", color: "from-blue-400 to-blue-600", emoji: "⭐⭐" };
  if (score >= 60) return { level: "Proficient", color: "from-purple-400 to-purple-600", emoji: "⭐" };
  if (score >= 45) return { level: "Developing", color: "from-yellow-400 to-orange-500", emoji: "📈" };
  return { level: "Beginner", color: "from-orange-400 to-red-500", emoji: "🌱" };
}

export function MemoryInsights({ memory, loading }: MemoryInsightsProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 animate-pulse rounded-lg bg-slate-200"></div>
        <div className="h-32 animate-pulse rounded-lg bg-slate-200"></div>
      </div>
    );
  }

  if (!memory) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 text-center">
        <p className="text-lg font-semibold text-slate-900">No Memory Yet</p>
        <p className="mt-2 text-slate-600">Upload and analyze your first session to build your teaching profile.</p>
      </Card>
    );
  }

  const metrics = [
    {
      name: "Clarity",
      icon: "🎙️",
      score: memory.clarityScore?.mean || 0,
      trend: memory.clarityScore?.trend || 0,
      latest: memory.clarityScore?.latest || 0,
      range: [memory.clarityScore?.min || 0, memory.clarityScore?.max || 0],
    },
    {
      name: "Confidence",
      icon: "💪",
      score: memory.confidenceScore?.mean || 0,
      trend: memory.confidenceScore?.trend || 0,
      latest: memory.confidenceScore?.latest || 0,
      range: [memory.confidenceScore?.min || 0, memory.confidenceScore?.max || 0],
    },
    {
      name: "Engagement",
      icon: "🎯",
      score: memory.engagementScore?.mean || 0,
      trend: memory.engagementScore?.trend || 0,
      latest: memory.engagementScore?.latest || 0,
      range: [memory.engagementScore?.min || 0, memory.engagementScore?.max || 0],
    },
    {
      name: "Technical Depth",
      icon: "🧠",
      score: memory.technicalDepth?.mean || 0,
      trend: memory.technicalDepth?.trend || 0,
      latest: memory.technicalDepth?.latest || 0,
      range: [memory.technicalDepth?.min || 0, memory.technicalDepth?.max || 0],
    },
    {
      name: "Interaction Index",
      icon: "💬",
      score: memory.interactionIndex?.mean || 0,
      trend: memory.interactionIndex?.trend || 0,
      latest: memory.interactionIndex?.latest || 0,
      range: [memory.interactionIndex?.min || 0, memory.interactionIndex?.max || 0],
    },
    {
      name: "Gesture Index",
      icon: "🤸",
      score: memory.gestureIndex?.mean || 0,
      trend: memory.gestureIndex?.trend || 0,
      latest: memory.gestureIndex?.latest || 0,
      range: [memory.gestureIndex?.min || 0, memory.gestureIndex?.max || 0],
    },
  ];

  const overallScore = (metrics.reduce((sum, m) => sum + m.score, 0) / metrics.length).toFixed(1);
  const performanceLevel = getPerformanceLevel(parseFloat(overallScore));

  return (
    <div className="space-y-6">
      {/* Overall Performance Card */}
      <Card className={`bg-gradient-to-br ${performanceLevel.color} p-8 text-white shadow-lg`}>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm font-medium opacity-90">Overall Performance</p>
            <p className="mt-2 text-5xl font-bold">{overallScore}</p>
            <p className="mt-2 text-lg font-semibold">{performanceLevel.level}</p>
          </div>
          <div className="text-6xl">{performanceLevel.emoji}</div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <span className="text-sm opacity-90">Sessions Completed: {memory.totalSessions}</span>
          <span className="text-sm opacity-90">•</span>
          <span className="text-sm opacity-90">Last Session: {memory.lastAnalysisDate ? new Date(memory.lastAnalysisDate).toLocaleDateString() : "N/A"}</span>
        </div>
      </Card>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => {
          const trendTag = getTrendTag(metric.trend);
          const perfLevel = getPerformanceLevel(metric.score);

          return (
            <Card key={metric.name} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">{metric.icon} {metric.name}</p>
                  <p className="mt-3 text-3xl font-bold text-slate-900">{metric.score.toFixed(1)}</p>
                </div>
                <div className={`rounded-full ${trendTag.color} px-2 py-1 text-center`}>
                  <p className="text-lg">{trendTag.icon}</p>
                  <p className="text-xs font-bold">{trendTag.label}</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full bg-gradient-to-r ${perfLevel.color} transition-all duration-500`}
                  style={{ width: `${Math.min(metric.score, 100)}%` }}
                />
              </div>

              {/* Stats */}
              <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                <div>
                  <p className="font-medium">Latest: {metric.latest.toFixed(1)}</p>
                  <p>Trend: {trendTag.direction}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">Range</p>
                  <p>
                    {metric.range[0].toFixed(1)} - {metric.range[1].toFixed(1)}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Key Insights */}
      <Card className="space-y-4 bg-gradient-to-br from-indigo-50 to-blue-50 p-6">
        <h3 className="text-lg font-bold text-slate-900">📊 Key Insights</h3>

        {/* Top Strengths */}
        {metrics.length > 0 && (
          <div>
            <p className="font-semibold text-slate-700">✨ Your Strengths</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {metrics
                .sort((a, b) => b.score - a.score)
                .slice(0, 3)
                .map((metric) => (
                  <span key={metric.name} className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                    {metric.icon} {metric.name} ({metric.score.toFixed(0)})
                  </span>
                ))}
            </div>
          </div>
        )}

        {/* Areas to Improve */}
        {memory.weaknesses && memory.weaknesses.length > 0 && (
          <div>
            <p className="font-semibold text-slate-700">🎯 Areas to Improve</p>
            <div className="mt-2 space-y-2">
              {memory.weaknesses.slice(0, 3).map((weakness: any, idx) => (
                <div key={idx} className="flex items-center gap-2 rounded-lg bg-white/50 p-2 text-sm">
                  <span className="text-lg">⚡</span>
                  <span className="text-slate-700">
                    <strong>{weakness.field}</strong>: Focus on improvement
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Subjects Covered */}
        {memory.subjectsCovered && memory.subjectsCovered.length > 0 && (
          <div>
            <p className="font-semibold text-slate-700">📚 Subjects Taught</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {memory.subjectsCovered.map((subject: string) => (
                <span key={subject} className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                  {subject}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Dominant Emotions */}
        {memory.frequentDominantEmotion && (
          <div>
            <p className="font-semibold text-slate-700">😊 Most Common Emotion</p>
            <p className="mt-1 text-sm capitalize text-slate-600">{memory.frequentDominantEmotion}</p>
          </div>
        )}
      </Card>

      {/* Recommendations */}
      <Card className="space-y-3 border-2 border-yellow-200 bg-yellow-50 p-6">
        <h3 className="text-lg font-bold text-yellow-900">💡 Recommendations</h3>

        {metrics
          .filter((m) => m.trend < -2)
          .map((metric) => (
            <p key={metric.name} className="text-sm text-yellow-800">
              • <strong>{metric.name}</strong> is declining. Consider reviewing techniques to improve this metric.
            </p>
          ))}

        {memory.weaknesses && memory.weaknesses.length > 0 && (
          <p className="text-sm text-yellow-800">
            • Address your identified weaknesses to accelerate improvement.
          </p>
        )}

        {metrics.every((m) => m.score >= 70) && (
          <p className="text-sm text-green-800 font-semibold">
            ✅ Excellent work! You're performing well across all metrics. Keep up the momentum!
          </p>
        )}
      </Card>
    </div>
  );
}

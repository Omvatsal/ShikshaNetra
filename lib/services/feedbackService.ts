import { CoachFeedback } from "@/lib/types/analysis";
import { getMemoryByUserId } from "@/lib/models/Memory";
import { getUserById } from "@/lib/models/User";
import { Client } from "@gradio/client";

const HF_SPACE = "genathon00/sikshanetra-model";

export interface FeedbackGenerationInput {
  userId: string;
  topic: string;
  language: string;
  transcript: string;
  scores: any; // The scores object from ML response
}

/**
 * Generate a comprehensive pedagogical prompt for GenAI feedback
 * Includes memory (previous summary) and teacher name for personalized feedback
 */
export async function generateFeedbackPrompt(input: FeedbackGenerationInput): Promise<string> {
  const { userId, topic, language, transcript, scores } = input;

  // Fetch user details for name (safely handle missing user)
  let teacherName = "Teacher";
  try {
    const user = await getUserById(userId);
    if (user?.name) {
      teacherName = user.name;
    }
  } catch (err) {
    console.warn("Could not fetch user name for feedback prompt", err);
  }

  // Fetch memory for previous summary (optional, not critical)
  let previousSummary: string | null = null;
  try {
    const memory = await getMemoryByUserId(userId);
    if (memory) {
      previousSummary = generateMemorySummary(memory);
    }
  } catch (err) {
    console.warn("Could not fetch memory for feedback prompt", err);
  }

  // Build the comprehensive prompt
  const isNewUser = !previousSummary;
  const prompt = `You are an expert Pedagogical Coach and Technical Auditor for Shiksha Netra.
Your goal is to evaluate ${teacherName} based on their session transcript and computed AI scores.

**Session Details:**
- Teacher: ${teacherName}
- Topic: ${topic}
- Language: ${language}
- User Type: ${isNewUser ? "New teacher (first session)" : "Returning teacher"}
- AI Analysis Scores: ${JSON.stringify(scores, null, 2)}

${previousSummary ? `**Previous Performance Summary:**\n${previousSummary}\n` : ""}

**Transcript:**
"${transcript}"

**Task:**
Analyze the session and generate a JSON report containing the following 8 distinct features:

1. **performance_summary**: A 2-3 sentence executive summary of the session. ${isNewUser ? "For this first session, focus on foundational observations and initial potential. Be encouraging and welcoming." : `Reference ${teacherName}'s previous performance to show continuity and improvement/decline.`}
2. **teaching_style**: Classify the style (e.g., 'Authoritative', 'Facilitator', 'Demonstrator', 'Hybrid') and provide a 1-sentence explanation.
3. **strengths**: List 3 key strengths based on the scores and transcript.
4. **weaknesses**: List 3 areas for improvement based on the scores and transcript.
5. **factual_accuracy_audit**: Scan the transcript for technical errors or inaccuracies relative to the topic '${topic}'. Return a list of corrections or ["No errors found"] if the content is factually accurate.
6. **video_titles**: Generate 3 catchy, SEO-friendly titles for this video lesson (suitable for YouTube/online platforms).
7. **hashtags**: Generate 5 relevant hashtags for social media promotion.
8. **multilingual_feedback**: If the target language '${language}' is NOT English, translate the 'performance_summary' into ${language}. If it IS English, return null.

**Important Guidelines:**
- Address ${teacherName} by name or inclusive pronouns like you, yours etc. in the performance_summary to make it feel personal and human-driven.
${isNewUser ? "- For new teachers, emphasize positive elements and future potential rather than comparing to previous sessions." : `- Reference their previous performance (e.g., "Building on your last session..." or "You've improved in..." or "Similar to before...") to demonstrate memory and continuity.`}
- Be constructive, supportive, and actionable in feedback.
- Base all observations on the actual transcript and scores provided.
- Ensure factual_accuracy_audit is thorough - verify concepts, definitions, and examples against the topic.

**Output Format:**
Return ONLY the raw JSON object. Do not use markdown formatting (no \`\`\`json).
The JSON structure must be:
{
    "performance_summary": "...",
    "teaching_style": { "style": "...", "explanation": "..." },
    "strengths": ["...", "...", "..."],
    "weaknesses": ["...", "...", "..."],
    "factual_accuracy_audit": ["..."],
    "content_metadata": {
        "titles": ["...", "...", "..."],
        "hashtags": ["...", "...", "...", "...", "..."]
    },
    "multilingual_feedback": "..." or null
}`;

  return prompt;
}

/**
 * Generate a summary of teacher's memory/history
 */
function generateMemorySummary(memory: any): string {
  const parts: string[] = [];

  if (memory.totalSessions > 0) {
    parts.push(`Total sessions completed: ${memory.totalSessions}`);
  }

  // Average scores
  if (memory.clarityScore?.mean) {
    parts.push(`Average clarity: ${memory.clarityScore.mean.toFixed(1)}%`);
  }
  if (memory.confidenceScore?.mean) {
    parts.push(`Average confidence: ${memory.confidenceScore.mean.toFixed(1)}%`);
  }
  if (memory.engagementScore?.mean) {
    parts.push(`Average engagement: ${memory.engagementScore.mean.toFixed(1)}%`);
  }

  // Trends
  if (memory.clarityScore?.trend) {
    const trend = memory.clarityScore.trend > 0 ? "improving" : memory.clarityScore.trend < 0 ? "declining" : "stable";
    parts.push(`Clarity trend: ${trend}`);
  }

  // Weaknesses
  if (memory.weaknesses && memory.weaknesses.length > 0) {
    const topWeaknesses = memory.weaknesses.slice(0, 3).map((w: any) => w.field).join(", ");
    parts.push(`Known areas for improvement: ${topWeaknesses}`);
  }

  // Subjects covered
  if (memory.subjectsCovered && memory.subjectsCovered.length > 0) {
    parts.push(`Subjects taught: ${memory.subjectsCovered.join(", ")}`);
  }

  return parts.join(". ") + ".";
}

/**
 * Call the HuggingFace Space's /generate_genai_feedback endpoint
 */
export async function generateCoachFeedback(
  input: FeedbackGenerationInput
): Promise<{ success: boolean; feedback?: CoachFeedback; error?: string }> {
  try {
    // Generate the comprehensive prompt
    const prompt = await generateFeedbackPrompt(input);

    // Connect to HuggingFace Space and call the endpoint
    console.log("Connecting to HF Space for feedback generation...");
    const client = await Client.connect(HF_SPACE);
    
    console.log("Calling /generate_genai_feedback with prompt");
    const result = await client.predict("/generate_genai_feedback", {
      user_prompt: prompt,
    });

    if (!result || !result.data) {
      console.error("GenAI feedback generation failed: No data returned");
      return {
        success: false,
        error: "Failed to generate feedback: No data returned from HF Space",
      };
    }

    // Extract the response data - Gradio returns data in an array
    const responseData = (result.data as any)[0];

    // Parse the response - the HF Space should return JSON directly
    let feedback: CoachFeedback;
    
    if (typeof responseData === "string") {
      // If it's a string, parse it
      feedback = JSON.parse(responseData);
    } else {
      // If it's already an object, use it directly
      feedback = responseData;
    }

    // Validate the feedback structure
    if (!feedback.performance_summary || !feedback.strengths || !feedback.weaknesses) {
      console.error("Invalid feedback structure:", feedback);
      return {
        success: false,
        error: "Invalid feedback structure received from HF Space",
      };
    }

    return {
      success: true,
      feedback,
    };
  } catch (error: any) {
    console.error("Error generating coach feedback:", error);
    return {
      success: false,
      error: error.message || "Failed to generate coach feedback",
    };
  }
}

/**
 * Fallback feedback generator (in case ML service is unavailable)
 * Uses actual scores to provide meaningful feedback
 */
export function generateFallbackFeedback(
  teacherName: string,
  scores: any
): CoachFeedback {
  // Extract scores safely
  const clarityScore = scores?.clarity_score || 0;
  const confidenceScore = scores?.confidence_score || 0;
  const engagementScore = scores?.engagement_score || 0;

  // Determine overall quality level
  const avgScore = (clarityScore + confidenceScore + engagementScore) / 3;
  const qualityLevel =
    avgScore >= 80 ? "strong"
    : avgScore >= 60 ? "good"
    : avgScore >= 40 ? "developing"
    : "needs improvement";

  // Generate meaningful strengths based on scores
  const strengths: string[] = [];
  if (clarityScore >= 70) strengths.push("Clear communication and content presentation");
  if (confidenceScore >= 70) strengths.push("Confident and assured delivery");
  if (engagementScore >= 70) strengths.push("Good audience engagement");
  if (strengths.length === 0) strengths.push("Session completed successfully", "Content delivered");

  // Generate meaningful weaknesses based on scores
  const weaknesses: string[] = [];
  if (clarityScore < 60) weaknesses.push("Improve clarity and articulation of concepts");
  if (confidenceScore < 60) weaknesses.push("Build more confidence in presentation");
  if (engagementScore < 60) weaknesses.push("Increase interaction and audience engagement");
  if (weaknesses.length === 0) weaknesses.push("Continue maintaining current teaching standards");

  return {
    performance_summary: `${teacherName}, your session demonstrated ${qualityLevel} overall performance. Your scores highlight your strengths and areas for growth. Keep practicing and refining your skills for continued improvement.`,
    teaching_style: {
      style: "Developing",
      explanation: "Session shows potential with room for refining your teaching approach.",
    },
    strengths: strengths.slice(0, 3),
    weaknesses: weaknesses.slice(0, 3),
    factual_accuracy_audit: ["Detailed audit unavailable"],
    content_metadata: {
      titles: [
        "Teaching Session Lesson Recording",
        "Educational Video Content",
        "Online Classroom Session",
      ],
      hashtags: ["#TeacherLife", "#OnlineTeaching", "#Education", "#LearningContent", "#ClassroomSession"],
    },
    multilingual_feedback: null,
  };
}

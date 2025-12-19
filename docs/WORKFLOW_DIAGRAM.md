# Workflow Diagram - ML Model Integration

## Complete Analysis Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER UPLOADS VIDEO                            │
│                    POST /api/analyze (file)                          │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      CREATE JOB (Status: created)                    │
│                        Progress: 0%                                  │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────┴─────────────────┐
        │                                   │
        ▼                                   ▼
┌──────────────────┐              ┌──────────────────┐
│  Upload Video    │              │  Send to ML      │
│  to Supabase     │  (Parallel)  │  Model (Gradio)  │
│  Status:         │              │  Status:         │
│  uploading (5%)  │              │  analyzing (30%) │
└────────┬─────────┘              └────────┬─────────┘
         │                                 │
         │                                 │
         └────────────┬────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│              ML MODEL RETURNS ANALYSIS RESULTS                       │
│              Status: analysis_done (70%)                             │
│                                                                      │
│  Response:                                                           │
│  {                                                                   │
│    session_id: "video.mp4",                                         │
│    topic: "Machine Learning",                                       │
│    transcript: "Full text...",                                      │
│    scores: {                                                        │
│      audio: { per_minute: [...], overall: {...} },                 │
│      video: { per_minute: [...], overall: {...} },                 │
│      text: { technical_depth, interaction_index }                   │
│    },                                                               │
│    metadata: { processing_time_sec: 40.41 }                         │
│  }                                                                  │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│             PREPARE GENAI FEEDBACK PROMPT                            │
│             Status: generating_feedback (75%)                        │
│                                                                      │
│  1. Fetch User Details (name)                                       │
│  2. Fetch Memory (previous sessions, scores, trends)                │
│  3. Build Comprehensive Prompt:                                     │
│     - System role                                                   │
│     - Teacher name                                                  │
│     - Session details (topic, language, scores)                     │
│     - Memory summary                                                │
│     - Transcript                                                    │
│     - Task definition (8 features)                                  │
│     - Guidelines (personalization, memory references)               │
│     - Output format (JSON structure)                                │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│        CALL /generate_genai_feedback ENDPOINT                        │
│        Status: generating_feedback (80%)                             │
│                                                                      │
│  POST http://localhost:5000/generate_genai_feedback                 │
│  Body: { user_prompt: "You are an expert coach..." }               │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│           GEMINI AI GENERATES STRUCTURED FEEDBACK                    │
│           Status: generating_feedback (85%)                          │
│                                                                      │
│  Returns:                                                           │
│  {                                                                  │
│    performance_summary: "John, your session...",                   │
│    teaching_style: { style: "Facilitator", explanation: "..." },   │
│    strengths: ["Clear", "Engaging", "Relevant"],                   │
│    weaknesses: ["Pacing", "Interaction", "Gestures"],              │
│    factual_accuracy_audit: ["No errors found"],                    │
│    content_metadata: {                                              │
│      titles: ["Title 1", "Title 2", "Title 3"],                    │
│      hashtags: ["#ML", "#AI", "#Education", "#Tutorial", "#Tech"]  │
│    },                                                               │
│    multilingual_feedback: null                                      │
│  }                                                                  │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│              SAVE ANALYSIS + FEEDBACK TO DATABASE                    │
│              Status: generating_feedback (90%)                       │
│                                                                      │
│  Analysis Document:                                                 │
│  {                                                                  │
│    userId, topic, transcript,                                       │
│    clarityScore, confidenceScore, audioPerMinute,                   │
│    engagementScore, gestureIndex, videoPerMinute,                   │
│    technicalDepth, interactionIndex,                                │
│    coachFeedback: { /* full feedback object */ }                    │
│  }                                                                  │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│               UPDATE USER MEMORY MODEL                               │
│               Status: generating_feedback (95%)                      │
│                                                                      │
│  Updates:                                                           │
│  - Total sessions count                                             │
│  - Average scores (clarity, confidence, engagement)                 │
│  - Score trends (improving/declining)                               │
│  - Weaknesses tracking                                              │
│  - Subjects covered                                                 │
│  - Last session date                                                │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   MARK JOB AS COMPLETED                              │
│                   Status: completed (100%)                           │
│                                                                      │
│  Job Update:                                                        │
│  {                                                                  │
│    status: "completed",                                             │
│    progress: 100,                                                   │
│    analysisId: "analysis-123"                                       │
│  }                                                                  │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  FRONTEND RECEIVES COMPLETE RESULTS                  │
│                                                                      │
│  Display:                                                           │
│  - Performance summary (personalized)                               │
│  - Teaching style classification                                    │
│  - Strengths and weaknesses                                         │
│  - Detailed scores (overall + per-minute)                           │
│  - Video titles and hashtags                                        │
│  - Factual accuracy audit                                           │
│  - Multilingual feedback (if applicable)                            │
│  - Per-minute analytics charts                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                   FEEDBACK GENERATION FAILS                          │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          ▼
                 ┌────────┴────────┐
                 │  Try Catch      │
                 │  Error Handler  │
                 └────────┬────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│               LOG ERROR & GENERATE FALLBACK FEEDBACK                 │
│                                                                      │
│  Fallback Response:                                                 │
│  {                                                                  │
│    performance_summary: "Teacher, your session has been analyzed",  │
│    teaching_style: { style: "General", explanation: "..." },        │
│    strengths: ["Session completed", "Content delivered", "..."],    │
│    weaknesses: ["Manual review recommended", "..."],                │
│    factual_accuracy_audit: ["Automated audit unavailable"],         │
│    content_metadata: { titles: [...], hashtags: [...] },            │
│    multilingual_feedback: null                                      │
│  }                                                                  │
│                                                                      │
│  Also store error in: coachFeedbackError                            │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│           WORKFLOW CONTINUES (NEVER FAILS COMPLETELY)                │
│           User still gets analysis + basic feedback                  │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow Between Services

```
┌──────────────┐          ┌──────────────┐          ┌──────────────┐
│   Next.js    │          │    Python    │          │   Gemini AI  │
│  API Routes  │◄────────►│   ML Service │◄────────►│   (GenAI)    │
└──────┬───────┘          └──────┬───────┘          └──────────────┘
       │                         │
       │                         │
       ▼                         ▼
┌──────────────┐          ┌──────────────┐
│   MongoDB    │          │   Supabase   │
│  (Analysis,  │          │   (Video     │
│   Memory,    │          │   Storage)   │
│   Jobs)      │          │              │
└──────────────┘          └──────────────┘

Flow:
1. Next.js → Supabase (upload video)
2. Next.js → Python ML (analyze video)
3. Python ML → Next.js (return scores)
4. Next.js → MongoDB (fetch user + memory)
5. Next.js → Python ML (generate feedback prompt)
6. Python ML → Gemini AI (generate feedback)
7. Gemini AI → Python ML (return feedback)
8. Python ML → Next.js (return feedback)
9. Next.js → MongoDB (save analysis + feedback)
10. Next.js → MongoDB (update memory)
```

## Memory Integration Flow

```
                    ┌─────────────────────┐
                    │  First Analysis     │
                    │  (No Memory Yet)    │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  Create Memory      │
                    │  for User           │
                    └──────────┬──────────┘
                               │
                               ▼
┌───────────────────────────────────────────────────────────────────┐
│  Memory Document Created:                                         │
│  {                                                                │
│    userId: "user-123",                                            │
│    totalSessions: 1,                                              │
│    clarityScore: { mean: 78, latest: 78, trend: 0 },            │
│    confidenceScore: { mean: 65, latest: 65, trend: 0 },         │
│    engagementScore: { mean: 72, latest: 72, trend: 0 },         │
│    weaknesses: [],                                                │
│    subjectsCovered: ["Machine Learning"],                         │
│    ...                                                            │
│  }                                                                │
└───────────────────────────┬───────────────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  Second Analysis        │
              │  (Memory Available)     │
              └──────────┬──────────────┘
                         │
                         ▼
              ┌─────────────────────────┐
              │  Fetch Memory           │
              │  Generate Summary       │
              └──────────┬──────────────┘
                         │
                         ▼
┌───────────────────────────────────────────────────────────────────┐
│  Memory Summary in Prompt:                                        │
│  "Total sessions completed: 1. Average clarity: 78%. Average      │
│   confidence: 65%. Clarity trend: improving. Known areas for      │
│   improvement: interaction, gestures. Subjects taught: Machine    │
│   Learning."                                                      │
└───────────────────────────┬───────────────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  Personalized Feedback  │
              │  with Memory Context    │
              └──────────┬──────────────┘
                         │
                         ▼
              ┌─────────────────────────┐
              │  Update Memory          │
              │  with New Data          │
              └─────────────────────────┘
```

## Progress Tracking

```
0%   ├────────────────────────────────────────────────────┤  100%
     │                                                    │
     ├─► 0-5%:   Job Created                            │
     │                                                   │
     ├─► 5-20%:  Uploading Video to Supabase           │
     │                                                   │
     ├─► 20-30%: Video Uploaded                         │
     │                                                   │
     ├─► 30-70%: Analyzing Video (ML Model Processing)  │
     │                                                   │
     ├─► 70-75%: Analysis Complete                      │
     │                                                   │
     ├─► 75-90%: Generating Coach Feedback              │
     │    │                                              │
     │    ├─► 75%: Fetching Memory                      │
     │    ├─► 80%: Calling GenAI                        │
     │    └─► 85%: Received Feedback                    │
     │                                                   │
     ├─► 90-95%: Saving to Database                     │
     │                                                   │
     ├─► 95-100%: Updating Memory                       │
     │                                                   │
     └─► 100%: Completed! ✅                            │
```

## Key Decision Points

```
┌─────────────────────┐
│  ML Analysis Done   │
└─────────┬───────────┘
          │
          ▼
    ┌─────────────┐       YES      ┌──────────────────┐
    │ Has Memory? ├───────────────►│ Include Memory   │
    └─────┬───────┘                │ in Prompt        │
          │                        └──────────────────┘
          │ NO
          ▼
    ┌─────────────┐
    │ Skip Memory │
    │ Section     │
    └─────────────┘
          │
          ▼
    ┌─────────────────┐
    │ Generate Prompt │
    └─────┬───────────┘
          │
          ▼
    ┌──────────────────┐     SUCCESS   ┌──────────────────┐
    │ Call GenAI API   ├──────────────►│ Parse & Return   │
    └────────┬─────────┘                │ Feedback         │
             │                          └──────────────────┘
             │ FAILURE
             ▼
    ┌──────────────────┐
    │ Use Fallback     │
    │ Feedback         │
    └──────────────────┘
```

---

This visual representation helps understand:
- Complete workflow from upload to completion
- Parallel processing optimization
- Memory integration points
- Error handling strategies
- Progress tracking milestones
- Data flow between services

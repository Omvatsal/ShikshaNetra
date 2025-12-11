import gradio as gr
import os
from src.pipeline import process_session

def analyze_session(video):
    if not video:
        yield "Please upload a video.", "", "", None, gr.update(value="Analyze Session", interactive=True)
        return

    if "GEMINI_API_KEY" not in os.environ:
         yield "Gemini API Key is required. Please set GEMINI_API_KEY in your environment variables.", "", "", None, gr.update(value="Analyze Session", interactive=True)
         return

    try:
        yield "", "", "", None, gr.update(value="Analysing...", interactive=False)
        try:
            video_path = video.path
        except:
            video_path = video
        
        report = process_session(video_path, topic_name="General")
        
        if not report:
            yield "Analysis failed. Please check logs.", "", "", None, gr.update(value="Analyze Session", interactive=True)
            return

        # Prepare outputs
        # 1. Summary
        summary_md = "## Performance Summary\n"
        if "coach_feedback" in report and "performance_summary" in report["coach_feedback"]:
            summary_md += report["coach_feedback"]["performance_summary"] + "\n\n"
            
            style = report["coach_feedback"].get("teaching_style", {})
            if isinstance(style, dict):
                summary_md += f"### Teaching Style: {style.get('style', 'Unknown')}\n{style.get('explanation', '')}"
            else:
                summary_md += f"### Teaching Style\n{str(style)}"
        else:
             summary_md += "Coach feedback not available (Check API Key)."
             
        # 2. Detailed Scores
        scores = report.get("scores", {})
        scores_md = "## Detailed Scores\n"
        scores_md += f"- **Audio Clarity**: {scores.get('audio', {}).get('clarity_score', 0)}\n"
        scores_md += f"- **Audio Confidence**: {scores.get('audio', {}).get('confidence_score', 0)}\n"
        scores_md += f"- **Video Engagement**: {scores.get('video', {}).get('engagement_score', 0)}\n"
        scores_md += f"- **Gesture Index**: {scores.get('video', {}).get('gesture_index', 0)}\n"
        scores_md += f"- **Technical Depth**: {scores.get('text', {}).get('technical_depth', 0)}\n"
        scores_md += f"- **Interaction Index**: {scores.get('text', {}).get('interaction_index', 0)}\n"

        # 3. Coach Feedback
        feedback_md = "## Coach Feedback\n"
        if "coach_feedback" in report:
            fb = report["coach_feedback"]
            
            feedback_md += "### ✅ Strengths\n"
            for s in fb.get("strengths", []):
                feedback_md += f"- {s}\n"
            
            feedback_md += "\n### ⚠️ Areas for Improvement\n"
            for w in fb.get("weaknesses", []):
                feedback_md += f"- {w}\n"
                
            feedback_md += "\n### Titles & Hashtags\n"
            meta = fb.get("content_metadata", {})
            feedback_md += "**Titles:**\n"
            for t in meta.get("titles", []):
                feedback_md += f"- {t}\n"
            feedback_md += "\n**Hashtags:** " + " ".join(meta.get("hashtags", []))

        # 4. Raw JSON - Yield final results and reset button
        yield summary_md, scores_md, feedback_md, report, gr.update(value="Analyze Session", interactive=True)

    except Exception as e:
        yield f"An error occurred: {str(e)}", "", "", None, gr.update(value="Analyze Session", interactive=True)

# Define Interface
with gr.Blocks(title="Shiksha Netra - AI Pedagogical Coach") as demo:
    gr.Markdown("# 🎓 Shiksha Netra - AI Pedagogical Coach")
    gr.Markdown("Upload a teaching session video to get comprehensive AI feedback.")
    
    with gr.Row():
        with gr.Column():
            video_input = gr.Video(label="Upload Teaching Session", sources=["upload"])
            analyze_btn = gr.Button("Analyze Session", variant="primary")
        
    with gr.Tabs():
        with gr.TabItem("Summary"):
            summary_output = gr.Markdown()
        with gr.TabItem("Detailed Scores"):
            scores_output = gr.Markdown()
        with gr.TabItem("Coach Feedback"):
            feedback_output = gr.Markdown()
        with gr.TabItem("Raw Data"):
            json_output = gr.JSON()

    analyze_btn.click(
        analyze_session,
        inputs=[video_input],
        outputs=[summary_output, scores_output, feedback_output, json_output, analyze_btn]
    )

if __name__ == "__main__":
    demo.launch()

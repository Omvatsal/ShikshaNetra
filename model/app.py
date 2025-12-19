import gradio as gr
import os
import json
from flask import Flask, request, jsonify
from src.pipeline import process_session
from src.genai.coach import ShikshaCoach

# Initialize Flask app for API endpoints
flask_app = Flask(__name__)

# Initialize the coach
coach = ShikshaCoach()

@flask_app.route("/generate_genai_feedback", methods=["POST"])
def generate_genai_feedback():
    """
    API endpoint to generate GenAI feedback from a user prompt
    Expects: { "user_prompt": "..." }
    Returns: JSON feedback object
    """
    try:
        data = request.get_json()
        
        if not data or "user_prompt" not in data:
            return jsonify({"error": "Missing 'user_prompt' in request body"}), 400
        
        user_prompt = data["user_prompt"]
        
        if not coach.model:
            return jsonify({"error": "GenAI model not initialized. Check GEMINI_API_KEY."}), 500
        
        # Generate response using the coach model
        response = coach.model.generate_content(user_prompt)
        
        # Extract text and parse JSON
        response_text = response.text.strip()
        
        # Remove markdown code blocks if present
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        
        response_text = response_text.strip()
        
        # Parse JSON
        feedback = json.loads(response_text)
        
        return jsonify(feedback), 200
        
    except json.JSONDecodeError as e:
        return jsonify({
            "error": "Failed to parse GenAI response as JSON",
            "details": str(e),
            "raw_response": response_text if 'response_text' in locals() else None
        }), 500
    except Exception as e:
        return jsonify({
            "error": "Failed to generate feedback",
            "details": str(e)
        }), 500

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
    # Launch both Gradio and Flask
    # Gradio will be on port 7860 by default
    # Flask will be on port 5000 by default
    from threading import Thread
    
    # Start Flask in a separate thread
    def run_flask():
        flask_app.run(host="0.0.0.0", port=5000, debug=False)
    
    flask_thread = Thread(target=run_flask, daemon=True)
    flask_thread.start()
    
    # Launch Gradio
    demo.launch()

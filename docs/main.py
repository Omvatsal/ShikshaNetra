import subprocess
import threading
import uvicorn
import os

import sys

def run_streamlit():
    subprocess.run([sys.executable, "-m", "streamlit", "run", "streamlit_app.py", "--server.port", "8501", "--server.address", "127.0.0.1"])

def run_fastapi():
    port = int(os.environ.get("PORT", 10000))  # Render injects PORT
    uvicorn.run("api:app", host="0.0.0.0", port=port, reload=False)

if __name__ == "__main__":
    t1 = threading.Thread(target=run_streamlit)
    t1.start()

    run_fastapi()

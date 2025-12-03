@echo off
cd /d "%~dp0"

REM Check if virtual environment exists
if not exist "venv\Scripts\activate.bat" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate

REM Install/update dependencies
echo Installing dependencies...
pip install -r requirements.txt

REM Start the FastAPI server
echo Starting FastAPI server on http://localhost:8000...
uvicorn main:app --reload --host 0.0.0.0 --port 8000


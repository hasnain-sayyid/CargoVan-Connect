@echo off
echo Starting CargoVan Connect Backend...
cd backend
if exist venv\Scripts\activate (
    call venv\Scripts\activate
) else (
    echo Virtual environment not found, trying global python...
)
uvicorn app.main:app --reload
pause

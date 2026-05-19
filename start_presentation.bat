@echo off
echo ==============================================
echo  Cifciden - Backend + Frontend Baslatiyor
echo ==============================================

:: Backend
set PYTHONPATH=d:\Tarim projesi\backend;d:\Tarim projesi
cd /d "d:\Tarim projesi\backend"
start "BACKEND - FastAPI" cmd /k "set PYTHONPATH=d:\Tarim projesi\backend;d:\Tarim projesi && py -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

timeout /t 3 /nobreak

:: Frontend
cd /d "d:\Tarim projesi\frontend"
start "FRONTEND - Next.js" cmd /k "npm run dev"

echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo NOT: Gemini AI icin backend\.env dosyasindaki
echo GEMINI_API_KEY=your-gemini-api-key-here
echo satirini gercek API key ile degistirin!
echo.
pause

@echo off
cd /d "%~dp0"
call npm install
if errorlevel 1 goto :error
call npm run adse
if errorlevel 1 goto :error
pause
exit /b 0
:error
echo.
echo Integrated DPE + ADSE run failed. Review the error above.
pause
exit /b 1

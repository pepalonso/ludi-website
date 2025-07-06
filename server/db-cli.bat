@echo off
REM Change to your project directory
cd /d %~dp0

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Run the CLI script
python scripts\db_cli.py %*

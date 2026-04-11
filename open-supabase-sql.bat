@echo off
chcp 65001 >nul
title Supabase SQL 편집기
echo.
echo [댕댕마켓] 이 창의 내용은 "웹 SQL 편집기"에 붙이지 마세요. 웹에는 sql 파일만!
echo.
echo [댕댕마켓] Supabase SQL 편집기 페이지를 브라우저에서 엽니다...
echo   프로젝트: silbyvmcuymjewurkrfn
echo   웹에 붙일 SQL: %~dp0sql\run-in-dashboard.sql  (메모장으로 열림 - CREATE 문만 복사)
echo.
start "" "https://supabase.com/dashboard/project/silbyvmcuymjewurkrfn/sql/new"
timeout /t 1 /nobreak >nul
start "" notepad "%~dp0sql\run-in-dashboard.sql"
echo.
echo 브라우저에서 SQL을 붙여넣은 뒤 Run 을 누르세요. 창을 닫으려면 아무 키나...
pause >nul

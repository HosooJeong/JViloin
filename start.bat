@echo off
echo ========================================
echo    J-Violin 학원 관리 시스템 시작
echo ========================================
echo.

echo Node.js 버전 확인 중...
node --version
if errorlevel 1 (
    echo 오류: Node.js가 설치되어 있지 않습니다.
    echo Node.js를 설치한 후 다시 시도해주세요.
    echo 다운로드: https://nodejs.org/
    pause
    exit /b 1
)

echo.
echo MySQL 연결 확인 중...
echo MySQL이 실행 중인지 확인해주세요.
echo.

echo 패키지 설치 중...
npm install
if errorlevel 1 (
    echo 오류: 패키지 설치에 실패했습니다.
    pause
    exit /b 1
)

echo.
echo ========================================
echo 서버를 시작합니다...
echo ========================================
echo.
echo 관리자 페이지: http://localhost:3000/pages/admin/login.html
echo 메인 사이트: http://localhost:3000
echo.
echo 관리자 계정:
echo - 사용자명: admin
echo - 비밀번호: adimin
echo.
echo 서버를 중지하려면 Ctrl+C를 누르세요.
echo.

npm start

pause
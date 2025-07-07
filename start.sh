#!/bin/bash

echo "========================================"
echo "    J-Violin 학원 관리 시스템 시작"
echo "========================================"
echo

# Node.js 버전 확인
echo "Node.js 버전 확인 중..."
if ! command -v node &> /dev/null; then
    echo "오류: Node.js가 설치되어 있지 않습니다."
    echo "Node.js를 설치한 후 다시 시도해주세요."
    echo "다운로드: https://nodejs.org/"
    exit 1
fi

node --version
echo

# MySQL 연결 안내
echo "MySQL 연결 확인 중..."
echo "MySQL이 실행 중인지 확인해주세요."
echo

# 패키지 설치
echo "패키지 설치 중..."
npm install
if [ $? -ne 0 ]; then
    echo "오류: 패키지 설치에 실패했습니다."
    exit 1
fi

echo
echo "========================================"
echo "서버를 시작합니다..."
echo "========================================"
echo
echo "관리자 페이지: http://localhost:3000/pages/admin/login.html"
echo "메인 사이트: http://localhost:3000"
echo
echo "관리자 계정:"
echo "- 사용자명: admin"
echo "- 비밀번호: adimin"
echo
echo "서버를 중지하려면 Ctrl+C를 누르세요."
echo

# 서버 시작
npm start
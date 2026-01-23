#!/bin/bash

# Supabase Edge Functions 테스트 스크립트
# 사용법: ./test-api.sh

# 설정
PROJECT_URL="https://zbqittvnenjgoimlixpn.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpicWl0dHZuZW5qZ29pbWxpeHBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxMjI1MjEsImV4cCI6MjA4MzY5ODUyMX0._oUth5WoSvuUwhMn52yxtLOCpXR6998bvGiG96q8M28"
FUNCTIONS_URL="${PROJECT_URL}/functions/v1"

# 색상 정의
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================"
echo "  Supabase Edge Functions 테스트"
echo "========================================"
echo ""

# 1. 회사코드 검증 테스트
echo -e "${YELLOW}[TEST 1] verify-company-code${NC}"
echo "요청: 존재하지 않는 회사코드 'TEST01'"
RESPONSE=$(curl -s -X POST \
  "${FUNCTIONS_URL}/verify-company-code" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -d '{"companyCode": "TEST01"}')
echo "응답: $RESPONSE"
echo ""

# 2. SMS 인증코드 발송 테스트
echo -e "${YELLOW}[TEST 2] send-sms${NC}"
echo "요청: 01099999999로 SIGNUP용 인증코드 발송"
RESPONSE=$(curl -s -X POST \
  "${FUNCTIONS_URL}/send-sms" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -d '{"phone": "01099999999", "purpose": "SIGNUP"}')
echo "응답: $RESPONSE"

# 인증코드 추출 (개발 모드에서만)
CODE=$(echo $RESPONSE | grep -o '"code":"[0-9]*"' | grep -o '[0-9]*')
if [ -n "$CODE" ]; then
  echo -e "${GREEN}인증코드: $CODE${NC}"
fi
echo ""

# 3. SMS 인증 확인 테스트
if [ -n "$CODE" ]; then
  echo -e "${YELLOW}[TEST 3] verify-sms${NC}"
  echo "요청: 01099999999, 코드 $CODE 검증"
  RESPONSE=$(curl -s -X POST \
    "${FUNCTIONS_URL}/verify-sms" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${ANON_KEY}" \
    -d "{\"phone\": \"01099999999\", \"code\": \"$CODE\", \"purpose\": \"SIGNUP\"}")
  echo "응답: $RESPONSE"
  echo ""
fi

# 4. 팀 목록 조회 테스트
echo -e "${YELLOW}[TEST 4] sites-teams${NC}"
echo "요청: siteId=1의 팀 목록"
RESPONSE=$(curl -s -X GET \
  "${FUNCTIONS_URL}/sites-teams?siteId=1" \
  -H "Authorization: Bearer ${ANON_KEY}")
echo "응답: $RESPONSE"
echo ""

# 5. 근로자 상태 확인 테스트
echo -e "${YELLOW}[TEST 5] auth-worker-status${NC}"
echo "요청: 존재하지 않는 workerId"
RESPONSE=$(curl -s -X GET \
  "${FUNCTIONS_URL}/auth-worker-status?workerId=00000000-0000-0000-0000-000000000000" \
  -H "Authorization: Bearer ${ANON_KEY}")
echo "응답: $RESPONSE"
echo ""

# 6. 토큰 갱신 테스트 (잘못된 토큰)
echo -e "${YELLOW}[TEST 6] auth-refresh${NC}"
echo "요청: 잘못된 refresh token"
RESPONSE=$(curl -s -X POST \
  "${FUNCTIONS_URL}/auth-refresh" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -d '{"refreshToken": "invalid_token"}')
echo "응답: $RESPONSE"
echo ""

echo "========================================"
echo "  테스트 완료"
echo "========================================"

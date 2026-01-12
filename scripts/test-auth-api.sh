#!/bin/bash
# TongPass 인증 API 수동 테스트 스크립트
# 사용법: ./scripts/test-auth-api.sh

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Supabase 설정
SUPABASE_URL="https://zbqittvnenjgoimlixpn.supabase.co"
FUNCTIONS_URL="${SUPABASE_URL}/functions/v1"

# 환경 변수에서 ANON KEY 읽기
if [ -z "$SUPABASE_ANON_KEY" ]; then
    echo -e "${YELLOW}[INFO] SUPABASE_ANON_KEY 환경 변수가 설정되지 않았습니다.${NC}"
    echo "다음 명령어로 실행하세요:"
    echo "SUPABASE_ANON_KEY='your-key' ./scripts/test-auth-api.sh"
    echo ""
    echo "또는 .env.local 파일에서 VITE_SUPABASE_ANON_KEY 값을 복사하세요."
    exit 1
fi

# API 호출 함수
call_api() {
    local endpoint=$1
    local data=$2
    local description=$3

    echo -e "\n${BLUE}=== $description ===${NC}"
    echo -e "${YELLOW}POST${NC} ${FUNCTIONS_URL}/${endpoint}"
    echo "Body: $data"
    echo ""

    response=$(curl -s -w "\n%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
        -d "$data" \
        "${FUNCTIONS_URL}/${endpoint}")

    # HTTP 상태 코드 분리
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    # 상태 코드에 따른 색상
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "Status: ${GREEN}$http_code${NC}"
    else
        echo -e "Status: ${RED}$http_code${NC}"
    fi

    # JSON 포맷팅 (jq가 있으면 사용)
    if command -v jq &> /dev/null; then
        echo "$body" | jq '.'
    else
        echo "$body"
    fi

    echo ""
}

# 메뉴 표시
show_menu() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE} TongPass 인증 API 테스트 도구${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    echo "1. SMS 발송 (회원가입)"
    echo "2. SMS 발송 (로그인)"
    echo "3. SMS 발송 (비밀번호 재설정)"
    echo "4. SMS 인증 확인"
    echo "5. 로그인"
    echo "6. 전체 테스트 실행"
    echo "7. 사용자 조회 (Supabase)"
    echo "0. 종료"
    echo ""
    read -p "선택하세요: " choice
}

# SMS 발송 테스트
test_send_sms() {
    local purpose=$1
    read -p "휴대폰 번호 입력 (예: 01012345678): " phone
    call_api "send-sms" "{\"phone\":\"$phone\",\"purpose\":\"$purpose\"}" "SMS 발송 ($purpose)"
}

# SMS 인증 확인
test_verify_sms() {
    read -p "휴대폰 번호: " phone
    read -p "인증번호 (6자리): " code
    read -p "목적 (SIGNUP/LOGIN/PASSWORD_RESET): " purpose
    call_api "verify-sms" "{\"phone\":\"$phone\",\"code\":\"$code\",\"purpose\":\"$purpose\"}" "SMS 인증 확인"
}

# 로그인 테스트
test_login() {
    read -p "휴대폰 번호: " phone
    read -sp "비밀번호: " password
    echo ""
    call_api "login" "{\"phone\":\"$phone\",\"password\":\"$password\"}" "로그인"
}

# 전체 테스트 실행
run_all_tests() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE} 전체 테스트 실행${NC}"
    echo -e "${BLUE}========================================${NC}"

    # TC-SMS-001: 잘못된 전화번호 형식
    call_api "send-sms" '{"phone":"02123456","purpose":"SIGNUP"}' "TC-SMS-001: 잘못된 전화번호 형식 (에러 예상)"

    # TC-SMS-002: 이미 등록된 번호로 회원가입 요청
    call_api "send-sms" '{"phone":"01095106236","purpose":"SIGNUP"}' "TC-SMS-002: 이미 등록된 번호로 SIGNUP (에러 예상)"

    # TC-SMS-003: 등록된 번호로 로그인 SMS
    call_api "send-sms" '{"phone":"01095106236","purpose":"LOGIN"}' "TC-SMS-003: 등록된 번호로 LOGIN SMS"

    # TC-LOGIN-001: 미등록 번호로 로그인
    call_api "login" '{"phone":"01000000000","password":"test1234"}' "TC-LOGIN-001: 미등록 번호 로그인 (에러 예상)"

    # TC-LOGIN-002: 잘못된 비밀번호
    call_api "login" '{"phone":"01095106236","password":"wrongpassword"}' "TC-LOGIN-002: 잘못된 비밀번호 (에러 예상)"

    # TC-LOGIN-003: 정상 로그인
    call_api "login" '{"phone":"01095106236","password":"a123123@"}' "TC-LOGIN-003: 정상 로그인"

    echo -e "\n${GREEN}========================================${NC}"
    echo -e "${GREEN} 테스트 완료${NC}"
    echo -e "${GREEN}========================================${NC}"
}

# 사용자 조회
query_user() {
    read -p "휴대폰 번호: " phone
    phone_normalized=$(echo $phone | sed 's/[^0-9]//g')

    echo -e "\n${BLUE}=== 사용자 조회 ===${NC}"
    echo "정규화된 번호: $phone_normalized"
    echo ""
    echo -e "${YELLOW}Supabase 대시보드에서 확인하세요:${NC}"
    echo "1. ${SUPABASE_URL} 접속"
    echo "2. Table Editor > users 테이블"
    echo "3. 필터: phone = $phone_normalized"
    echo ""
    echo "또는 SQL Editor에서:"
    echo "SELECT * FROM users WHERE phone = '$phone_normalized';"
}

# 메인 루프
main() {
    while true; do
        show_menu
        case $choice in
            1) test_send_sms "SIGNUP" ;;
            2) test_send_sms "LOGIN" ;;
            3) test_send_sms "PASSWORD_RESET" ;;
            4) test_verify_sms ;;
            5) test_login ;;
            6) run_all_tests ;;
            7) query_user ;;
            0) echo "종료합니다."; exit 0 ;;
            *) echo -e "${RED}잘못된 선택입니다.${NC}" ;;
        esac
    done
}

main

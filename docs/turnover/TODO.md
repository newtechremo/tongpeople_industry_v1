# 통패스 프로젝트 TODO 리스트

> 마지막 업데이트: 2026-01-23

---

## 긴급 (Critical)

### 1. 앱 출퇴근 버튼 클릭 시 "세션 만료" 에러

**증상:**
- 앱에서 로그인 후 출근/퇴근 버튼 클릭 시 "세션이 만료되었습니다. 다시 로그인해주세요." 메시지 출력
- Supabase Edge Function 로그에 요청이 도달하지 않음 (앱 단에서 차단)

**원인 분석:**
- `login-worker`는 커스텀 JWT 토큰 생성 (`jwt.ts`의 `generateTokens()`)
- 기존 `worker-me` 등 엔드포인트는 Supabase Auth의 `getUser(token)` 사용
- **토큰 시스템 불일치**: 커스텀 JWT ↔ Supabase Auth 토큰

**완료된 수정:**
- `worker-me`, `worker-commute-in`, `worker-commute-out`, `worker-qr-payload`, `worker-attendance-monthly` 함수들을 커스텀 JWT 검증으로 수정 완료

**남은 작업:**
1. Edge Functions 배포 필요:
   ```bash
   cd /home/remo/Desktop/project_YENA/HongTongWorkspace/tongpeople_industry_v1/backend/supabase
   npx supabase functions deploy worker-me worker-commute-in worker-commute-out worker-qr-payload worker-attendance-monthly --no-verify-jwt
   ```

2. Supabase에 `JWT_SECRET` 환경변수 설정 확인:
   ```bash
   npx supabase secrets set JWT_SECRET="your-secure-secret-key" --project-ref zbqittvnenjgoimlixpn
   ```

3. 배포 후 앱에서 로그아웃 → 재로그인 → 출근 버튼 테스트

**관련 파일:**
- `backend/supabase/functions/_shared/jwt.ts` - JWT 생성/검증 유틸
- `backend/supabase/functions/login-worker/index.ts` - 로그인 (토큰 생성)
- `backend/supabase/functions/worker-me/index.ts` - 내 정보 조회
- `apps/TongPassApp/src/api/client.ts` - API 클라이언트 (토큰 갱신)

---

### 2. 초대 링크 딥링크 개발

**현재 상태:**
- 관리자 웹에서 근로자 초대 시 SMS로 딥링크 발송됨: `tongpass://invite?token=XXX`
- 앱에서 딥링크 핸들링 **미구현**

**필요 작업:**

#### Android (`android/app/src/main/AndroidManifest.xml`)
```xml
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="tongpass" android:host="invite" />
</intent-filter>
```

#### iOS (`ios/TongPassApp/Info.plist`)
```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>tongpass</string>
        </array>
    </dict>
</array>
```

#### React Native 딥링크 핸들러
```typescript
// App.tsx 또는 RootNavigator.tsx
import { Linking } from 'react-native';

useEffect(() => {
  const handleDeepLink = (event: { url: string }) => {
    const url = new URL(event.url);
    if (url.protocol === 'tongpass:' && url.host === 'invite') {
      const token = url.searchParams.get('token');
      // 토큰 검증 API 호출 후 가입 플로우 진행
      navigation.navigate('InviteFlow', { token });
    }
  };

  Linking.addEventListener('url', handleDeepLink);
  Linking.getInitialURL().then(url => url && handleDeepLink({ url }));
}, []);
```

**플로우 (문서 참조: `docs/signin/가입_방식_FAQ.md`):**
```
링크 클릭 → 앱 실행 → 토큰 검증 → 휴대폰 인증 → 약관 동의 → 서명 → 즉시 ACTIVE
```

**관련 API:**
- `POST /verify-invitation-token` - 초대 토큰 검증
- 응답: 사용자 기본 정보 (이름, 전화번호, 팀 등)

---

## 높음 (High)

### 3. 출퇴근 기록 화면 실제 API 연동

**현재 상태:**
- `AttendanceHistoryScreen.tsx`가 **더미 데이터** 사용 중 (라인 77-131)
- TODO 주석: `// TODO: 실제 API 연동 (GET /attendance-history?year=&month=)`

**필요 작업:**
- `worker-attendance-monthly` API 호출 연동
- API: `GET /worker-attendance-monthly?year=2026&month=1`

**관련 파일:**
- `apps/TongPassApp/src/screens/main/AttendanceHistoryScreen.tsx`
- `backend/supabase/functions/worker-attendance-monthly/index.ts` (구현 완료)

---

### 4. 비밀번호 설정 플로우 완성

**현재 상태:**
- `PasswordSetupScreen.tsx` 구현 완료
- 네비게이션 플로우에 추가 필요

**필요 작업:**
1. `PhoneVerifyScreen` → `PasswordSetup` → `WorkerInfo` 순서로 변경
2. `register-worker` API에 password 파라미터 전달

**계획 문서:**
- `~/.claude/plans/synchronous-snuggling-spark.md`

---

## 중간 (Medium)

### 5. 푸시 알림 (FCM)

- 가입 승인/반려 알림
- 퇴근 미처리 리마인더

### 6. 프로필 수정 기능

- 이름, 이메일 등 개인정보 수정

### 7. 오프라인 모드

- 네트워크 없을 때 로컬 저장 후 동기화

---

## 낮음 (Low)

### 8. 앱 디버그 환경 개선

**현재 이슈:**
- 시스템 adb 버전(39)과 Android SDK adb 버전(41) 충돌
- 디버그 빌드 시 UNAUTHORIZED 에러 빈발

**해결 방법:**
```bash
# SDK adb 사용
export PATH="/home/remo/Android/Sdk/platform-tools:$PATH"
```

또는 `.bashrc`에 추가

---

## 참고 명령어

### Edge Functions 배포
```bash
cd backend/supabase
npx supabase functions deploy <function-name> --no-verify-jwt
```

### 앱 빌드 및 설치
```bash
cd apps/TongPassApp

# 릴리즈 빌드
cd android && ./gradlew assembleRelease && cd ..

# 설치
/home/remo/Android/Sdk/platform-tools/adb install -r android/app/build/outputs/apk/release/app-release.apk
```

### Supabase 로그 확인
```bash
npx supabase functions logs <function-name> --project-ref zbqittvnenjgoimlixpn
```

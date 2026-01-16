# 통패스 근로자 앱 개발 가이드

## 1. 개발 환경 설정

### 1.1 필수 요구사항

| 도구 | 버전 | 용도 |
|------|------|------|
| Node.js | 18+ (권장: 24.12.0) | 런타임 |
| Yarn | 1.22+ | 패키지 매니저 |
| Watchman | 최신 | 파일 감시 (macOS) |
| Ruby | 3.3.0 | iOS 빌드 (CocoaPods) |
| Xcode | 15+ | iOS 빌드 |
| Android Studio | 최신 | Android 빌드 |
| JDK | 17 | Android 빌드 |

### 1.2 프로젝트 설치

```bash
# 저장소 클론
git clone <repository-url>
cd TongPassApp

# Node.js 버전 확인 (nvm 사용 시)
nvm use

# 의존성 설치
yarn install

# iOS 의존성 설치 (macOS)
cd ios && pod install && cd ..
```

### 1.3 환경 변수 설정

```bash
# .env 파일 생성
cp .env.example .env
```

```bash
# .env
API_BASE_URL=https://api.tongpass.com
```

---

## 2. 개발 명령어

### 2.1 개발 서버

```bash
# Metro 번들러 시작
yarn start

# 캐시 초기화 후 시작
yarn start:reset
```

### 2.2 앱 실행

```bash
# iOS 시뮬레이터
yarn ios

# Android 에뮬레이터
yarn android

# 특정 기기 지정
yarn ios --simulator="iPhone 15 Pro"
yarn android --deviceId="emulator-5554"
```

### 2.3 빌드

```bash
# Android 릴리스 빌드
yarn android:build

# Android 클린 빌드
yarn android:clean

# iOS 빌드 (Xcode에서)
# Xcode > Product > Archive
```

### 2.4 테스트 및 린트

```bash
# 테스트 실행
yarn test

# 린트 검사
yarn lint

# 린트 자동 수정
yarn lint:fix
```

---

## 3. 프로젝트 구조

### 3.1 디렉토리 구조

```
src/
├── api/                  # API 통신
│   ├── client.ts         # Axios 설정
│   ├── auth.ts           # 인증 API
│   └── worker.ts         # 근로자 API
│
├── screens/              # 화면 컴포넌트
│   ├── auth/             # 인증 플로우
│   └── main/             # 메인 화면
│
├── navigation/           # 네비게이션
│   ├── RootNavigator.tsx
│   ├── AuthStack.tsx
│   └── MainStack.tsx
│
├── store/                # 상태 관리
│   └── atoms/            # Recoil Atoms
│
├── types/                # 타입 정의
├── constants/            # 상수
└── utils/                # 유틸리티
```

### 3.2 경로 별칭

```typescript
// @ 별칭 사용
import { colors } from '@/constants';
import { Worker } from '@/types';
import { isValidPhoneNumber } from '@/utils';
```

---

## 4. 코딩 컨벤션

### 4.1 파일 명명 규칙

| 유형 | 형식 | 예시 |
|------|------|------|
| 화면 | PascalCase + Screen | `HomeScreen.tsx` |
| 컴포넌트 | PascalCase | `Button.tsx` |
| 훅 | camelCase + use | `useAuth.ts` |
| API | camelCase | `auth.ts` |
| 타입 | camelCase | `user.ts` |
| 유틸 | camelCase | `validators.ts` |
| 상수 | camelCase | `colors.ts` |

### 4.2 컴포넌트 구조

```typescript
// 1. Imports (외부 → 내부)
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRecoilState } from 'recoil';

import { colors } from '@/constants';
import { Worker } from '@/types';
import { userInfoState } from '@/store/atoms';

// 2. Types/Interfaces
interface Props {
  worker: Worker;
  onPress: () => void;
}

// 3. Component
export const WorkerCard: React.FC<Props> = ({ worker, onPress }) => {
  // 3.1 State
  const [isLoading, setIsLoading] = useState(false);

  // 3.2 Hooks
  const [userInfo, setUserInfo] = useRecoilState(userInfoState);

  // 3.3 Effects
  useEffect(() => {
    // ...
  }, []);

  // 3.4 Handlers
  const handlePress = () => {
    setIsLoading(true);
    onPress();
  };

  // 3.5 Render
  return (
    <View style={styles.container}>
      <Text style={styles.name}>{worker.name}</Text>
    </View>
  );
};

// 4. Styles
const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: colors.background,
  },
  name: {
    fontSize: 16,
    color: colors.textPrimary,
  },
});
```

### 4.3 TypeScript 규칙

```typescript
// 타입은 types/ 폴더에 정의
import type { Worker, WorkerStatus } from '@/types';

// 컴포넌트 Props 타입
interface Props {
  worker: Worker;
  onSelect: (id: string) => void;
}

// React.FC 사용
export const WorkerCard: React.FC<Props> = ({ worker, onSelect }) => {
  // ...
};
```

---

## 5. 상태 관리

### 5.1 Recoil Atoms 사용

```typescript
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { authState, userInfoState, commuteStatusState } from '@/store/atoms';

// 읽기 전용
const auth = useRecoilValue(authState);

// 읽기/쓰기
const [userInfo, setUserInfo] = useRecoilState(userInfoState);

// 쓰기 전용
const setCommuteStatus = useSetRecoilState(commuteStatusState);
```

### 5.2 AsyncStorage 영속화

```typescript
// authAtom.ts
import { atom } from 'recoil';
import { getStorageData, setStorageData } from '@/utils/storage';

const localStorageEffect = (key: string) => ({ setSelf, onSet }) => {
  // 초기 로드
  getStorageData(key).then((savedValue) => {
    if (savedValue != null) {
      setSelf(savedValue);
    }
  });

  // 변경 시 저장
  onSet((newValue, _, isReset) => {
    isReset
      ? removeStorageData(key)
      : setStorageData(key, newValue);
  });
};

export const authState = atom({
  key: 'authState',
  default: { accessToken: null, refreshToken: null, isLoggedIn: false },
  effects: [localStorageEffect('auth')],
});
```

---

## 6. API 통신

### 6.1 API 함수 작성

```typescript
// api/auth.ts
import api from './client';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export const login = async (phone: string, code: string): Promise<LoginResponse> => {
  const response = await api.post('/login', { phone, code });
  return response.data;
};
```

### 6.2 화면에서 API 호출

```typescript
import { useState } from 'react';
import { verifyCompanyCode } from '@/api/auth';
import Toast from 'react-native-toast-message';

export const CompanyCodeScreen = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (code: string) => {
    try {
      setIsLoading(true);
      const result = await verifyCompanyCode(code);
      // 성공 처리
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: '오류',
        text2: '회사코드를 확인해주세요.',
      });
    } finally {
      setIsLoading(false);
    }
  };
};
```

---

## 7. 네비게이션

### 7.1 스택 간 이동

```typescript
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/types/navigation';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList>;

export const CompanyCodeScreen = () => {
  const navigation = useNavigation<NavigationProp>();

  const goToPhoneVerify = () => {
    navigation.navigate('PhoneVerify', {
      companyId: 'xxx',
      siteId: 'yyy',
    });
  };
};
```

### 7.2 파라미터 받기

```typescript
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { AuthStackParamList } from '@/types/navigation';

type RouteProps = RouteProp<AuthStackParamList, 'PhoneVerify'>;

export const PhoneVerifyScreen = () => {
  const route = useRoute<RouteProps>();
  const { companyId, siteId } = route.params;
};
```

---

## 8. 스타일링

### 8.1 색상 시스템

```typescript
import { colors } from '@/constants';

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  text: {
    color: colors.textPrimary,
  },
});
```

### 8.2 공통 스타일 패턴

```typescript
// 버튼 스타일
const buttonStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disabled: {
    backgroundColor: colors.buttonDisabled,
  },
});

// 입력 필드 스타일
const inputStyles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  focused: {
    borderColor: colors.borderFocus,
  },
  text: {
    fontSize: 16,
    color: colors.textPrimary,
  },
});
```

---

## 9. 유틸리티

### 9.1 유효성 검사

```typescript
import { isValidPhoneNumber, isValidBirthDate, isSenior } from '@/utils/validators';

// 전화번호 검증
if (!isValidPhoneNumber('01012345678')) {
  // 에러 처리
}

// 생년월일 검증
if (!isValidBirthDate('19900101')) {
  // 에러 처리
}

// 고령자 판별
const senior = isSenior('19590101'); // true (65세 이상)
```

### 9.2 포맷팅

```typescript
import { formatPhoneNumber, formatBirthDate } from '@/utils/format';

formatPhoneNumber('01012345678'); // '010-1234-5678'
formatBirthDate('19900101');      // '1990.01.01'
```

### 9.3 AsyncStorage

```typescript
import {
  setStorageData,
  getStorageData,
  removeStorageData,
  clearStorage,
} from '@/utils/storage';

// 저장
await setStorageData('accessToken', 'xxx');

// 조회
const token = await getStorageData<string>('accessToken');

// 삭제
await removeStorageData('accessToken');

// 전체 삭제
await clearStorage();
```

---

## 10. 테스트

### 10.1 테스트 실행

```bash
# 전체 테스트
yarn test

# 특정 파일
yarn test src/utils/validators.test.ts

# 커버리지
yarn test --coverage
```

### 10.2 테스트 작성

```typescript
// __tests__/validators.test.ts
import { isValidPhoneNumber, calculateAge } from '@/utils/validators';

describe('validators', () => {
  describe('isValidPhoneNumber', () => {
    it('should return true for valid phone numbers', () => {
      expect(isValidPhoneNumber('01012345678')).toBe(true);
    });

    it('should return false for invalid phone numbers', () => {
      expect(isValidPhoneNumber('0101234567')).toBe(false);
    });
  });

  describe('calculateAge', () => {
    it('should calculate age correctly', () => {
      const birthDate = '19900101';
      const age = calculateAge(birthDate);
      expect(age).toBeGreaterThanOrEqual(34);
    });
  });
});
```

---

## 11. 디버깅

### 11.1 React Native Debugger

```bash
# 설치 (macOS)
brew install react-native-debugger

# 실행
open "rndebugger://set-debugger-loc?host=localhost&port=8081"
```

### 11.2 Flipper

- Flipper 앱 설치: https://fbflipper.com/
- 네트워크 요청, 레이아웃, 로그 확인 가능

### 11.3 콘솔 로그

```typescript
// 개발 환경에서만 로그
if (__DEV__) {
  console.log('Debug:', data);
}
```

---

## 12. 배포

### 12.1 Android

```bash
# APK 빌드
yarn android:build

# 결과물 위치
# android/app/build/outputs/apk/release/app-release.apk
```

### 12.2 iOS

1. Xcode에서 프로젝트 열기
2. Signing & Capabilities 설정
3. Product > Archive
4. Distribute App

### 12.3 환경별 설정

```bash
# .env.development
API_BASE_URL=https://dev-api.tongpass.com

# .env.production
API_BASE_URL=https://api.tongpass.com
```

---

## 13. 트러블슈팅

### 13.1 캐시 초기화

```bash
# Metro 캐시 초기화
yarn start:reset

# Watchman 초기화
watchman watch-del-all

# node_modules 재설치
rm -rf node_modules && yarn install

# iOS Pods 재설치
cd ios && rm -rf Pods && pod install && cd ..

# Android 클린 빌드
yarn android:clean
```

### 13.2 흔한 에러

**CocoaPods 에러**
```bash
cd ios && pod deintegrate && pod install && cd ..
```

**Android 빌드 에러**
```bash
cd android && ./gradlew clean && cd ..
```

**Metro 연결 실패**
```bash
adb reverse tcp:8081 tcp:8081
```

---

## 14. 관련 문서

- [프로젝트 개요](./PROJECT-OVERVIEW.md)
- [기술 아키텍처](./ARCHITECTURE.md)
- [API 명세](./API.md)

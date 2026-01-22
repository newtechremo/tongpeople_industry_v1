# 빌드 가이드

TongPass 모바일 앱 빌드 가이드입니다. 상황에 맞는 빌드 방법을 선택하세요.

## 빠른 선택 가이드

| 상황 | 빌드 명령어 |
|------|------------|
| **일반 개발/테스트** | `yarn android` |
| **에뮬레이터 테스트** | `yarn android:emu` |
| **실기기 APK 설치** | `yarn android:build` |
| **Play Store 출시** | `yarn android:release-full` |

## 사전 준비

### 빌드 전 확인사항

```bash
# 1. 메모리 확인 (최소 4GB 여유 권장)
free -h

# 2. 무거운 앱 종료 (OOM 방지)
pkill -f chrome 2>/dev/null

# 3. 프로젝트 디렉토리 이동
cd apps/TongPassApp
```

### 의존성 설치

```bash
yarn install
```

## Android 빌드

### 1. 개발 빌드 (Debug)

일상적인 개발 및 테스트용. **가장 빠르고 가볍습니다.**

```bash
# Metro 시작 + 앱 실행
yarn android

# 또는 수동으로
yarn start &
cd android && ./gradlew assembleDebug
```

**특징:**
- arm64-v8a 아키텍처만 빌드 (경량화 적용됨)
- 핫 리로딩 지원
- 디버깅 도구 포함

### 2. 에뮬레이터 전용 빌드

x86_64 아키텍처가 필요한 에뮬레이터용.

```bash
cd android
./gradlew assembleDebug -PreactNativeArchitectures=x86_64
```

또는 package.json 스크립트 사용:

```bash
yarn android:emu
```

### 3. 릴리스 빌드 (Release APK)

실기기 배포용. 최적화되고 서명됨.

```bash
cd android
./gradlew assembleRelease
```

**APK 위치:** `android/app/build/outputs/apk/release/app-release.apk`

### 4. Play Store 출시용 (AAB)

Google Play Store 업로드용 Android App Bundle.

```bash
cd android

# arm64 + arm (대부분의 기기 지원)
./gradlew bundleRelease -PreactNativeArchitectures=armeabi-v7a,arm64-v8a
```

**AAB 위치:** `android/app/build/outputs/bundle/release/app-release.aab`

## iOS 빌드

### 1. 개발 빌드

```bash
# Pods 설치 (최초 또는 의존성 변경 시)
cd ios && pod install && cd ..

# 시뮬레이터 실행
yarn ios
```

### 2. 릴리스 빌드

Xcode에서 Archive 후 App Store Connect 업로드.

```bash
cd ios
xcodebuild -workspace TongPassApp.xcworkspace -scheme TongPassApp -configuration Release
```

## 빌드 옵션 상세

### 아키텍처 옵션

| 아키텍처 | 대상 기기 | 용도 |
|----------|----------|------|
| `arm64-v8a` | 최신 Android 폰/태블릿 | **기본값 (권장)** |
| `armeabi-v7a` | 구형 32비트 기기 | 레거시 지원 |
| `x86_64` | Android 에뮬레이터 | 개발/테스트 |
| `x86` | 구형 에뮬레이터 | 거의 사용 안 함 |

```bash
# 특정 아키텍처 지정
./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a

# 복수 아키텍처
./gradlew assembleRelease -PreactNativeArchitectures=armeabi-v7a,arm64-v8a
```

### 메모리 설정

`android/gradle.properties`에서 조정:

```properties
# 저사양 PC (8GB RAM)
org.gradle.jvmargs=-Xmx1024m -XX:MaxMetaspaceSize=256m
org.gradle.workers.max=1

# 일반 PC (16GB RAM) - 현재 설정
org.gradle.jvmargs=-Xmx1536m -XX:MaxMetaspaceSize=384m
org.gradle.workers.max=2

# 고사양 PC (32GB+ RAM)
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=512m
org.gradle.workers.max=4
```

## 빌드 캐시 관리

### 캐시 정리 (빌드 문제 시)

```bash
cd apps/TongPassApp

# Gradle 캐시 정리
cd android && ./gradlew clean && cd ..

# Metro 캐시 정리
yarn start --reset-cache

# node_modules 재설치
rm -rf node_modules && yarn install

# 전체 정리 (최후의 수단)
cd android && ./gradlew clean && cd ..
rm -rf node_modules
rm -rf ios/Pods
yarn install
cd ios && pod install && cd ..
```

## 문제 해결

### OOM (Out of Memory) 발생 시

1. Chrome 등 무거운 앱 종료
2. 아키텍처를 단일로 제한
3. Gradle 메모리 설정 낮추기
4. earlyoom 설치

```bash
sudo apt install earlyoom
sudo systemctl enable earlyoom
```

**상세 분석:** [OOM 빌드 에러 분석 (2026-01-19)](logs/2026-01-19-oom-build-error.md)

### 빌드 실패 시 체크리스트

- [ ] Java 17+ 설치 확인: `java -version`
- [ ] Android SDK 설정 확인: `echo $ANDROID_HOME`
- [ ] NDK 버전 확인: gradle.properties의 `android.ndkVersion`
- [ ] node_modules 상태: `yarn install` 재실행
- [ ] Gradle 캐시: `./gradlew clean`

## package.json 스크립트 (권장 추가)

```json
{
  "scripts": {
    "android": "react-native run-android",
    "android:emu": "cd android && ./gradlew assembleDebug -PreactNativeArchitectures=x86_64",
    "android:build": "cd android && ./gradlew assembleRelease",
    "android:release-full": "cd android && ./gradlew bundleRelease -PreactNativeArchitectures=armeabi-v7a,arm64-v8a",
    "android:clean": "cd android && ./gradlew clean"
  }
}
```

## 관련 문서

- [개발 환경 설정](DEVELOPMENT.md)
- [프로젝트 아키텍처](ARCHITECTURE.md)
- [에러 로그 기록](logs/)

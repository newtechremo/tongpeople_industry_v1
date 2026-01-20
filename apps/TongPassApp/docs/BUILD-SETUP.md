# TongPassApp 릴리스 빌드 환경 설정 가이드

다른 PC에서 Android/iOS 릴리스 빌드를 수행하기 위한 환경 설정 가이드입니다.

---

## 1. 버전 정보

### 1.1 앱 버전
| 항목 | 값 |
|------|-----|
| App Name | TongPassApp |
| Version Name | 1.0.0 |
| Version Code | 1 |
| Application ID (Android) | com.tongpassapp |
| Bundle ID (iOS) | com.tongpassapp |

### 1.2 필수 소프트웨어 버전

| 소프트웨어 | 최소 버전 | 권장 버전 | 플랫폼 | 비고 |
|-----------|----------|----------|--------|------|
| **Node.js** | 18.x | 20.x LTS | 공통 | `node -v`로 확인 |
| **Yarn** | 1.22.x | 1.22.x | 공통 | `yarn -v`로 확인 |
| **Watchman** | - | 최신 | macOS | Metro 파일 감시 |
| **JDK** | 17 | 17 | Android | `java -version`으로 확인 |
| **Android Studio** | Hedgehog (2023.1.1) | 최신 | Android | Android SDK 관리 |
| **Xcode** | 15.0 | 15.x | iOS | macOS 전용 |
| **Ruby** | 2.6.10 | 2.7.5 | iOS | `.ruby-version` 참조 |
| **CocoaPods** | 1.13.x | 1.13.x | iOS | `Gemfile` 참조 |

### 1.3 Android SDK 버전

| 항목 | 버전 |
|------|------|
| compileSdkVersion | 34 |
| targetSdkVersion | 34 |
| minSdkVersion | 23 |
| buildToolsVersion | 34.0.0 |
| NDK Version | 26.1.10909125 |
| Kotlin Version | 1.7.20 |

### 1.4 주요 의존성 버전

| 패키지 | 버전 |
|--------|------|
| react-native | 0.74.6 |
| react | 18.2.0 |
| typescript | 5.0.4 |
| recoil | 0.7.7 |
| axios | 1.6.2 |

---

## 2. 환경 설정

### 2.1 JDK 17 설치

#### Windows
```powershell
# Chocolatey 사용
choco install openjdk17

# 또는 수동 설치
# https://adoptium.net/temurin/releases/?version=17
```

#### macOS
```bash
# Homebrew 사용
brew install openjdk@17

# 환경변수 설정
echo 'export JAVA_HOME=$(/usr/libexec/java_home -v 17)' >> ~/.zshrc
source ~/.zshrc
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install openjdk-17-jdk

# 환경변수 설정
echo 'export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64' >> ~/.bashrc
source ~/.bashrc
```

#### 설치 확인
```bash
java -version
# openjdk version "17.x.x" 출력 확인

echo $JAVA_HOME
# JDK 경로 출력 확인
```

### 2.2 Android SDK 설치

#### Android Studio에서 설치
1. Android Studio 설치: https://developer.android.com/studio
2. **SDK Manager** 열기: `Tools > SDK Manager`
3. 필수 항목 설치:
   - **SDK Platforms** 탭:
     - Android 14 (API 34)
   - **SDK Tools** 탭:
     - Android SDK Build-Tools 34.0.0
     - Android SDK Command-line Tools
     - Android SDK Platform-Tools
     - NDK (Side by side) 26.1.10909125

#### 환경변수 설정

**Windows** (PowerShell 관리자 권한):
```powershell
[Environment]::SetEnvironmentVariable("ANDROID_HOME", "$env:LOCALAPPDATA\Android\Sdk", "User")
[Environment]::SetEnvironmentVariable("Path", "$env:Path;$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\tools", "User")
```

**macOS/Linux**:
```bash
# ~/.zshrc 또는 ~/.bashrc에 추가
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

#### local.properties 설정
```bash
# apps/TongPassApp/android/local.properties 파일 생성 (자동 생성되지 않은 경우)
echo "sdk.dir=/path/to/your/Android/Sdk" > android/local.properties
```

**경로 예시**:
- Windows: `sdk.dir=C:\\Users\\{username}\\AppData\\Local\\Android\\Sdk`
- macOS: `sdk.dir=/Users/{username}/Library/Android/sdk`
- Linux: `sdk.dir=/home/{username}/Android/Sdk`

### 2.3 Node.js 설치

#### nvm 사용 (권장)
```bash
# nvm 설치 (Linux/macOS)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Node.js 20 LTS 설치
nvm install 20
nvm use 20
```

#### 직접 설치
- https://nodejs.org/en/download/ 에서 LTS 버전 다운로드

### 2.4 Yarn 설치
```bash
npm install -g yarn
yarn -v  # 버전 확인
```

### 2.5 Watchman 설치 (macOS 권장)

Metro 번들러의 파일 변경 감지 성능을 위해 Watchman 설치를 권장합니다.

```bash
# macOS
brew install watchman

# 설치 확인
watchman --version
```

> **참고**: Linux/Windows에서는 선택사항이지만, 대규모 프로젝트에서 Metro 성능 향상에 도움이 됩니다.

### 2.6 iOS 빌드 환경 (macOS 전용)

iOS 빌드는 macOS에서만 가능합니다.

#### Xcode 설치
1. App Store에서 Xcode 15+ 설치
2. Command Line Tools 설치:
   ```bash
   xcode-select --install
   ```
3. 라이선스 동의:
   ```bash
   sudo xcodebuild -license accept
   ```

#### Ruby 설치 (rbenv 권장)
```bash
# rbenv 설치
brew install rbenv ruby-build

# 환경변수 설정
echo 'eval "$(rbenv init -)"' >> ~/.zshrc
source ~/.zshrc

# Ruby 2.7.5 설치 (.ruby-version에 명시된 버전)
rbenv install 2.7.5
rbenv local 2.7.5

# 버전 확인
ruby -v  # 2.7.5 출력 확인
```

#### Bundler 및 CocoaPods 설치
```bash
# 프로젝트 디렉토리에서
cd apps/TongPassApp

# Bundler 설치
gem install bundler

# Gemfile 기반 의존성 설치 (CocoaPods, Fastlane 포함)
bundle install

# 또는 CocoaPods만 설치
gem install cocoapods

# CocoaPods 버전 확인
pod --version  # 1.13.x 확인
```

#### iOS 의존성 설치
```bash
cd ios
bundle exec pod install  # 또는 pod install
cd ..
```

---

## 3. 프로젝트 설정

### 3.1 저장소 클론 및 의존성 설치
```bash
# 저장소 클론
git clone <repository-url>
cd tongpeople_industry_v1/apps/TongPassApp

# 의존성 설치
yarn install
```

### 3.2 환경 변수 설정
```bash
# .env 파일 생성
cp .env.example .env

# .env 파일 편집
# BASEURL=https://your-api-server.com
```

**.env 파일 내용**:
```bash
# API Server URL
BASEURL=https://api.tongpass.com

# 개발 환경에서는 로컬 서버 사용
# BASEURL=http://localhost:3000
```

---

## 4. Android 릴리스 빌드

### 4.1 현재 서명 설정 (개발용)

현재 프로젝트는 **debug keystore**를 사용하여 릴리스 빌드를 생성합니다.
이는 내부 테스트/배포용이며, Play Store 배포에는 별도 릴리스 키스토어가 필요합니다.

**현재 build.gradle 설정**:
```groovy
signingConfigs {
    debug {
        storeFile file('debug.keystore')
        storePassword 'android'
        keyAlias 'androiddebugkey'
        keyPassword 'android'
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.debug  // 현재는 debug 키 사용
        ...
    }
}
```

### 4.2 릴리스 빌드 실행

```bash
# 프로젝트 루트에서
cd apps/TongPassApp

# 릴리스 APK 빌드
yarn android:build

# 또는 직접 실행
cd android && ./gradlew assembleRelease
```

**빌드 결과물 위치**:
```
android/app/build/outputs/apk/release/app-release.apk
```

### 4.3 프로덕션 릴리스 키스토어 생성 (Play Store 배포 시)

#### 키스토어 생성
```bash
keytool -genkeypair -v \
  -keystore tongpass-release.keystore \
  -alias tongpass-key \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

**입력 정보 예시**:
- 키스토어 비밀번호: (안전한 비밀번호 입력)
- 키 비밀번호: (안전한 비밀번호 입력)
- 이름: TongPass
- 조직 단위: Development
- 조직: YourCompany
- 도시: Seoul
- 시/도: Seoul
- 국가 코드: KR

#### gradle.properties에 서명 정보 추가
```properties
# android/gradle.properties에 추가
TONGPASS_RELEASE_STORE_FILE=tongpass-release.keystore
TONGPASS_RELEASE_KEY_ALIAS=tongpass-key
TONGPASS_RELEASE_STORE_PASSWORD=your_store_password
TONGPASS_RELEASE_KEY_PASSWORD=your_key_password
```

#### build.gradle 수정 (app/build.gradle)
```groovy
signingConfigs {
    debug { ... }
    release {
        if (project.hasProperty('TONGPASS_RELEASE_STORE_FILE')) {
            storeFile file(TONGPASS_RELEASE_STORE_FILE)
            storePassword TONGPASS_RELEASE_STORE_PASSWORD
            keyAlias TONGPASS_RELEASE_KEY_ALIAS
            keyPassword TONGPASS_RELEASE_KEY_PASSWORD
        }
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        ...
    }
}
```

> **주의**: 키스토어 파일(.keystore)과 비밀번호는 절대 git에 커밋하지 마세요!
> `.gitignore`에 `*.keystore`와 서명 정보가 포함된 파일을 추가하세요.

---

## 5. iOS 빌드 (macOS 전용)

### 5.1 iOS 버전 정보
| 항목 | 값 |
|------|-----|
| iOS Deployment Target | 14.0 |
| Bundle ID | com.tongpassapp |

### 5.2 개발 빌드
```bash
# 시뮬레이터에서 실행
yarn ios

# 특정 시뮬레이터 지정
yarn ios --simulator="iPhone 15 Pro"

# 실제 기기에서 실행 (기기 연결 필요)
yarn ios --device
```

### 5.3 릴리스 빌드 (Archive)
1. Xcode에서 `ios/TongPassApp.xcworkspace` 열기
2. **Signing & Capabilities**에서 Team 및 Bundle ID 설정
3. 스킴을 **Release**로 변경
4. **Product > Archive** 실행
5. **Distribute App**으로 배포

### 5.4 App Store 배포 준비
- Apple Developer 계정 필요
- App Store Connect에서 앱 등록
- Provisioning Profile 및 인증서 설정
- Fastlane 사용 시 자동화 가능 (Gemfile에 포함됨)

---

## 6. 네이티브 모듈 설정

### 6.1 react-native-reanimated

이 프로젝트는 **react-native-reanimated**를 사용합니다.

**babel.config.js 설정** (이미 구성됨):
```javascript
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // ... 다른 플러그인들
    'react-native-reanimated/plugin',  // 반드시 마지막에 위치
  ],
};
```

> **중요**: `react-native-reanimated/plugin`은 항상 plugins 배열의 **마지막**에 위치해야 합니다.

**캐시 초기화** (변경 후 필요):
```bash
yarn start --reset-cache
```

### 6.2 react-native-gesture-handler

**Android**: 자동 링킹으로 설정 완료

**iOS**: `pod install` 실행 시 자동 설치

### 6.3 react-native-svg

QR 코드 생성(`react-native-qrcode-svg`)에서 사용합니다.

**Android/iOS**: 자동 링킹으로 설정 완료

### 6.4 @react-native-async-storage/async-storage

인증 토큰 및 사용자 데이터 저장에 사용됩니다.

**Android/iOS**: 자동 링킹으로 설정 완료

---

## 7. 빌드 명령어 요약

### 공통
| 명령어 | 설명 |
|--------|------|
| `yarn install` | Node.js 의존성 설치 |
| `yarn start` | Metro 번들러 시작 |
| `yarn start:reset` | Metro 캐시 초기화 후 시작 |
| `yarn lint` | ESLint 코드 검사 |
| `yarn test` | Jest 테스트 실행 |

### Android
| 명령어 | 설명 |
|--------|------|
| `yarn android` | Android 개발 빌드 실행 |
| `yarn android:build` | Android 릴리스 APK 생성 |
| `yarn android:clean` | Android 빌드 캐시 정리 |

### iOS (macOS 전용)
| 명령어 | 설명 |
|--------|------|
| `cd ios && pod install` | CocoaPods 의존성 설치 |
| `yarn ios` | iOS 시뮬레이터 실행 |
| `yarn ios --device` | 실제 iOS 기기 실행 |

### Ruby/Bundler (iOS)
| 명령어 | 설명 |
|--------|------|
| `bundle install` | Gemfile 의존성 설치 |
| `bundle exec pod install` | Bundler 경유 Pod 설치 |
| `bundle exec fastlane` | Fastlane 실행 |

---

## 8. 트러블슈팅

### Android 관련

#### 8.1 SDK 경로 오류
```
SDK location not found. Define location with sdk.dir in local.properties
```

**해결**: `android/local.properties` 파일에 SDK 경로 설정
```properties
sdk.dir=/path/to/your/Android/Sdk
```

#### 8.2 JDK 버전 오류
```
Unsupported class file major version 65
```

**해결**: JDK 17 설치 및 JAVA_HOME 환경변수 설정 확인
```bash
java -version  # 17.x.x 확인
echo $JAVA_HOME  # 경로 확인
```

#### 8.3 Gradle 빌드 실패
```bash
# Gradle 캐시 정리
cd android && ./gradlew clean
cd android && ./gradlew --stop

# node_modules 재설치
rm -rf node_modules
yarn install
```

#### 8.4 Metro 연결 실패 (Android)
```bash
# ADB 포트 포워딩
adb reverse tcp:8081 tcp:8081
```

#### 8.5 NDK 버전 오류
```
No version of NDK matched the requested version
```

**해결**: Android Studio SDK Manager에서 NDK 26.1.10909125 설치

#### 8.6 메모리 부족 오류
```
Java heap space / Out of memory
```

**해결**: `android/gradle.properties`에서 메모리 설정 확인
```properties
org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m
```

필요시 메모리 증가:
```properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m
```

### iOS 관련

#### 8.7 CocoaPods 오류
```
[!] CDN: trunk URL couldn't be downloaded
```

**해결**:
```bash
# Podfile의 source 변경 또는 repo 업데이트
pod repo update

# 또는 캐시 정리 후 재설치
cd ios
rm -rf Pods Podfile.lock
pod install
```

#### 8.8 Xcode 빌드 오류
```
error: Signing for "TongPassApp" requires a development team
```

**해결**: Xcode에서 Signing & Capabilities 설정
1. TongPassApp 타겟 선택
2. Signing & Capabilities 탭
3. Team 선택 (Apple Developer 계정 필요)

#### 8.9 Ruby 버전 불일치
```
Your Ruby version is X.X.X, but your Gemfile specified 2.7.5
```

**해결**:
```bash
# rbenv로 올바른 버전 설치
rbenv install 2.7.5
rbenv local 2.7.5
ruby -v  # 버전 확인
```

#### 8.10 pod install 실패
```
[!] CocoaPods could not find compatible versions
```

**해결**:
```bash
cd ios
rm -rf Pods Podfile.lock
bundle exec pod install --repo-update
```

### 공통

#### 8.11 react-native-reanimated 오류
```
Reanimated 2 failed to create a worklet
```

**해결**:
1. babel.config.js에서 `'react-native-reanimated/plugin'`이 마지막에 있는지 확인
2. Metro 캐시 초기화:
   ```bash
   yarn start --reset-cache
   ```
3. 필요시 node_modules 재설치:
   ```bash
   rm -rf node_modules
   yarn install
   ```

#### 8.12 Metro 캐시 문제
```
Unable to resolve module / Module not found
```

**해결**:
```bash
# 전체 캐시 초기화
watchman watch-del-all  # macOS
rm -rf node_modules
rm -rf $TMPDIR/metro-*
yarn install
yarn start --reset-cache
```

---

## 9. 버전 업데이트

앱 버전 업데이트 시 수정해야 할 파일:

### 9.1 package.json
```json
{
  "version": "1.0.1"  // version 필드 수정
}
```

### 9.2 android/app/build.gradle
```groovy
defaultConfig {
    versionCode 2           // 정수, 매 배포마다 증가
    versionName "1.0.1"     // 표시용 버전
}
```

### 9.3 iOS
- `ios/TongPassApp/Info.plist` 파일:
  - `CFBundleShortVersionString`: 표시용 버전 (예: "1.0.1")
  - `CFBundleVersion`: 빌드 번호 (예: "2")

---

## 10. 체크리스트

### 공통 (Android/iOS)
- [ ] Node.js 18+ 설치 (`node -v`)
- [ ] Yarn 설치 (`yarn -v`)
- [ ] Git 설치 (`git --version`)
- [ ] 저장소 클론 완료
- [ ] `yarn install` 의존성 설치 완료
- [ ] `.env` 파일 생성 및 BASEURL 설정

### Android 빌드
- [ ] JDK 17 설치 (`java -version`)
- [ ] JAVA_HOME 환경변수 설정 (`echo $JAVA_HOME`)
- [ ] Android Studio 설치
- [ ] Android SDK 설치 (API 34)
- [ ] ANDROID_HOME 환경변수 설정
- [ ] SDK Build-Tools 34.0.0 설치
- [ ] NDK 26.1.10909125 설치
- [ ] `android/local.properties` SDK 경로 설정
- [ ] `yarn android:build` 빌드 성공 확인

### iOS 빌드 (macOS 전용)
- [ ] Xcode 15+ 설치
- [ ] Command Line Tools 설치 (`xcode-select --install`)
- [ ] Watchman 설치 (`brew install watchman`)
- [ ] Ruby 2.7.5 설치 (`ruby -v`)
- [ ] Bundler 설치 (`gem install bundler`)
- [ ] `bundle install` 실행
- [ ] `cd ios && pod install` 실행
- [ ] `yarn ios` 시뮬레이터 빌드 성공 확인

---

## 11. Gemfile 의존성

iOS 빌드 및 CI/CD를 위한 Ruby 의존성입니다.

```ruby
# Gemfile 내용
source 'https://rubygems.org'

ruby ">= 2.6.10"

gem 'cocoapods', '~> 1.13'      # iOS 의존성 관리
gem 'activesupport', '>= 6.1.7.3', '< 7.1.0'
gem 'fastlane', '~> 2.219'      # CI/CD 자동화 (선택)
```

**설치**:
```bash
cd apps/TongPassApp
bundle install
```

---

## 관련 문서

- [개발 가이드](./DEVELOPMENT.md) - 개발 환경 및 코딩 컨벤션
- [API 명세](./API.md) - 백엔드 API 연동
- [아키텍처](./ARCHITECTURE.md) - 기술 스택 및 구조

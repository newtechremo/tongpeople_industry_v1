# OOM 빌드 에러 분석 (2026-01-19)

## 증상

앱 빌드 중 컴퓨터가 **강제 종료**됨 (화면 꺼짐, 재부팅 필요)

---

## 발생 이력

| 발생일시 | 트리거 | Kill 순서 | 결과 |
|----------|--------|-----------|------|
| 2026-01-18 17:17~17:46 | Gradle 빌드 (4개 아키텍처) | Chrome → Java → Claude → gnome-shell → Xorg | 화면 꺼짐 |
| **2026-01-19 09:47~10:32** | Gradle 빌드 | Chrome(11회) → Java → Claude(3회) → gnome-shell(4회) → Xorg | 화면 꺼짐 |
| **2026-01-19 12:29~12:51** | Gradle 빌드 | Chrome → Java → Claude → gnome-shell → Xorg | 화면 꺼짐 |
| **2026-01-19 13:34~13:40** | Gradle 빌드 | Java(2회) → Claude → gnome-shell(3회) → Docker → bash | 강제 종료 |

> **2026-01-19 하루에만 3번 발생.** Gradle 경량화 적용 후에도 재발.

---

## 원인 분석

### 시스템 로그 (최신: 2026-01-19 13:34~13:40)

```bash
journalctl -b -1 -p err | grep -i "oom\|kill\|memory"
```

```
1월 19 13:34:04 kernel: Out of memory: Killed process 219662 (java)       # Gradle
1월 19 13:35:03 kernel: Out of memory: Killed process 220159 (java)       # Gradle 2차
1월 19 13:35:40 kernel: Out of memory: Killed process 216971 (claude)     # Claude Code
1월 19 13:36:07 kernel: Out of memory: Killed process 214798 (gnome-shell)
1월 19 13:36:55 kernel: Out of memory: Killed process 243594 (gnome-shell)
1월 19 13:37:35 kernel: Out of memory: Killed process 243803 (gnome-shell)
1월 19 13:38:42 kernel: Out of memory: Killed process 1743 (dockerd)
1월 19 13:40:13 kernel: Out of memory: Killed process 244206 (bash)
```

### 근본 원인

1. ~~**빌드 시 4개 아키텍처 동시 컴파일**~~ → ✅ 해결됨 (arm64-v8a 단일)
2. **동시 실행 프로세스 과다**: Chrome + Claude Code + Gradle + Docker
3. **earlyoom 미설치**: 커널 OOM killer가 너무 늦게 동작 → Xorg까지 kill됨
4. **총 메모리 사용량 > 31GB RAM + 8GB 스왑**

### 시스템 사양

| 항목 | 값 |
|------|-----|
| OS | Ubuntu 22.04 (Linux 5.15.0-139) |
| RAM | 31GB |
| 스왑 | ~~8GB~~ → **16GB** (2026-01-19 변경) |
| 플랫폼 | linux x86_64 |

## 해결 방법

### 1. ✅ Gradle 설정 경량화 (적용됨, 그러나 불충분)

**파일**: `apps/TongPassApp/android/gradle.properties`

```properties
# 현재 설정
org.gradle.jvmargs=-Xmx1536m -XX:MaxMetaspaceSize=384m
reactNativeArchitectures=arm64-v8a
org.gradle.workers.max=2
org.gradle.daemon=false
```

> ⚠️ **이 설정만으로는 해결되지 않음.** 아래 조치들과 함께 적용해야 함.

### 2. ✅ earlyoom 설치 (완료!)

**현재 상태:** ✅ 설치됨 (2026-01-19)

earlyoom은 메모리가 부족해지기 **전에** 가장 무거운 프로세스를 종료하여 시스템 전체 장애를 방지한다.

```bash
# 설치
sudo apt install earlyoom

# 활성화 및 시작
sudo systemctl enable earlyoom
sudo systemctl start earlyoom

# 상태 확인
systemctl status earlyoom
```

**왜 필요한가?**
- 커널 OOM killer는 **너무 늦게** 동작 (이미 스왑 포화 상태)
- Xorg, gnome-shell 같은 **핵심 프로세스를 kill**하여 화면 꺼짐
- earlyoom은 **메모리 10% 남았을 때** 미리 조치

### 3. 빌드 전 프로세스 정리 (필수!)

```bash
# 빌드 전 실행
pkill -f chrome 2>/dev/null
pkill -f "Claude Code" 2>/dev/null  # Claude Code도 75GB+ 가상 메모리 사용
docker stop $(docker ps -q) 2>/dev/null  # Docker 컨테이너 정지
```

**프로세스별 메모리 사용량 (로그 기준):**

| 프로세스 | 가상 메모리 | anon-rss (실제) |
|----------|------------|-----------------|
| Chrome | ~1.4TB (가상) | 60~160MB |
| Claude Code | ~75GB (가상) | 130~320MB |
| Gradle (Java) | ~9GB | 60~140MB |
| gnome-shell | ~6GB | 50~260MB |

### 4. 추가 권장 설정

#### 스왑 증가 (현재 8GB → 16GB 권장)

```bash
# 기존 스왑 비활성화
sudo swapoff /swapfile

# 16GB 스왑 파일 생성
sudo fallocate -l 16G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

#### Gradle 추가 경량화 (저사양 모드)

```properties
# 극한 경량화 (8GB RAM 이하 PC용)
org.gradle.jvmargs=-Xmx1024m -XX:MaxMetaspaceSize=256m
org.gradle.workers.max=1
```

## 적용 상태

| 조치 | 상태 | 효과 |
|------|:----:|------|
| Gradle 경량화 | ✅ | 빌드 메모리 ~30% 감소 |
| earlyoom 설치 | ✅ | **핵심!** 화면 꺼짐 방지 |
| 빌드 전 프로세스 정리 | ⚠️ | 메모리 여유 확보 (권장) |
| 스왑 16GB | ✅ | 버퍼 영역 2배 확대 |

## 진단 명령어 참고

```bash
# 이전 부팅 에러 로그
journalctl -b -1 -p err

# OOM/과열/패닉 확인
dmesg | grep -iE "oom|kill|thermal|temperature|critical|panic"

# 실시간 메모리 모니터링
watch -n 1 'free -h'

# CPU 온도 확인 (lm-sensors 필요)
sensors
```

---

## 즉시 조치 사항

빌드 전 아래 명령어를 **순서대로** 실행:

```bash
# 1. earlyoom 설치 (한 번만)
sudo apt install earlyoom && sudo systemctl enable earlyoom && sudo systemctl start earlyoom

# 2. 빌드 전 메모리 확보
pkill -f chrome 2>/dev/null
docker stop $(docker ps -q) 2>/dev/null

# 3. 메모리 여유 확인 (최소 10GB 여유 권장)
free -h

# 4. 빌드 실행
cd apps/TongPassApp/android && ./gradlew assembleRelease
```

> **참고:** Claude Code는 빌드 중 사용해도 되나, Chrome은 반드시 종료해야 함.

---

## 관련 문서

- [빌드 가이드](../BUILD_GUIDE.md) - 상황별 빌드 명령어
- [개발 환경 설정](../DEVELOPMENT.md)

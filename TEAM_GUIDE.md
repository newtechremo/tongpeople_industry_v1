# 팀 배포 가이드

프로젝트를 서버에 배포하기 위한 팀원용 가이드입니다.

---

## 목차

1. [사전 준비](#1-사전-준비)
2. [스킬 설치](#2-스킬-설치)
3. [스킬 사용법](#3-스킬-사용법)
4. [배포 워크플로우](#4-배포-워크플로우)
5. [문제 해결](#5-문제-해결)

---

## 1. 사전 준비

### 1.1 필수 설치 항목

| 프로그램 | 다운로드 링크 | 용도 |
|----------|--------------|------|
| **Node.js 20+** | https://nodejs.org | Claude Code 실행 |
| **Git** | https://git-scm.com | 버전 관리 |
| **VS Code** (권장) | https://code.visualstudio.com | 코드 편집 |

### 1.2 Claude Code 설치

터미널(Windows: PowerShell, macOS/Linux: Terminal)에서 실행:

```bash
npm install -g @anthropic-ai/claude-code
```

설치 확인:
```bash
claude --version
```

---

## 2. 스킬 설치

### 2.1 Claude Code로 자동 설치 (권장)

1. 터미널에서 Claude Code 실행:
   ```bash
   claude
   ```

2. Claude Code에게 다음과 같이 요청:
   ```
   SKILL_INSTALL_GUIDE.md 파일을 읽고 배포 스킬을 설치해줘.
   파일 경로: https://raw.githubusercontent.com/newtechremo/ehwa-website/main/SKILL_INSTALL_GUIDE.md

   또는 서버에서 직접 다운로드:
   - 서버: finefit-temp@49.168.236.221 (포트 6201)
   - 비밀번호: remo1234!
   ```

3. Claude가 자동으로:
   - 현재 OS 감지
   - 스킬 디렉토리 생성
   - 스킬 파일 다운로드
   - 설치 완료 확인

### 2.2 수동 설치

#### Windows (PowerShell)

```powershell
# 1. 스킬 폴더 생성
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.claude\commands"

# 2. 스킬 다운로드
scp -P 6201 finefit-temp@49.168.236.221:~/.claude/commands/github-setup.md "$env:USERPROFILE\.claude\commands\"
scp -P 6201 finefit-temp@49.168.236.221:~/.claude/commands/server-setup.md "$env:USERPROFILE\.claude\commands\"
# 비밀번호 입력: remo1234!
```

#### macOS / Linux

```bash
# 1. 스킬 폴더 생성
mkdir -p ~/.claude/commands

# 2. 스킬 다운로드
scp -P 6201 finefit-temp@49.168.236.221:~/.claude/commands/github-setup.md ~/.claude/commands/
scp -P 6201 finefit-temp@49.168.236.221:~/.claude/commands/server-setup.md ~/.claude/commands/
# 비밀번호 입력: remo1234!
```

---

## 3. 스킬 사용법

### 3.1 사용 가능한 스킬

| 명령어 | 용도 | 사용 위치 |
|--------|------|----------|
| `/github-setup` | GitHub에 프로젝트 업로드 | 로컬 환경 |
| `/server-setup` | 서버에서 프로젝트 배포 설정 | 서버 환경 |
| `/deploy` | Nginx, SSL 상세 설정 | 서버 환경 (자동 설치됨) |

### 3.2 스킬 실행 방법

1. 프로젝트 폴더에서 Claude Code 실행:
   ```bash
   cd /path/to/my-project
   claude
   ```

2. 슬래시 명령어 입력:
   ```
   /github-setup
   ```

3. Claude가 가이드 내용을 기반으로 작업 수행

---

## 4. 배포 워크플로우

### Step 1: 로컬에서 GitHub 업로드

```bash
# 1. 프로젝트 폴더로 이동
cd /path/to/my-project

# 2. Claude Code 실행
claude

# 3. GitHub 업로드 가이드 실행
/github-setup
```

Claude가 도와주는 작업:
- `.gitignore` 파일 생성
- `.env.example` 파일 생성
- Git 초기화 및 커밋
- GitHub 레포지토리 생성
- 코드 푸시

### Step 2: 서버 접속

```bash
# SSH 접속
ssh -p 6201 finefit-temp@49.168.236.221
# 비밀번호: remo1234!
```

### Step 3: 서버에서 프로젝트 설정

```bash
# 1. 프로젝트 디렉토리로 이동
cd /home/finefit-temp/Desktop/project

# 2. GitHub에서 클론
git clone https://github.com/사용자명/레포지토리명.git
cd 레포지토리명

# 3. Claude Code 실행
claude

# 4. 서버 설정 가이드 실행
/server-setup
```

Claude가 도와주는 작업:
- `.env` 파일 생성
- 의존성 설치 (`npm install`)
- 빌드 테스트 (`npm run build`)
- 서버 실행

### Step 4: Nginx 및 SSL 설정

```bash
# Claude Code 내에서
/deploy
```

Claude가 도와주는 작업:
- 사용 가능한 포트 확인
- Nginx 프록시 설정
- SSL 인증서 발급 (HTTPS)
- 도메인 연결

---

## 5. 문제 해결

### Claude Code 설치 오류

```bash
# 권한 오류 시 (Linux/macOS)
sudo npm install -g @anthropic-ai/claude-code
```

### SCP 비밀번호 오류

비밀번호에 특수문자가 있으면 따옴표로 감싸지 않아도 됩니다.
비밀번호: `remo1234!`

### 스킬이 작동하지 않음

```bash
# 스킬 파일 확인
# Windows
dir %USERPROFILE%\.claude\commands\

# macOS/Linux
ls ~/.claude/commands/

# 파일이 없으면 2.2 수동 설치 진행
```

### SSH 접속 오류

```bash
# 포트 번호 확인 (6201)
ssh -p 6201 -v finefit-temp@49.168.236.221
```

---

## 서버 정보 요약

| 항목 | 값 |
|------|-----|
| **서버 IP** | `49.168.236.221` |
| **SSH 포트** | `6201` |
| **사용자** | `finefit-temp` |
| **비밀번호** | `remo1234!` |
| **프로젝트 경로** | `/home/finefit-temp/Desktop/project` |

---

## 참고 문서

| 문서 | 설명 |
|------|------|
| `SKILL_INSTALL_GUIDE.md` | Claude Code용 스킬 설치 참조 |
| `GITHUB_SETUP_GUIDE.md` | GitHub 업로드 상세 가이드 |
| `SERVER_SETUP_GUIDE.md` | 서버 배포 상세 가이드 |
| `DEPLOYMENT_GUIDE.md` | Nginx/SSL/포트 상세 가이드 |

---

*마지막 업데이트: 2026-01-08*

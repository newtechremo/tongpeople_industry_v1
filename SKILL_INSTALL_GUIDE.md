# Claude Code 스킬 설치 참조 문서

이 문서는 Claude Code가 스킬 설치 시 참조하는 정보입니다.

---

## 설치할 스킬

| 스킬 | 파일명 | 용도 |
|------|--------|------|
| `/github-setup` | `github-setup.md` | GitHub 프로젝트 업로드 가이드 |
| `/server-setup` | `server-setup.md` | 서버 배포 설정 가이드 |

---

## 서버 정보

```yaml
호스트: 49.168.236.221
포트: 6201
사용자: finefit-temp
비밀번호: remo1234!
스킬 경로: ~/.claude/commands/
```

---

## OS별 로컬 스킬 경로

| OS | 경로 |
|----|------|
| Windows | `$env:USERPROFILE\.claude\commands\` |
| macOS | `~/.claude/commands/` |
| Linux | `~/.claude/commands/` |

---

## OS 감지 방법

```bash
# Linux/macOS
uname -s
# 결과: Linux 또는 Darwin

# Windows (PowerShell)
$env:OS
# 결과: Windows_NT
```

---

## 설치 명령어

### Windows (PowerShell)

```powershell
# 디렉토리 생성
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.claude\commands"

# 파일 다운로드
scp -P 6201 finefit-temp@49.168.236.221:~/.claude/commands/github-setup.md "$env:USERPROFILE\.claude\commands\"
scp -P 6201 finefit-temp@49.168.236.221:~/.claude/commands/server-setup.md "$env:USERPROFILE\.claude\commands\"
# 비밀번호: remo1234!

# 설치 확인
Get-ChildItem "$env:USERPROFILE\.claude\commands\"
```

### macOS / Linux

```bash
# 디렉토리 생성
mkdir -p ~/.claude/commands

# 파일 다운로드
scp -P 6201 finefit-temp@49.168.236.221:~/.claude/commands/github-setup.md ~/.claude/commands/
scp -P 6201 finefit-temp@49.168.236.221:~/.claude/commands/server-setup.md ~/.claude/commands/
# 비밀번호: remo1234!

# 설치 확인
ls -la ~/.claude/commands/
```

---

## 설치 프로세스

1. **OS 감지**: `uname -s` 또는 `$env:OS` 실행
2. **디렉토리 생성**: OS에 맞는 경로에 `.claude/commands` 생성
3. **파일 다운로드**: SCP로 서버에서 스킬 파일 복사
4. **설치 확인**: 파일 목록 출력

---

## 스킬 업데이트

```bash
# Windows
scp -P 6201 finefit-temp@49.168.236.221:~/.claude/commands/github-setup.md "$env:USERPROFILE\.claude\commands\"
scp -P 6201 finefit-temp@49.168.236.221:~/.claude/commands/server-setup.md "$env:USERPROFILE\.claude\commands\"

# macOS/Linux
scp -P 6201 finefit-temp@49.168.236.221:~/.claude/commands/github-setup.md ~/.claude/commands/
scp -P 6201 finefit-temp@49.168.236.221:~/.claude/commands/server-setup.md ~/.claude/commands/
```

---

*마지막 업데이트: 2026-01-08*

# -*- coding: utf-8 -*-
"""
산업현장통 위험요인 추천 엔진 (Recommendation Engine)
Version: 1.0
Author: AI Safety Team

사용자의 입력 조건에 맞춰 최적의 위험요인을 추천하는 모듈
"""

import sqlite3
from typing import List, Dict, Optional


# 고위험 재해형태 정의
HIGH_RISK_TYPES = ["떨어짐", "끼임", "질식", "화재폭발"]


def get_recommendations(
    db_path: str,
    keywords: List[str],
    category_main: Optional[str] = None,
    limit: int = 50
) -> List[Dict]:
    """
    위험요인 추천 함수

    Args:
        db_path: SQLite DB 파일 경로
        keywords: 작업 관련 키워드 리스트 (예: ['용접', '배관'])
        category_main: 대공종 (예: '건설업') - Optional
        limit: 출력 개수 (기본 50)

    Returns:
        추천 결과 리스트 (List of Dict)
    """

    if not keywords:
        return []

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # 1차 필터링: LIKE 쿼리로 후보군 추출
    like_conditions = []
    params = []

    for kw in keywords:
        like_conditions.append("(task_name LIKE ? OR risk_factor LIKE ? OR measures_admin LIKE ? OR measures_tech LIKE ?)")
        params.extend([f"%{kw}%", f"%{kw}%", f"%{kw}%", f"%{kw}%"])

    where_clause = " OR ".join(like_conditions)

    query = f"""
        SELECT id, task_name, risk_factor, accident_type,
               measures_admin, measures_tech, measures_personal,
               risk_frequency, risk_severity
        FROM risk_assessment
        WHERE ({where_clause})
    """

    cursor.execute(query, params)
    candidates = cursor.fetchall()
    conn.close()

    # 2단계: Python에서 정밀 스코어링
    scored_results = []
    seen_risk_factors = set()  # 중복 제거용

    for row in candidates:
        record = dict(row)
        score, reason_parts = calculate_score(record, keywords)

        # 0점 제외
        if score == 0:
            continue

        # 중복 제거 (risk_factor 기준)
        risk_factor = record["risk_factor"]
        if risk_factor in seen_risk_factors:
            continue
        seen_risk_factors.add(risk_factor)

        # 결과 구성
        result = {
            "id": record["id"],
            "task_name": record["task_name"],
            "risk_factor": record["risk_factor"],
            "accident_type": record["accident_type"],
            "score": score,
            "reason": " + ".join(reason_parts)
        }
        scored_results.append(result)

    # 점수 내림차순 정렬
    scored_results.sort(key=lambda x: x["score"], reverse=True)

    # 상위 N개 반환
    return scored_results[:limit]


def calculate_score(record: Dict, keywords: List[str]) -> tuple:
    """
    개별 레코드의 점수 계산

    Scoring Rule v1.1:
    1. 키워드 적합도 (40점): task_name +40, risk_factor +20, measures +10
    2. 재해형태 가중치 (30점): 고위험 재해 해당시
    3. 복합 매칭 (30점): 2개 이상 키워드 매칭시

    Returns:
        (score, reason_parts) 튜플
    """
    score = 0
    reason_parts = []
    matched_keywords = set()

    task_name = record.get("task_name", "") or ""
    risk_factor = record.get("risk_factor", "") or ""
    measures_admin = record.get("measures_admin", "") or ""
    measures_tech = record.get("measures_tech", "") or ""
    measures_personal = record.get("measures_personal", "") or ""
    accident_type = record.get("accident_type", "") or ""

    all_measures = f"{measures_admin} {measures_tech} {measures_personal}"

    # 1. 키워드 적합도 (40점)
    for kw in keywords:
        kw_matched = False

        # task_name 매칭 (+40점, 최고점)
        if kw in task_name:
            score += 40
            reason_parts.append(f"작업명 '{kw}' 매칭(40)")
            kw_matched = True
            matched_keywords.add(kw)

        # risk_factor 매칭 (+20점)
        elif kw in risk_factor:
            score += 20
            reason_parts.append(f"위험요인 '{kw}' 매칭(20)")
            kw_matched = True
            matched_keywords.add(kw)

        # measures 매칭 (+10점)
        elif kw in all_measures:
            score += 10
            reason_parts.append(f"대책 '{kw}' 매칭(10)")
            kw_matched = True
            matched_keywords.add(kw)

    # 2. 재해형태 가중치 (30점)
    if accident_type in HIGH_RISK_TYPES:
        score += 30
        reason_parts.append(f"고위험 '{accident_type}'(30)")

    # 3. 복합 매칭 (30점)
    if len(matched_keywords) >= 2:
        score += 30
        reason_parts.append(f"복합매칭 {len(matched_keywords)}개(30)")

    return score, reason_parts


def print_recommendations(results: List[Dict], title: str = "추천 결과"):
    """추천 결과를 보기 좋게 출력"""
    print()
    print("=" * 70)
    print(f" {title}")
    print("=" * 70)
    print(f" 총 {len(results)}건 추천")
    print("-" * 70)

    for i, r in enumerate(results[:10], 1):  # 상위 10개만 출력
        print(f"\n[{i}위] 점수: {r['score']}점")
        print(f"    작업명: {r['task_name']}")
        print(f"    위험요인: {r['risk_factor'][:60]}{'...' if len(r['risk_factor']) > 60 else ''}")
        print(f"    재해형태: {r['accident_type']}")
        print(f"    추천근거: {r['reason']}")

    print()
    print("-" * 70)
    if len(results) > 10:
        print(f" (상위 10개만 표시, 전체 {len(results)}건)")
    print("=" * 70)


# ============================================================
# 테스트 실행
# ============================================================
if __name__ == "__main__":
    import os

    # DB 경로
    DB_PATH = os.path.join(os.path.dirname(__file__), "..", "output", "safety_master.db")

    # 테스트 케이스: 지게차 + 운반
    print("\n" + "=" * 70)
    print(" 위험요인 추천 엔진 테스트")
    print("=" * 70)
    print(" DB: safety_master.db")
    print(" 키워드: ['지게차', '운반']")
    print(" 공종: 건설업")
    print("=" * 70)

    results = get_recommendations(
        db_path=DB_PATH,
        keywords=["지게차", "운반"],
        category_main="건설업",
        limit=50
    )

    print_recommendations(results, "지게차 + 운반 작업 위험요인 추천")

    # 점수 분포 통계
    if results:
        scores = [r["score"] for r in results]
        print(f"\n[점수 통계]")
        print(f"  최고점: {max(scores)}점")
        print(f"  최저점: {min(scores)}점")
        print(f"  평균: {sum(scores)/len(scores):.1f}점")

        # 재해형태 분포
        accident_types = {}
        for r in results:
            at = r["accident_type"]
            accident_types[at] = accident_types.get(at, 0) + 1

        print(f"\n[재해형태 분포]")
        for at, cnt in sorted(accident_types.items(), key=lambda x: x[1], reverse=True)[:5]:
            print(f"  {at}: {cnt}건")

/**
 * 문자열 정규화 유틸리티
 *
 * 중복 검사 시 사용하는 문자열 정규화 함수
 */

/**
 * 문자열 정규화
 *
 * 규칙:
 * 1. 앞뒤 공백 제거 (trim)
 * 2. 연속된 공백을 하나로 축소
 * 3. 대소문자 구분 없음 (소문자 변환)
 *
 * @param str - 정규화할 문자열
 * @returns 정규화된 문자열
 *
 * @example
 * normalizeString('  Hello   World  ') // 'hello world'
 * normalizeString('ABC') // 'abc'
 */
export function normalizeString(str: string): string {
  return str
    .trim()                   // 앞뒤 공백 제거
    .replace(/\s+/g, ' ')     // 연속 공백을 하나로
    .toLowerCase();           // 소문자 변환
}

/**
 * 두 문자열이 정규화 후 동일한지 비교
 *
 * @param str1 - 첫 번째 문자열
 * @param str2 - 두 번째 문자열
 * @returns 정규화 후 동일하면 true
 *
 * @example
 * areStringsEqual('  Hello  ', 'hello') // true
 * areStringsEqual('ABC', 'abc') // true
 * areStringsEqual('Hello', 'World') // false
 */
export function areStringsEqual(str1: string, str2: string): boolean {
  return normalizeString(str1) === normalizeString(str2);
}

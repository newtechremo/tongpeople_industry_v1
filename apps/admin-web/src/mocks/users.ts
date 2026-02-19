/**
 * Mock 사용자 데이터
 * 조치자/조치확인자 선택용
 */

export interface MockUser {
  id: string;
  name: string;
  position: string;    // 직책
  department: string;  // 부서
  role: 'SUPER_ADMIN' | 'SITE_ADMIN' | 'TEAM_ADMIN' | 'WORKER';
}

export const mockUsers: MockUser[] = [
  // 현장 관리자급
  { id: 'user-1', name: '김현장', position: '현장소장', department: '현장관리팀', role: 'SITE_ADMIN' },
  { id: 'user-2', name: '이안전', position: '안전관리자', department: '안전관리팀', role: 'SITE_ADMIN' },
  { id: 'user-3', name: '박품질', position: '품질관리자', department: '품질관리팀', role: 'SITE_ADMIN' },
  { id: 'user-4', name: '최공무', position: '공무팀장', department: '공무팀', role: 'SITE_ADMIN' },
  { id: 'user-5', name: '정기술', position: '기술팀장', department: '기술팀', role: 'SITE_ADMIN' },

  // 팀장급
  { id: 'user-6', name: '강팀장', position: '팀장', department: '시공1팀', role: 'TEAM_ADMIN' },
  { id: 'user-7', name: '조팀장', position: '팀장', department: '시공2팀', role: 'TEAM_ADMIN' },
  { id: 'user-8', name: '윤팀장', position: '팀장', department: '전기설비팀', role: 'TEAM_ADMIN' },
  { id: 'user-9', name: '임팀장', position: '팀장', department: '기계설비팀', role: 'TEAM_ADMIN' },
  { id: 'user-10', name: '한팀장', position: '팀장', department: '마감팀', role: 'TEAM_ADMIN' },

  // 오반장/조장급
  { id: 'user-11', name: '서오반장', position: '오반장', department: '철근조', role: 'TEAM_ADMIN' },
  { id: 'user-12', name: '황오반장', position: '오반장', department: '거푸집조', role: 'TEAM_ADMIN' },
  { id: 'user-13', name: '민조장', position: '조장', department: '비계조', role: 'TEAM_ADMIN' },
  { id: 'user-14', name: '배조장', position: '조장', department: '용접조', role: 'TEAM_ADMIN' },
  { id: 'user-15', name: '신조장', position: '조장', department: '전기조', role: 'TEAM_ADMIN' },

  // 작업반장급
  { id: 'user-16', name: '장반장', position: '반장', department: '콘크리트반', role: 'WORKER' },
  { id: 'user-17', name: '유반장', position: '반장', department: '철골반', role: 'WORKER' },
  { id: 'user-18', name: '구반장', position: '반장', department: '도장반', role: 'WORKER' },
  { id: 'user-19', name: '노반장', position: '반장', department: '배관반', role: 'WORKER' },
  { id: 'user-20', name: '하반장', position: '반장', department: '타일반', role: 'WORKER' },

  // 안전보건 전담
  { id: 'user-21', name: '안전담당', position: '안전보건관리담당자', department: '안전관리팀', role: 'SITE_ADMIN' },
  { id: 'user-22', name: '보건담당', position: '보건관리자', department: '안전관리팀', role: 'SITE_ADMIN' },
  { id: 'user-23', name: '환경담당', position: '환경관리자', department: '환경관리팀', role: 'SITE_ADMIN' },
];

/**
 * 사용자 검색 (이름, 부서, 직책)
 */
export function searchUsers(query: string): MockUser[] {
  const lowerQuery = query.toLowerCase().trim();

  if (!lowerQuery) {
    return mockUsers;
  }

  return mockUsers.filter(user =>
    user.name.toLowerCase().includes(lowerQuery) ||
    user.department.toLowerCase().includes(lowerQuery) ||
    user.position.toLowerCase().includes(lowerQuery)
  );
}

/**
 * ID로 사용자 찾기
 */
export function getUserById(id: string): MockUser | undefined {
  return mockUsers.find(user => user.id === id);
}

/**
 * 여러 ID로 사용자 찾기
 */
export function getUsersByIds(ids: string[]): MockUser[] {
  return ids
    .map(id => getUserById(id))
    .filter((user): user is MockUser => user !== undefined);
}

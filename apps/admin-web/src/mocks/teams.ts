/**
 * 팀(업체) Mock 데이터
 */

export interface Team {
  id: string;
  name: string;
  companyId: string;
  siteId?: string;
  type: 'CONTRACTOR' | 'SUBCONTRACTOR' | 'PARTNER';
  contactPerson?: string;
  contactPhone?: string;
  businessNumber?: string;
  isActive: boolean;
}

/**
 * Mock 팀 데이터
 */
export const MOCK_TEAMS: Team[] = [
  {
    id: 'team-001',
    name: '(주)정이앤지',
    companyId: 'company-001',
    siteId: 'site-001',
    type: 'CONTRACTOR',
    contactPerson: '김현장',
    contactPhone: '010-1234-5678',
    businessNumber: '123-45-67890',
    isActive: true,
  },
  {
    id: 'team-002',
    name: '협력업체A',
    companyId: 'company-001',
    siteId: 'site-001',
    type: 'SUBCONTRACTOR',
    contactPerson: '이팀장',
    contactPhone: '010-2345-6789',
    businessNumber: '234-56-78901',
    isActive: true,
  },
  {
    id: 'team-003',
    name: '협력업체B',
    companyId: 'company-001',
    siteId: 'site-001',
    type: 'SUBCONTRACTOR',
    contactPerson: '박소장',
    contactPhone: '010-3456-7890',
    businessNumber: '345-67-89012',
    isActive: true,
  },
  {
    id: 'team-004',
    name: '(주)대한건설',
    companyId: 'company-001',
    siteId: 'site-001',
    type: 'PARTNER',
    contactPerson: '최관리',
    contactPhone: '010-4567-8901',
    businessNumber: '456-78-90123',
    isActive: true,
  },
  {
    id: 'team-005',
    name: '한국안전산업',
    companyId: 'company-001',
    siteId: 'site-001',
    type: 'PARTNER',
    contactPerson: '정기사',
    contactPhone: '010-5678-9012',
    businessNumber: '567-89-01234',
    isActive: true,
  },
  {
    id: 'team-006',
    name: '비활성업체',
    companyId: 'company-001',
    siteId: 'site-001',
    type: 'SUBCONTRACTOR',
    contactPerson: '홍담당',
    contactPhone: '010-6789-0123',
    businessNumber: '678-90-12345',
    isActive: false,
  },
];

/**
 * 활성화된 팀 목록 가져오기
 */
export function getActiveTeams(): Team[] {
  return MOCK_TEAMS.filter(team => team.isActive);
}

/**
 * ID로 팀 찾기
 */
export function getTeamById(id: string): Team | undefined {
  return MOCK_TEAMS.find(team => team.id === id);
}

/**
 * 회사 ID로 팀 목록 가져오기
 */
export function getTeamsByCompanyId(companyId: string): Team[] {
  return MOCK_TEAMS.filter(team => team.companyId === companyId && team.isActive);
}

/**
 * 현장 ID로 팀 목록 가져오기
 */
export function getTeamsBySiteId(siteId: string): Team[] {
  return MOCK_TEAMS.filter(team => team.siteId === siteId && team.isActive);
}

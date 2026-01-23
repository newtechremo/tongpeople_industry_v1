import type { ApprovalLine } from '@tong-pass/shared';

export const mockApprovalLines: ApprovalLine[] = [
  // 공용 결재라인
  {
    id: '1',
    name: '현장 기본 결재라인',
    tags: ['GENERAL', 'RISK_ASSESSMENT'],
    teamId: null,
    isPinned: true,
    approvers: [
      { userId: 'user4', userName: '정대호', position: '일반근로자', approvalTitle: '근로자 대표' },
      { userId: 'user1', userName: '김철수', position: '안전팀 과장', approvalTitle: '안전관리자' },
    ],
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'TBM 신속 결재',
    tags: ['TBM'],
    teamId: null,
    isPinned: false,
    approvers: [
      { userId: 'user5', userName: '최서연', position: '공무팀장', approvalTitle: '공무직원' },
      { userId: 'user2', userName: '이영희', position: '현장 소장', approvalTitle: '현장관리자' },
      { userId: 'user6', userName: '한수진', position: '보건관리자', approvalTitle: '보건' },
    ],
    createdAt: '2024-02-20',
  },
  // 팀 전용 결재라인
  {
    id: '3',
    name: '정이앤지 위험성평가',
    tags: ['RISK_ASSESSMENT'],
    teamId: 1,
    isPinned: false,
    approvers: [
      { userId: 'user1', userName: '김철수', position: '안전팀 과장', approvalTitle: '안전담당자' },
      { userId: 'user3', userName: '박민수', position: '본부장', approvalTitle: '총괄책임자' },
    ],
    createdAt: '2024-03-01',
  },
  {
    id: '4',
    name: '협력업체A 간편결재',
    tags: ['GENERAL', 'TBM'],
    teamId: 2,
    isPinned: false,
    approvers: [
      { userId: 'user7', userName: '송기범', position: '안전기사', approvalTitle: '관리감독자' },
      { userId: 'user2', userName: '이영희', position: '현장 소장', approvalTitle: '현장소장' },
    ],
    createdAt: '2024-03-10',
  },
];

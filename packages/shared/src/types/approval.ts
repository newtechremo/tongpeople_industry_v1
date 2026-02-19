/**
 * 결재 관련 타입 정의
 */

// ============================================
// 결재 문서 종류 (안전/작업 관련 문서)
// ============================================
export type ApprovalDocumentType =
  | 'GENERAL'                // 공용
  | 'RISK_ASSESSMENT'        // 위험성평가
  | 'TBM'                    // TBM
  | 'SAFETY_EDUCATION';      // 안전 교육

export const APPROVAL_DOCUMENT_TYPE_LABELS: Record<ApprovalDocumentType, string> = {
  GENERAL: '공용',
  RISK_ASSESSMENT: '위험성 평가',
  TBM: 'TBM',
  SAFETY_EDUCATION: '안전 교육',
};

// ============================================
// 결재자 정보
// ============================================
export interface Approver {
  userId: string;
  userName: string;
  position: string;        // 조직 내 직책
  approvalTitle: string;   // 결재직책 (결재서류에 표시)
}

// ============================================
// 결재라인 템플릿
// ============================================
export interface ApprovalLine {
  id: string;
  name: string;                           // 결재라인 명칭
  tags: ApprovalDocumentType[];           // 문서 태그
  teamId?: number | null;                 // 팀(업체) ID (null이면 공용)
  isPinned: boolean;                      // 고정 여부
  approvers: Approver[];                  // 결재자 목록 (순서대로)
  createdAt: string;
}

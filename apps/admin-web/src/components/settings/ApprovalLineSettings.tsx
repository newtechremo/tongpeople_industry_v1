import { useState, useCallback } from 'react';
import { Plus, ChevronLeft, Pin, X, Users, Check, Trash2, Search } from 'lucide-react';

// ============================================
// 타입 정의
// ============================================

/** 결재자 정보 */
interface Approver {
  userId: string;
  userName: string;
  position: string;        // 조직 내 직책
  approvalTitle: string;   // 결재직책 (결재서류에 표시)
}

/** 결재라인 템플릿 */
interface ApprovalLine {
  id: string;
  name: string;                    // 결재라인 명칭
  documentType: DocumentType;      // 문서 종류
  isPinned: boolean;               // 고정 여부
  approvers: Approver[];           // 결재자 목록 (순서대로)
  createdAt: string;
}

/** 문서 종류 */
type DocumentType =
  | 'RISK_ASSESSMENT'        // 위험성평가
  | 'TBM'                    // TBM
  | 'SAFETY_EDUCATION'       // 안전 교육
  | 'WORK_PLAN'              // 작업 계획서
  | 'RISK_MEETING';          // 위험성 평가 회의록

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  RISK_ASSESSMENT: '위험성 평가',
  TBM: 'TBM',
  SAFETY_EDUCATION: '안전 교육',
  WORK_PLAN: '작업 계획서',
  RISK_MEETING: '위험성 평가 회의록',
};

// 결재직책 기본 옵션
const APPROVAL_TITLE_OPTIONS = [
  '근로자 대표',
  '안전관리자',
  '안전담당자',
  '총괄책임자',
  '현장소장',
  '관리감독자',
  '관리감독자대표',
  '공무직원',
  '보건',
  '팀장',
  '반장',
];

// Mock 사용자 데이터 (실제로는 API에서 가져옴)
const MOCK_USERS = [
  { id: 'user1', name: '김철수', position: '안전팀 과장' },
  { id: 'user2', name: '이영희', position: '현장 소장' },
  { id: 'user3', name: '박민수', position: '본부장' },
  { id: 'user4', name: '정대호', position: '일반근로자' },
  { id: 'user5', name: '최서연', position: '공무팀장' },
  { id: 'user6', name: '한수진', position: '보건관리자' },
  { id: 'user7', name: '송기범', position: '안전기사' },
];

// Mock 결재라인 데이터
const MOCK_APPROVAL_LINES: ApprovalLine[] = [
  {
    id: '1',
    name: '1',
    documentType: 'RISK_ASSESSMENT',
    isPinned: true,
    approvers: [
      { userId: 'user4', userName: '정대호', position: '일반근로자', approvalTitle: '근로자 대표' },
      { userId: 'user1', userName: '김철수', position: '안전팀 과장', approvalTitle: '0' },
    ],
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    name: '22',
    documentType: 'RISK_ASSESSMENT',
    isPinned: false,
    approvers: [
      { userId: 'user5', userName: '최서연', position: '공무팀장', approvalTitle: '공무직원' },
      { userId: 'user1', userName: '김철수', position: '안전팀 과장', approvalTitle: '안전관리자' },
      { userId: 'user2', userName: '이영희', position: '현장 소장', approvalTitle: '현장관리자' },
      { userId: 'user6', userName: '한수진', position: '보건관리자', approvalTitle: '보건' },
      { userId: 'user3', userName: '박민수', position: '본부장', approvalTitle: '총책임자' },
    ],
    createdAt: '2024-02-20',
  },
  {
    id: '3',
    name: '1',
    documentType: 'TBM',
    isPinned: true,
    approvers: [
      { userId: 'user1', userName: '김철수', position: '안전팀 과장', approvalTitle: '1' },
      { userId: 'user2', userName: '이영희', position: '현장 소장', approvalTitle: '2' },
    ],
    createdAt: '2024-03-10',
  },
];

// ============================================
// 메인 컴포넌트
// ============================================

interface ApprovalLineSettingsProps {
  autoOpenModal?: boolean;
  onModalAutoOpened?: () => void;
}

export default function ApprovalLineSettings({
  autoOpenModal = false,
  onModalAutoOpened,
}: ApprovalLineSettingsProps) {
  // 상태
  const [approvalLines, setApprovalLines] = useState<ApprovalLine[]>(MOCK_APPROVAL_LINES);
  const [filterType, setFilterType] = useState<DocumentType | 'ALL'>('ALL');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLine, setEditingLine] = useState<ApprovalLine | null>(null);

  // autoOpenModal 처리
  useState(() => {
    if (autoOpenModal) {
      setIsFormOpen(true);
      onModalAutoOpened?.();
    }
  });

  // 필터링된 결재라인
  const filteredLines = filterType === 'ALL'
    ? approvalLines
    : approvalLines.filter(line => line.documentType === filterType);

  // 문서 종류별 그룹핑
  const groupedLines = filteredLines.reduce((acc, line) => {
    const type = line.documentType;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(line);
    return acc;
  }, {} as Record<DocumentType, ApprovalLine[]>);

  // 결재라인 추가/수정 완료 핸들러
  const handleSaveLine = (line: ApprovalLine) => {
    if (editingLine) {
      // 수정
      setApprovalLines(prev => prev.map(l => l.id === line.id ? line : l));
    } else {
      // 추가
      setApprovalLines(prev => [...prev, { ...line, id: Date.now().toString() }]);
    }
    setIsFormOpen(false);
    setEditingLine(null);
  };

  // 결재라인 삭제 핸들러
  const handleDeleteLine = (lineId: string) => {
    if (confirm('이 결재라인을 삭제하시겠습니까?')) {
      setApprovalLines(prev => prev.filter(l => l.id !== lineId));
    }
  };

  // 새 결재라인 추가 폼 열기
  const handleAddNew = () => {
    setEditingLine(null);
    setIsFormOpen(true);
  };

  // 폼 닫기
  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingLine(null);
  };

  // 폼이 열려있으면 폼 화면 표시
  if (isFormOpen) {
    return (
      <ApprovalLineForm
        editingLine={editingLine}
        onSave={handleSaveLine}
        onCancel={handleCloseForm}
      />
    );
  }

  // 목록 화면
  return (
    <div className="space-y-6">
      {/* 결재라인 종류 필터 */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-600">결재라인 종류</h3>
        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="docType"
              checked={filterType === 'ALL'}
              onChange={() => setFilterType('ALL')}
              className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500"
            />
            <span className={`text-sm ${filterType === 'ALL' ? 'font-bold text-slate-800' : 'text-slate-600'}`}>
              전체보기
            </span>
          </label>
          {Object.entries(DOCUMENT_TYPE_LABELS).map(([type, label]) => (
            <label key={type} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="docType"
                checked={filterType === type}
                onChange={() => setFilterType(type as DocumentType)}
                className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500"
              />
              <span className={`text-sm ${filterType === type ? 'font-bold text-slate-800' : 'text-slate-600'}`}>
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* 문서 종류별 결재라인 목록 */}
      {Object.entries(groupedLines).map(([docType, lines]) => (
        <div key={docType} className="space-y-4">
          {/* 섹션 헤더 */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-600 underline">
              {DOCUMENT_TYPE_LABELS[docType as DocumentType]} 결재라인 설정
            </h3>
            <button
              onClick={handleAddNew}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-white
                         bg-gradient-to-r from-orange-500 to-orange-600
                         hover:from-orange-600 hover:to-orange-700
                         shadow-sm transition-all text-sm"
            >
              <Plus size={16} />
              결재라인 추가
            </button>
          </div>

          {/* 결재라인 테이블 */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase w-16">
                    고정
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase w-32">
                    결재라인 명칭
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                    결재자
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase w-24">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => (
                  <tr key={line.id} className="border-b border-gray-100 hover:bg-gray-50">
                    {/* 고정 아이콘 */}
                    <td className="px-4 py-4">
                      {line.isPinned && (
                        <Pin size={18} className="text-red-500 fill-red-500" />
                      )}
                    </td>
                    {/* 결재라인 명칭 */}
                    <td className="px-4 py-4 text-sm font-medium text-slate-700">
                      {line.name}
                    </td>
                    {/* 결재자 미리보기 */}
                    <td className="px-4 py-4">
                      <ApproverPreviewTable approvers={line.approvers} />
                    </td>
                    {/* 관리 버튼 */}
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => handleDeleteLine(line.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50
                                   rounded-lg transition-colors"
                        title="삭제"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* 빈 상태 */}
      {Object.keys(groupedLines).length === 0 && (
        <div className="text-center py-16">
          <Users size={48} className="mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500 font-medium">등록된 결재라인이 없습니다</p>
          <p className="text-sm text-slate-400 mt-1">결재라인을 추가해주세요</p>
          <button
            onClick={() => handleAddNew()}
            className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-white
                       bg-gradient-to-r from-orange-500 to-orange-600
                       hover:from-orange-600 hover:to-orange-700
                       shadow-sm transition-all mx-auto"
          >
            <Plus size={18} />
            결재라인 추가
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================
// 결재자 미리보기 테이블 (가로 스크롤)
// ============================================

function ApproverPreviewTable({ approvers }: { approvers: Approver[] }) {
  if (approvers.length === 0) {
    return <span className="text-sm text-slate-400">결재자 없음</span>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-max border border-gray-200 rounded">
        <thead>
          <tr className="bg-gray-100">
            {approvers.map((approver, index) => (
              <th
                key={index}
                className="px-4 py-2 text-xs font-medium text-slate-600 border-r border-gray-200 last:border-r-0 min-w-[100px]"
              >
                {approver.approvalTitle}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {approvers.map((approver, index) => (
              <td
                key={index}
                className="px-4 py-2 text-xs text-slate-500 border-r border-gray-200 last:border-r-0 text-center"
              >
                {approver.userName}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ============================================
// 결재라인 추가/수정 폼
// ============================================

interface ApprovalLineFormProps {
  editingLine: ApprovalLine | null;
  onSave: (line: ApprovalLine) => void;
  onCancel: () => void;
}

/** 결재자 슬롯 데이터 (폼 내부 상태용) */
interface ApproverSlot {
  approvalTitle: string;   // 결재직책
  userId: string;          // 선택된 사용자 ID
  userName: string;        // 선택된 사용자 이름
  position: string;        // 사용자 조직 내 직책
  isWorkerRepresentative: boolean;  // 근로자 대표 지정 여부 (1번 슬롯만)
}

const MIN_APPROVERS = 2;
const MAX_APPROVERS = 7;

function ApprovalLineForm({ editingLine, onSave, onCancel }: ApprovalLineFormProps) {
  // 폼 상태
  const [lineName, setLineName] = useState(editingLine?.name || '');
  const [documentType] = useState<DocumentType>(
    editingLine?.documentType || 'RISK_ASSESSMENT'
  );

  // 결재자 배열 상태 - 핵심 로직!
  const [approvers, setApprovers] = useState<ApproverSlot[]>(() => {
    if (editingLine) {
      return editingLine.approvers.map((a, index) => ({
        approvalTitle: a.approvalTitle,
        userId: a.userId,
        userName: a.userName,
        position: a.position,
        isWorkerRepresentative: index === 0, // 첫 번째가 근로자 대표인지는 별도 로직 필요
      }));
    }
    // 기본 2개 슬롯으로 시작
    return [
      { approvalTitle: '', userId: '', userName: '', position: '', isWorkerRepresentative: false },
      { approvalTitle: '', userId: '', userName: '', position: '', isWorkerRepresentative: false },
    ];
  });

  const [workerRepEnabled, setWorkerRepEnabled] = useState(
    editingLine?.approvers[0]?.approvalTitle === '근로자 대표'
  );

  // 사용자 검색 모달 상태
  const [searchModalIndex, setSearchModalIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // ============================================
  // 핵심 CRUD 로직
  // ============================================

  /**
   * 추가 (Append) - 항상 마지막에만 추가
   * PRD 2.2.1: List.push(newData) 방식 사용
   */
  const handleAddApprover = useCallback(() => {
    if (approvers.length >= MAX_APPROVERS) {
      alert(`결재자는 최대 ${MAX_APPROVERS}명까지 추가할 수 있습니다.`);
      return;
    }

    setApprovers(prev => [
      ...prev,
      { approvalTitle: '', userId: '', userName: '', position: '', isWorkerRepresentative: false }
    ]);
  }, [approvers.length]);

  /**
   * 수정 (Replace) - 해당 인덱스의 데이터만 업데이트
   * PRD 2.2.2: 배열의 순서(Index)는 변하지 않고, 해당 객체의 정보만 업데이트
   */
  const handleUpdateApprover = useCallback((index: number, updates: Partial<ApproverSlot>) => {
    setApprovers(prev => {
      const newApprovers = [...prev];
      newApprovers[index] = { ...newApprovers[index], ...updates };
      return newApprovers;
    });
  }, []);

  /**
   * 삭제 (Delete & Re-indexing) - splice 후 자동 재정렬
   * PRD 2.2.3: List.splice(targetIndex, 1) 실행 후, 남은 리스트를 순회하며 순번 재렌더링
   * ⚠️ 핵심: 빈 칸(Gap)이 절대 생기지 않도록 함
   */
  const handleDeleteApprover = useCallback((targetIndex: number) => {
    setApprovers(prev => {
      // 최소 인원 체크 (삭제 후 0명이 되어도 에러 없이 처리)
      if (prev.length <= 1) {
        // PRD FR-04: 남은 배열의 길이가 0이 되더라도 에러가 나지 않아야 함
        // 대신 최소 1개 슬롯은 유지
        return [{ approvalTitle: '', userId: '', userName: '', position: '', isWorkerRepresentative: false }];
      }

      // splice로 해당 인덱스 삭제 - 뒤에 있는 모든 결재자가 앞으로 한 칸씩 당겨짐
      const newApprovers = [...prev];
      newApprovers.splice(targetIndex, 1);

      // 재정렬 완료 - 별도의 인덱스 재할당 로직 불필요 (배열 자체가 순서)
      // UI에서는 map의 index를 사용하여 자동으로 1, 2, 3... 순번 표시
      return newApprovers;
    });
  }, []);

  /**
   * 사용자 선택 핸들러
   */
  const handleSelectUser = useCallback((index: number, user: typeof MOCK_USERS[0]) => {
    handleUpdateApprover(index, {
      userId: user.id,
      userName: user.name,
      position: user.position,
    });
    setSearchModalIndex(null);
    setSearchQuery('');
  }, [handleUpdateApprover]);

  /**
   * 검색 모달 열기
   */
  const handleOpenSearchModal = useCallback((index: number) => {
    setSearchModalIndex(index);
    setSearchQuery('');
  }, []);

  /**
   * 검색 모달 닫기
   */
  const handleCloseSearchModal = useCallback(() => {
    setSearchModalIndex(null);
    setSearchQuery('');
  }, []);

  /**
   * 검색된 사용자 목록
   */
  const filteredUsers = searchQuery.trim()
    ? MOCK_USERS.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.position.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : MOCK_USERS;

  /**
   * 근로자 대표 지정 토글
   */
  const handleWorkerRepToggle = useCallback((enabled: boolean) => {
    setWorkerRepEnabled(enabled);
    if (enabled) {
      handleUpdateApprover(0, { approvalTitle: '근로자 대표' });
    } else {
      handleUpdateApprover(0, { approvalTitle: '' });
    }
  }, [handleUpdateApprover]);

  /**
   * 저장 핸들러
   */
  const handleSave = () => {
    // 유효성 검사
    if (!lineName.trim()) {
      alert('결재라인 명칭을 입력해주세요.');
      return;
    }

    // 실제 입력된 결재자만 필터링
    const validApprovers = approvers.filter(a => a.userId && a.approvalTitle);

    // PRD FR-03: 저장 시 등록된 인원이 최소 2명 이상이어야 함
    if (validApprovers.length < MIN_APPROVERS) {
      alert(`결재자는 최소 ${MIN_APPROVERS}명 이상 등록해야 합니다.`);
      return;
    }

    const line: ApprovalLine = {
      id: editingLine?.id || '',
      name: lineName,
      documentType,
      isPinned: editingLine?.isPinned || false,
      approvers: validApprovers.map(a => ({
        userId: a.userId,
        userName: a.userName,
        position: a.position,
        approvalTitle: a.approvalTitle,
      })),
      createdAt: editingLine?.createdAt || new Date().toISOString().split('T')[0],
    };

    onSave(line);
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <button
          onClick={onCancel}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft size={20} className="text-slate-600" />
        </button>
        <h2 className="text-lg font-bold text-slate-800">
          {editingLine ? '결재라인 수정' : '결재라인 추가'}
        </h2>
      </div>

      {/* 결재라인 명칭 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">
          결재라인 명칭
        </label>
        <input
          type="text"
          value={lineName}
          onChange={(e) => setLineName(e.target.value)}
          placeholder="결재라인 명칭을 입력하세요."
          className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm
                     focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>

      {/* 결재라인 지정 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              결재라인 지정
            </label>
            <p className="text-xs text-slate-400 mt-0.5">
              *최소 {MIN_APPROVERS}명 / 최대 {MAX_APPROVERS}명
            </p>
            <p className="text-xs text-slate-400">
              *각 셀을 선택해 지정하세요.
            </p>
          </div>
        </div>

        {/* 결재자 테이블 (가로 스크롤) */}
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-max w-full">
            {/* 헤더: 결재자 번호 */}
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                {approvers.map((_, index) => (
                  <th
                    key={index}
                    className="px-4 py-3 text-sm font-medium text-slate-700 border-r border-gray-200 last:border-r-0 min-w-[160px] relative"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span>결재자{index + 1}</span>
                      {index === 0 && (
                        <label className="flex items-center gap-1 cursor-pointer">
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
                              ${workerRepEnabled
                                ? 'bg-red-500 border-red-500'
                                : 'border-gray-300 hover:border-red-400'
                              }`}
                            onClick={() => handleWorkerRepToggle(!workerRepEnabled)}
                          >
                            {workerRepEnabled && <Check size={12} className="text-white" />}
                          </div>
                          <span className="text-xs text-slate-500">근로자 대표 지정</span>
                        </label>
                      )}
                      {/* 삭제 버튼 (항상 표시) */}
                      {approvers.length > 1 && (
                        <button
                          onClick={() => handleDeleteApprover(index)}
                          className="absolute top-1 right-1 p-1 text-slate-400 hover:text-red-500
                                     hover:bg-red-50 rounded transition-colors"
                          title="삭제"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* 직책 입력 행 */}
              <tr className="border-b border-gray-200">
                {approvers.map((approver, index) => (
                  <td
                    key={index}
                    className="px-2 py-2 border-r border-gray-200 last:border-r-0"
                  >
                    <input
                      type="text"
                      list={`approval-title-options-${index}`}
                      value={approver.approvalTitle}
                      onChange={(e) => handleUpdateApprover(index, { approvalTitle: e.target.value })}
                      placeholder="직책을 입력하세요."
                      disabled={index === 0 && workerRepEnabled}
                      className={`w-full px-3 py-2 text-sm text-center border border-gray-200 rounded
                                 focus:outline-none focus:ring-1 focus:ring-orange-500
                                 ${index === 0 && workerRepEnabled ? 'bg-gray-100 text-slate-600' : ''}`}
                    />
                    <datalist id={`approval-title-options-${index}`}>
                      {APPROVAL_TITLE_OPTIONS.map(title => (
                        <option key={title} value={title} />
                      ))}
                    </datalist>
                  </td>
                ))}
              </tr>
              {/* 결재자 선택 행 */}
              <tr>
                {approvers.map((approver, index) => (
                  <td
                    key={index}
                    className="px-2 py-2 border-r border-gray-200 last:border-r-0"
                  >
                    <button
                      onClick={() => handleOpenSearchModal(index)}
                      className={`w-full px-3 py-2 text-sm text-center border border-gray-200 rounded
                                 hover:border-orange-400 transition-colors
                                 ${approver.userId ? 'text-slate-700' : 'text-slate-400'}`}
                    >
                      {approver.userId ? approver.userName : '결재자를 선택하세요.'}
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* 결재라인 추가하기 버튼 */}
        {approvers.length < MAX_APPROVERS && (
          <div className="flex justify-end">
            <button
              onClick={handleAddApprover}
              className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              <Plus size={16} className="text-blue-600" />
              결재라인 추가하기
            </button>
          </div>
        )}
      </div>

      {/* 하단 버튼 */}
      <div className="flex items-center justify-center gap-4 pt-6 border-t border-gray-200">
        <button
          onClick={onCancel}
          className="px-12 py-3 text-sm font-medium text-slate-600 bg-gray-200
                     hover:bg-gray-300 rounded-lg transition-colors min-w-[140px]"
        >
          취소
        </button>
        <button
          onClick={handleSave}
          className="px-12 py-3 text-sm font-medium text-slate-600 bg-gray-200
                     hover:bg-gray-300 rounded-lg transition-colors min-w-[140px]"
        >
          저장하기
        </button>
      </div>

      {/* 근로자 검색 모달 */}
      {searchModalIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* 배경 오버레이 */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={handleCloseSearchModal}
          />

          {/* 모달 */}
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-slate-800">
                결재자 {searchModalIndex + 1} 선택
              </h3>
              <button
                onClick={handleCloseSearchModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            {/* 검색 입력 */}
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="이름 또는 직책으로 검색"
                  autoFocus
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-sm
                             focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* 검색 결과 목록 */}
            <div className="max-h-80 overflow-y-auto">
              {filteredUsers.length > 0 ? (
                filteredUsers.map(user => {
                  const isSelected = approvers[searchModalIndex]?.userId === user.id;
                  return (
                    <button
                      key={user.id}
                      onClick={() => handleSelectUser(searchModalIndex, user)}
                      className={`w-full px-6 py-4 text-left hover:bg-orange-50 transition-colors
                                 flex items-center justify-between border-b border-gray-100 last:border-b-0
                                 ${isSelected ? 'bg-orange-50' : ''}`}
                    >
                      <div>
                        <p className={`font-medium ${isSelected ? 'text-orange-600' : 'text-slate-800'}`}>
                          {user.name}
                        </p>
                        <p className="text-sm text-slate-500">{user.position}</p>
                      </div>
                      {isSelected && (
                        <Check size={20} className="text-orange-500" />
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="px-6 py-8 text-center text-slate-400">
                  <Users size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">검색 결과가 없습니다</p>
                </div>
              )}
            </div>

            {/* 모달 푸터 */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <p className="text-xs text-slate-500 text-center">
                총 {filteredUsers.length}명의 근로자
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

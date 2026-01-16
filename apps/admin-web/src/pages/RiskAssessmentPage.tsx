import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Calendar, RefreshCw, Clock } from 'lucide-react';
import AssessmentTypeSelectModal, { AssessmentType } from '../components/risk-assessment/AssessmentTypeSelectModal';

// ============================================
// 타입 정의
// ============================================

interface AssessmentTypeInfo {
  id: AssessmentType;
  number: string;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  description: string;
  steps: string[];
  color: string;
}

/** 위험성평가 문서 상태 */
type AssessmentStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'IN_PROGRESS' | 'COMPLETED';

/** 위험성평가 문서 */
interface RiskAssessment {
  id: string;
  type: AssessmentType;
  title: string;
  status: AssessmentStatus;
  workPeriodStart: string;
  workPeriodEnd: string;
  workCategory: string;
  assignee: string;
  createdAt: string;
  workerCount?: number;
  unconfirmedCount?: number;
}

// ============================================
// 상수 정의
// ============================================

const ASSESSMENT_TYPES: AssessmentTypeInfo[] = [
  {
    id: 'OCCASIONAL',
    number: '①',
    label: '수시 위험성 평가',
    shortLabel: '수시',
    icon: RefreshCw,
    color: 'orange',
    description: '위험성 평가 후, 각 위험사항을 위험성평가에게 취합방식인지는 가 적용 / 작업 공종별 위험일지 / 작업 대략 23,000개 DB 지원',
    steps: [
      '각 업체별 위험성평가 만들기',
      '위험성평가에서 해당 작업 공종과 위험성등급 선택',
      '적기 검토 / 초기 공종이 없으면',
      '이전 위험성 평가 불러오기',
      '위험성 수준 (상, 중, 하) / (빈도, 강도) 선택',
    ],
  },
  {
    id: 'INITIAL',
    number: '②',
    label: '최초 위험성 평가',
    shortLabel: '최초',
    icon: FileText,
    color: 'blue',
    description: '사업장 창업일 이내 1개월 이내 시공사(협력사 포함) / 작업 공종별 위험일지 / 정산대략 23,000개 DB 지원',
    steps: [
      '시공사에서 작성',
      '위험성수준 (상, 중, 하) 선택',
    ],
  },
  {
    id: 'REGULAR',
    number: '③',
    label: '정기 위험성 평가',
    shortLabel: '정기',
    icon: Calendar,
    color: 'green',
    description: '최초 위험성 평가 이후 1개월 이내 시공사(협력사 포함) / 작업 공종별 위험일지 / 정산대략 23,000개 DB 지원',
    steps: [
      '시공사에서 작성',
      '위험성수준 (상, 중, 하) 선택',
    ],
  },
  {
    id: 'CONTINUOUS',
    number: '④',
    label: '상시 위험성 평가',
    shortLabel: '상시',
    icon: Clock,
    color: 'purple',
    description: '일상적인 위험요인 관리를 위한 상시 평가 / 작업 공종별 위험일지 / 정산대략 23,000개 DB 지원',
    steps: [
      '일상적인 위험요인 점검',
      '작업 전 안전 확인',
      '위험성수준 (상, 중, 하) / (빈도, 강도) 선택',
    ],
  },
];

const STATUS_LABELS: Record<AssessmentStatus, { label: string; color: string }> = {
  DRAFT: { label: '작성중', color: 'bg-yellow-100 text-yellow-700' },
  PENDING: { label: '결재대기', color: 'bg-blue-100 text-blue-700' },
  APPROVED: { label: '승인완료', color: 'bg-green-100 text-green-700' },
  REJECTED: { label: '반려', color: 'bg-red-100 text-red-700' },
  IN_PROGRESS: { label: '작업대기중', color: 'bg-orange-100 text-orange-700' },
  COMPLETED: { label: '작업종료', color: 'bg-gray-100 text-gray-600' },
};

// Mock 데이터
const MOCK_ASSESSMENTS: RiskAssessment[] = [
  {
    id: '1',
    type: 'OCCASIONAL',
    title: '가설사무실 설치',
    status: 'IN_PROGRESS',
    workPeriodStart: '2026-01-10',
    workPeriodEnd: '2026-01-20',
    workCategory: '가설사무실 설치',
    assignee: '강일동',
    createdAt: '2026-01-10',
    workerCount: 7,
    unconfirmedCount: 3,
  },
  {
    id: '2',
    type: 'OCCASIONAL',
    title: '가설펜스 설치',
    status: 'COMPLETED',
    workPeriodStart: '2026-01-05',
    workPeriodEnd: '2026-01-15',
    workCategory: '가설펜스 설치',
    assignee: '강일동',
    createdAt: '2026-01-05',
    workerCount: 5,
    unconfirmedCount: 0,
  },
  {
    id: '3',
    type: 'INITIAL',
    title: '최초 위험성평가',
    status: 'APPROVED',
    workPeriodStart: '2026-01-01',
    workPeriodEnd: '2026-12-31',
    workCategory: '전체 공종',
    assignee: '김안전',
    createdAt: '2026-01-01',
    workerCount: 45,
    unconfirmedCount: 0,
  },
  {
    id: '4',
    type: 'REGULAR',
    title: '정기 위험성평가 (1월)',
    status: 'APPROVED',
    workPeriodStart: '2026-01-01',
    workPeriodEnd: '2026-01-31',
    workCategory: '철근 콘크리트',
    assignee: '박현장',
    createdAt: '2026-01-03',
    workerCount: 32,
    unconfirmedCount: 0,
  },
  {
    id: '5',
    type: 'OCCASIONAL',
    title: '양중작업',
    status: 'PENDING',
    workPeriodStart: '2026-01-08',
    workPeriodEnd: '2026-01-18',
    workCategory: '양중작업',
    assignee: '이기사',
    createdAt: '2026-01-08',
    workerCount: 12,
    unconfirmedCount: 5,
  },
  {
    id: '6',
    type: 'CONTINUOUS',
    title: '고소작업 안전점검',
    status: 'IN_PROGRESS',
    workPeriodStart: '2026-01-01',
    workPeriodEnd: '2026-03-31',
    workCategory: '고소작업',
    assignee: '최안전',
    createdAt: '2026-01-02',
    workerCount: 18,
    unconfirmedCount: 2,
  },
  {
    id: '7',
    type: 'OCCASIONAL',
    title: '전기배선 작업',
    status: 'DRAFT',
    workPeriodStart: '2026-01-12',
    workPeriodEnd: '2026-01-25',
    workCategory: '전기공사',
    assignee: '정전기',
    createdAt: '2026-01-11',
    workerCount: 8,
    unconfirmedCount: 8,
  },
  {
    id: '8',
    type: 'OCCASIONAL',
    title: '배관설치 작업',
    status: 'APPROVED',
    workPeriodStart: '2026-01-06',
    workPeriodEnd: '2026-01-16',
    workCategory: '배관공사',
    assignee: '김배관',
    createdAt: '2026-01-06',
    workerCount: 10,
    unconfirmedCount: 0,
  },
  {
    id: '9',
    type: 'REGULAR',
    title: '정기 위험성평가 (12월)',
    status: 'COMPLETED',
    workPeriodStart: '2025-12-01',
    workPeriodEnd: '2025-12-31',
    workCategory: '전체 공종',
    assignee: '박현장',
    createdAt: '2025-12-01',
    workerCount: 28,
    unconfirmedCount: 0,
  },
  {
    id: '10',
    type: 'OCCASIONAL',
    title: '용접작업',
    status: 'REJECTED',
    workPeriodStart: '2026-01-09',
    workPeriodEnd: '2026-01-19',
    workCategory: '용접공사',
    assignee: '이용접',
    createdAt: '2026-01-09',
    workerCount: 6,
    unconfirmedCount: 0,
  },
];

// ============================================
// 메인 컴포넌트
// ============================================

// URL 파라미터용 타입 매핑
const TYPE_URL_MAP: Record<AssessmentType, string> = {
  INITIAL: 'initial',
  REGULAR: 'regular',
  OCCASIONAL: 'occasional',
  CONTINUOUS: 'continuous',
};

export default function RiskAssessmentPage() {
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState<AssessmentType | 'ALL'>('ALL');
  const [showTypeModal, setShowTypeModal] = useState(false);

  // 필터링된 목록
  const filteredAssessments = filterType === 'ALL'
    ? MOCK_ASSESSMENTS
    : MOCK_ASSESSMENTS.filter(a => a.type === filterType);

  // 만들기 버튼 클릭
  const handleCreateClick = () => {
    if (filterType !== 'ALL') {
      // 특정 유형 필터 선택 상태 → 바로 이동
      navigate(`/safety/risk/create/${TYPE_URL_MAP[filterType]}`);
    } else {
      // 전체 필터 → 팝업 표시
      setShowTypeModal(true);
    }
  };

  // 팝업에서 유형 선택 시
  const handleTypeSelect = (type: AssessmentType) => {
    navigate(`/safety/risk/create/${TYPE_URL_MAP[type]}`);
  };

  return (
    <>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-800">위험성 평가</h1>
            <p className="text-sm text-slate-500 mt-1">현장의 위험성평가 문서를 관리합니다</p>
          </div>
          <button
            onClick={handleCreateClick}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white
                       bg-gradient-to-r from-orange-500 to-orange-600
                       hover:from-orange-600 hover:to-orange-700
                       shadow-sm transition-all"
          >
            <Plus size={18} />
            위험성평가 만들기
          </button>
        </div>

        {/* 필터 */}
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-slate-600">구분</span>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors
                ${filterType === 'ALL'
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                }`}
            >
              전체보기
            </button>
            {ASSESSMENT_TYPES.map(type => (
              <button
                key={type.id}
                onClick={() => setFilterType(type.id)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors
                  ${filterType === type.id
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                  }`}
              >
                {type.shortLabel} 위험성평가
              </button>
            ))}
          </div>
        </div>

        {/* 테이블 */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">작업기간</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">작업공종(대분류)</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">작업자</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">구분</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">상태</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">결재 근로자</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">근 미확인 근로자</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssessments.map((assessment) => {
                const typeInfo = ASSESSMENT_TYPES.find(t => t.id === assessment.type);
                const statusInfo = STATUS_LABELS[assessment.status];
                return (
                  <tr
                    key={assessment.id}
                    className="border-b border-gray-100 hover:bg-orange-50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {assessment.workPeriodStart.slice(5)} ~ {assessment.workPeriodEnd.slice(5)}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-700 font-medium">
                      {assessment.workCategory}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {assessment.assignee}
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-slate-600">
                        {typeInfo?.shortLabel}(면봉기)
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {assessment.workerCount}명
                    </td>
                    <td className="px-4 py-4 text-sm">
                      {assessment.unconfirmedCount && assessment.unconfirmedCount > 0 ? (
                        <span className="text-red-600 font-medium">{assessment.unconfirmedCount}명</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredAssessments.length === 0 && (
            <div className="py-16 text-center">
              <FileText size={48} className="mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500 font-medium">등록된 위험성평가가 없습니다</p>
              <p className="text-sm text-slate-400 mt-1">위험성평가를 추가해주세요</p>
            </div>
          )}
        </div>

        {/* 페이지네이션 */}
        <div className="flex justify-center gap-1">
          <button className="w-8 h-8 flex items-center justify-center text-sm text-slate-400">&lt;</button>
          <button className="w-8 h-8 flex items-center justify-center text-sm font-bold text-white bg-orange-500 rounded">1</button>
          <button className="w-8 h-8 flex items-center justify-center text-sm text-slate-600 hover:bg-gray-100 rounded">2</button>
          <button className="w-8 h-8 flex items-center justify-center text-sm text-slate-600 hover:bg-gray-100 rounded">3</button>
          <button className="w-8 h-8 flex items-center justify-center text-sm text-slate-600 hover:bg-gray-100 rounded">4</button>
          <button className="w-8 h-8 flex items-center justify-center text-sm text-slate-600 hover:bg-gray-100 rounded">5</button>
          <button className="w-8 h-8 flex items-center justify-center text-sm text-slate-400">&gt;</button>
        </div>
      </div>

      {/* 유형 선택 모달 */}
      <AssessmentTypeSelectModal
        isOpen={showTypeModal}
        onClose={() => setShowTypeModal(false)}
        onSelect={handleTypeSelect}
      />
    </>
  );
}

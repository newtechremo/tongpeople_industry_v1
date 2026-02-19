import { useEffect, useMemo, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { Plus, FileText, Calendar, RefreshCw, Clock } from 'lucide-react';

import AssessmentTypeSelectModal, { AssessmentType } from '../components/risk-assessment/AssessmentTypeSelectModal';

import { getActiveTeams, getTeamById } from '@/mocks/teams';



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

  author: string; // 작성자

  teamId?: string; // 소속 팀 ID

  createdAt: string;

  workerCount?: number;

  unconfirmedCount?: number;

  // 레거시 필드 (하위 호환성)

  assignee?: string;

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

const AVAILABLE_CREATE_TYPES: AssessmentType[] = ['INITIAL'];



const STATUS_LABELS: Record<AssessmentStatus, { label: string; color: string }> = {

  DRAFT: { label: '작성중', color: 'bg-yellow-100 text-yellow-700' },

  PENDING: { label: '결재대기', color: 'bg-blue-100 text-blue-700' },

  APPROVED: { label: '승인완료', color: 'bg-green-100 text-green-700' },

  REJECTED: { label: '반려', color: 'bg-red-100 text-red-700' },

  IN_PROGRESS: { label: '작업대기중', color: 'bg-orange-100 text-orange-700' },

  COMPLETED: { label: '작업종료', color: 'bg-gray-100 text-gray-600' },

};



const LOCAL_STORAGE_PREFIX = 'risk-assessment:draft:';



// Mock 데이터

const MOCK_ASSESSMENTS: RiskAssessment[] = [

  {

    id: '1',

    type: 'OCCASIONAL',

    title: '가설사무실 설치',

    status: 'IN_PROGRESS',

    workPeriodStart: '2026-01-28',

    workPeriodEnd: '2026-02-05',

    workCategory: '가설사무실 설치',

    author: '강일동',

    teamId: 'team-001',

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

    author: '강일동',

    teamId: 'team-001',

    createdAt: '2026-01-05',

    workerCount: 5,

    unconfirmedCount: 0,

  },

  {

    id: '3',

    type: 'INITIAL',

    title: '최초 위험성평가',

    status: 'APPROVED',

    workPeriodStart: '2026-01-20',

    workPeriodEnd: '2026-02-20',

    workCategory: '전체 공종',

    author: '김안전',

    teamId: 'all',

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

    author: '박현장',

    teamId: 'team-002',

    createdAt: '2026-01-03',

    workerCount: 32,

    unconfirmedCount: 0,

  },

  {

    id: '5',

    type: 'OCCASIONAL',

    title: '양중작업',

    status: 'PENDING',

    workPeriodStart: '2026-01-30',

    workPeriodEnd: '2026-02-10',

    workCategory: '양중작업',

    author: '이기사',

    teamId: 'team-003',

    createdAt: '2026-01-08',

    workerCount: 12,

    unconfirmedCount: 5,

  },

  {

    id: '6',

    type: 'CONTINUOUS',

    title: '고소작업 안전점검',

    status: 'IN_PROGRESS',

    workPeriodStart: '2026-01-15',

    workPeriodEnd: '2026-03-31',

    workCategory: '고소작업',

    author: '최안전',

    teamId: 'team-004',

    createdAt: '2026-01-02',

    workerCount: 18,

    unconfirmedCount: 2,

  },

  {

    id: '7',

    type: 'OCCASIONAL',

    title: '전기배선 작업',

    status: 'PENDING',

    workPeriodStart: '2026-02-01',

    workPeriodEnd: '2026-02-15',

    workCategory: '전기공사',

    author: '정전기',

    teamId: 'team-005',

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

    author: '김배관',

    teamId: 'team-002',

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

    author: '박현장',

    teamId: 'all',

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

    author: '이용접',

    teamId: 'team-003',

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



interface LocalDraft {

  id: string;

  type: string;

  title?: string;

  workPeriodStart: string;

  workPeriodEnd: string;

  categories?: { categoryName?: string }[];

  created_at?: string;

}



const TYPE_FROM_DRAFT: Record<string, AssessmentType> = {

  INITIAL: 'INITIAL',

  ADHOC: 'OCCASIONAL',

  FREQUENCY_INTENSITY: 'CONTINUOUS',

};



function loadDrafts(): RiskAssessment[] {

  if (typeof window === 'undefined') return [];



  const drafts: RiskAssessment[] = [];



  try {

    for (let i = 0; i < localStorage.length; i += 1) {

      const key = localStorage.key(i);

      if (!key || !key.startsWith(LOCAL_STORAGE_PREFIX)) continue;



      const raw = localStorage.getItem(key);

      if (!raw) continue;



      const parsed = JSON.parse(raw) as LocalDraft;

      const mappedType = TYPE_FROM_DRAFT[parsed.type] || 'INITIAL';

      const workCategory = parsed.categories?.[0]?.categoryName || '작업 공종 미지정';

      const createdAt = parsed.created_at

        ? parsed.created_at.slice(0, 10)

        : new Date().toISOString().slice(0, 10);



      drafts.push({

        id: parsed.id || key.replace(LOCAL_STORAGE_PREFIX, ''),

        type: mappedType,

        title: parsed.title || '최초 위험성평가',

        status: parsed.status || 'PENDING',

        workPeriodStart: parsed.workPeriodStart || '',

        workPeriodEnd: parsed.workPeriodEnd || '',

        workCategory,

        author: '-',

        teamId: 'all',

        createdAt,

        workerCount: 0,

        unconfirmedCount: 0,

      });

    }

  } catch {

    return [];

  }



  return drafts;

}



// 작업기간 상태 계산
const getWorkPeriodStatus = (startDate: string, endDate: string): string => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  if (today < start) {
    return '작업기간 전';
  } else if (today > end) {
    return '작업완료';
  } else {
    return '작업기간 중';
  }
};

// 결재상태 계산
const getApprovalStatus = (status: AssessmentStatus): { label: string; color: string } => {
  if (status === 'APPROVED' || status === 'COMPLETED') {
    return { label: '결재완료', color: 'bg-green-100 text-green-700' };
  } else {
    return { label: '결재진행중', color: 'bg-blue-100 text-blue-700' };
  }
};

export default function RiskAssessmentPage() {

  const navigate = useNavigate();

  const [filterType, setFilterType] = useState<AssessmentType | 'ALL'>('ALL');

  const [showTypeModal, setShowTypeModal] = useState(false);

  const [drafts, setDrafts] = useState<RiskAssessment[]>([]);

  const teams = useMemo(() => getActiveTeams(), []);



  useEffect(() => {

    setDrafts(loadDrafts());

  }, []);



  const combinedAssessments = useMemo(() => {

    const all = [...drafts, ...MOCK_ASSESSMENTS];

    return all.sort((a, b) => {

      const aTime = new Date(a.createdAt).getTime();

      const bTime = new Date(b.createdAt).getTime();

      return bTime - aTime;

    });

  }, [drafts]);





  // 필터링된 목록

  const filteredAssessments = filterType === 'ALL'

    ? combinedAssessments

    : combinedAssessments.filter(a => a.type === filterType);



  // 만들기 버튼 클릭

  const handleCreateClick = () => {

    if (filterType !== 'ALL') {
      if (!AVAILABLE_CREATE_TYPES.includes(filterType)) {
        alert('해당 유형은 아직 만들기 기능이 준비되지 않았습니다.');
        return;
      }

      // 특정 유형 필터 선택 상태 → 바로 이동

      navigate(`/safety/risk/create/${TYPE_URL_MAP[filterType]}`);

    } else {

      // 전체 필터 → 팝업 표시

      setShowTypeModal(true);

    }

  };



  // 팝업에서 유형 선택 시

  const handleTypeSelect = (type: AssessmentType) => {
    if (!AVAILABLE_CREATE_TYPES.includes(type)) {
      alert('해당 유형은 아직 만들기 기능이 준비되지 않았습니다.');
      return;
    }

    navigate(`/safety/risk/create/${TYPE_URL_MAP[type]}`);

  };



  return (

    <>

      <div className="space-y-6">

        {/* 헤더 */}

        <div className="flex items-center justify-between">

          <div>

            <h1 className="text-2xl font-black tracking-tight text-slate-800">위험성 평가</h1>

            <p className="text-base text-slate-500 mt-1">현장의 위험성평가 문서를 관리합니다</p>

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

          <span className="text-base font-medium text-slate-600">구분</span>

          <div className="flex gap-2">

            <button

              onClick={() => setFilterType('ALL')}

              className={`px-4 py-2 text-base font-medium rounded-lg transition-colors

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

                className={`px-4 py-2 text-base font-medium rounded-lg transition-colors

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

                <th className="px-4 py-3 text-left text-sm font-bold text-slate-500 uppercase">소속</th>

                <th className="px-4 py-3 text-left text-sm font-bold text-slate-500 uppercase">작업기간</th>

                <th className="px-4 py-3 text-left text-sm font-bold text-slate-500 uppercase">작업공종(대분류)</th>

                <th className="px-4 py-3 text-left text-sm font-bold text-slate-500 uppercase">작성자</th>

                <th className="px-4 py-3 text-left text-sm font-bold text-slate-500 uppercase">구분</th>

                <th className="px-4 py-3 text-left text-sm font-bold text-slate-500 uppercase">결재상태</th>

              </tr>

            </thead>

            <tbody>

              {filteredAssessments.map((assessment) => {

                const teamName = assessment.teamId === 'all'
                  ? '전체'
                  : getTeamById(assessment.teamId || '')?.name || '미지정';
                const workPeriodStatus = getWorkPeriodStatus(assessment.workPeriodStart, assessment.workPeriodEnd);
                const approvalStatus = getApprovalStatus(assessment.status);

                return (

                  <tr

                    key={assessment.id}

                    onClick={() => {
                      // 최초 위험성평가는 모두 열람 가능
                      if (assessment.type === 'INITIAL') {
                        navigate(`/safety/risk/${assessment.id}`);
                        return;
                      }

                      // 수시/정기/상시는 개발중
                      alert('해당 유형의 위험성평가는 현재 개발중입니다.\n최초 위험성평가만 상세보기가 가능합니다.');
                    }}

                    className="border-b border-gray-100 transition-colors cursor-pointer hover:bg-orange-50"

                  >

                    {/* 소속 */}
                    <td className="px-4 py-4 text-base text-slate-600">

                      {teamName}

                    </td>

                    {/* 작업기간 */}
                    <td className="px-4 py-4 text-base text-slate-600">

                      {assessment.workPeriodStart.slice(2)} ~ {assessment.workPeriodEnd.slice(2)}

                    </td>

                    {/* 작업공종(대분류) */}
                    <td className="px-4 py-4 text-base text-slate-700 font-medium">

                      {assessment.workCategory}

                    </td>

                    {/* 작성자 */}
                    <td className="px-4 py-4 text-base text-slate-600">

                      {assessment.author}

                    </td>

                    {/* 구분 (작업기간 상태) */}
                    <td className="px-4 py-4">

                      <span className={`px-2 py-1 text-sm font-medium rounded ${
                        workPeriodStatus === '작업기간 전'
                          ? 'bg-gray-100 text-gray-700'
                          : workPeriodStatus === '작업기간 중'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>

                        {workPeriodStatus}

                      </span>

                    </td>

                    {/* 결재상태 */}
                    <td className="px-4 py-4">

                      <span className={`px-2 py-1 text-sm font-medium rounded ${approvalStatus.color}`}>

                        {approvalStatus.label}

                      </span>

                    </td>

                  </tr>

                );

              })}

            </tbody>

          </table>



          {filteredAssessments.length === 0 && (

            <div className="py-16 text-center">

              <FileText size={48} className="mx-auto mb-4 text-slate-300" />

              <p className="text-base text-slate-500 font-medium">등록된 위험성평가가 없습니다</p>

              <p className="text-base text-slate-400 mt-1">위험성평가를 추가해주세요</p>

            </div>

          )}

        </div>



        {/* 페이지네이션 */}

        <div className="flex justify-center gap-1">

          <button className="w-10 h-10 flex items-center justify-center text-base text-slate-400">&lt;</button>

          <button className="w-10 h-10 flex items-center justify-center text-base font-bold text-white bg-orange-500 rounded">1</button>

          <button className="w-10 h-10 flex items-center justify-center text-base text-slate-600 hover:bg-gray-100 rounded">2</button>

          <button className="w-10 h-10 flex items-center justify-center text-base text-slate-600 hover:bg-gray-100 rounded">3</button>

          <button className="w-10 h-10 flex items-center justify-center text-base text-slate-600 hover:bg-gray-100 rounded">4</button>

          <button className="w-10 h-10 flex items-center justify-center text-base text-slate-600 hover:bg-gray-100 rounded">5</button>

          <button className="w-10 h-10 flex items-center justify-center text-base text-slate-400">&gt;</button>

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


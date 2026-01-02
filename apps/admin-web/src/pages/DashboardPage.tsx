import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserCheck,
  AlertCircle,
  ShieldAlert,
  Megaphone,
  X,
  ChevronRight,
  Building2,
  MapPin,
  UserPlus,
  UsersRound,
  UserRoundPlus,
  Sparkles,
  Clock,
} from 'lucide-react';
import KpiCard from '@/components/KpiCard';
import { SENIOR_AGE_THRESHOLD } from '@tong-pass/shared';

// 공지사항 데이터
const notices = [
  { id: 1, text: '시스템 점검 안내: 1월 5일 새벽 2시~4시 서비스 점검이 예정되어 있습니다.' },
  { id: 2, text: '새로운 기능 안내: 위험성 평가 모듈이 곧 출시됩니다.' },
  { id: 3, text: '안전교육 이수 마감일: 이번 달 말까지 필수 안전교육을 완료해주세요.' },
];

// 임시 데이터 (나중에 API로 대체)
const mockData = {
  totalWorkers: 128,
  managerCount: 12,
  workerCount: 116,
  seniorCount: 23,
  checkoutRate: 87,
  accidentCount: 0,
};

// 회사 정보 (나중에 Context로 대체)
const companyInfo = {
  name: '(주)통하는사람들',
  address: '서울특별시 강남구 테헤란로 123',
  businessNumber: '123-45-67890',
};

export default function DashboardPage() {
  const seniorRatio = Math.round((mockData.seniorCount / mockData.totalWorkers) * 100);
  const [currentNoticeIndex, setCurrentNoticeIndex] = useState(0);
  const [showTrialBanner, setShowTrialBanner] = useState(true);
  const trialDaysLeft = 14;

  // 공지사항 자동 슬라이드
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentNoticeIndex((prev) => (prev + 1) % notices.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleQuickAction = (action: string) => {
    alert(`${action} 기능은 준비중입니다.`);
  };

  return (
    <div className="space-y-6">
      {/* 무료 체험 배너 */}
      {showTrialBanner && (
        <div className="relative bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-4 text-white overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-1/3 w-24 h-24 bg-white/10 rounded-full translate-y-1/2" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Sparkles size={24} />
              </div>
              <div>
                <p className="font-bold text-lg">무료 체험 기간</p>
                <p className="text-sm text-orange-100">
                  <span className="font-black text-white">{trialDaysLeft}일</span> 남았습니다.
                  모든 기능을 무료로 이용해보세요!
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/subscription"
                className="px-5 py-2.5 bg-white text-orange-600 rounded-xl font-bold text-sm
                           hover:bg-orange-50 transition-colors"
              >
                구독 플랜 보기
              </Link>
              <button
                onClick={() => setShowTrialBanner(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 공지사항 슬라이더 */}
      <div className="bg-slate-800 rounded-xl px-5 py-3 flex items-center gap-4">
        <div className="flex items-center gap-2 shrink-0">
          <Megaphone size={18} className="text-orange-400" />
          <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">공지</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <p className="text-sm text-white truncate">
            {notices[currentNoticeIndex].text}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex gap-1">
            {notices.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentNoticeIndex(idx)}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  idx === currentNoticeIndex ? 'bg-orange-400' : 'bg-slate-600'
                }`}
              />
            ))}
          </div>
          <Link
            to="/notice"
            className="text-xs text-slate-400 hover:text-white ml-2 flex items-center gap-1"
          >
            전체보기
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>

      {/* 회사 정보 & 빠른 액션 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 소속 회사 정보 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-wider">소속 회사</h3>
            <Link
              to="/settings?tab=account"
              className="text-xs text-orange-600 hover:text-orange-700 font-bold flex items-center gap-1"
            >
              더보기
              <ChevronRight size={14} />
            </Link>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-50 rounded-xl">
                <Building2 size={24} className="text-orange-500" />
              </div>
              <div>
                <p className="text-lg font-black text-slate-800">{companyInfo.name}</p>
                <p className="text-xs text-slate-400">사업자번호: {companyInfo.businessNumber}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 text-sm text-slate-500">
              <MapPin size={16} className="text-slate-400 mt-0.5 shrink-0" />
              <span>{companyInfo.address}</span>
            </div>
          </div>
        </div>

        {/* 빠른 액션 */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-sm font-black text-slate-500 uppercase tracking-wider mb-4">빠른 액션</h3>
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => handleQuickAction('관리자 추가')}
              className="p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors group"
            >
              <div className="w-12 h-12 bg-blue-100 group-hover:bg-blue-200 rounded-xl flex items-center justify-center mx-auto mb-3 transition-colors">
                <UserPlus size={24} className="text-blue-600" />
              </div>
              <p className="text-sm font-bold text-slate-700">관리자 추가</p>
              <p className="text-xs text-slate-400 mt-1">새 관리자 초대</p>
            </button>

            <button
              onClick={() => handleQuickAction('팀 추가')}
              className="p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors group"
            >
              <div className="w-12 h-12 bg-purple-100 group-hover:bg-purple-200 rounded-xl flex items-center justify-center mx-auto mb-3 transition-colors">
                <UsersRound size={24} className="text-purple-600" />
              </div>
              <p className="text-sm font-bold text-slate-700">팀 추가</p>
              <p className="text-xs text-slate-400 mt-1">새 팀/부서 생성</p>
            </button>

            <button
              onClick={() => handleQuickAction('신규 근로자 초대')}
              className="p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors group"
            >
              <div className="w-12 h-12 bg-green-100 group-hover:bg-green-200 rounded-xl flex items-center justify-center mx-auto mb-3 transition-colors">
                <UserRoundPlus size={24} className="text-green-600" />
              </div>
              <p className="text-sm font-bold text-slate-700">근로자 초대</p>
              <p className="text-xs text-slate-400 mt-1">신규 근로자 등록</p>
            </button>
          </div>
        </div>
      </div>

      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-800">
            실시간 현황 대시보드
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            현장 인원 현황 및 안전 지표
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Clock size={16} />
          <span>마지막 업데이트: 방금 전</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="총 출근 현황"
          value={mockData.totalWorkers}
          unit="명"
          icon={Users}
          subtext={`관리자 ${mockData.managerCount}명 / 근로자 ${mockData.workerCount}명`}
        />
        <KpiCard
          title="퇴근율"
          value={mockData.checkoutRate}
          unit="%"
          icon={UserCheck}
          variant={mockData.checkoutRate === 100 ? 'success' : 'default'}
        />
        <KpiCard
          title={`고령자 (${SENIOR_AGE_THRESHOLD}세+)`}
          value={mockData.seniorCount}
          unit="명"
          icon={AlertCircle}
          subtext={`전체의 ${seniorRatio}%`}
          variant="warning"
        />
        <KpiCard
          title="금일 사고"
          value={mockData.accidentCount}
          unit="건"
          icon={ShieldAlert}
          variant={mockData.accidentCount > 0 ? 'danger' : 'success'}
        />
      </div>

      {/* Charts Section (Placeholder) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-500 uppercase mb-4">
            소속별 인원 현황
          </h3>
          <div className="h-64 flex items-center justify-center text-slate-400">
            차트 영역 (Recharts)
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-500 uppercase mb-4">
            역할별 비율
          </h3>
          <div className="h-64 flex items-center justify-center text-slate-400">
            파이 차트 영역
          </div>
        </div>
      </div>
    </div>
  );
}

import { Users, UserCheck, AlertCircle, ShieldAlert } from 'lucide-react';
import KpiCard from '@/components/KpiCard';
import { SENIOR_AGE_THRESHOLD } from '@tong-pass/shared';

// 임시 데이터 (나중에 API로 대체)
const mockData = {
  totalWorkers: 128,
  managerCount: 12,
  workerCount: 116,
  seniorCount: 23,
  checkoutRate: 87,
  accidentCount: 0,
};

export default function DashboardPage() {
  const seniorRatio = Math.round((mockData.seniorCount / mockData.totalWorkers) * 100);

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-xl font-black tracking-tight text-slate-800">
          전체 안전관리 대시보드
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          실시간 현장 인원 현황 및 안전 지표
        </p>
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

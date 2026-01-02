import { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  ChevronDown,
  Crown,
  Phone,
  MoreVertical,
  UserCheck,
  UserX,
  Clock,
  LayoutGrid,
  LayoutList,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Users2,
  Filter,
} from 'lucide-react';
import type { Worker, Team, AttendanceStatus, UserRole } from '@tong-pass/shared';
import WorkerAddModal from '@/components/workers/WorkerAddModal';
import WorkerDetailDrawer from '@/components/workers/WorkerDetailDrawer';

// Mock 데이터: 팀(업체) 목록
const mockTeams: Team[] = [
  { id: 1, name: 'A업체(전기팀)', siteId: 1, leaderId: 'w1', leaderName: '김철수', workerCount: 5 },
  { id: 2, name: 'B업체(미장팀)', siteId: 1, leaderId: 'w6', leaderName: '이영희', workerCount: 4 },
  { id: 3, name: 'C업체(설비팀)', siteId: 1, leaderId: 'w10', leaderName: '박민수', workerCount: 3 },
];

// Mock 데이터: 근로자 목록
const mockWorkers: Worker[] = [
  // A업체(전기팀)
  { id: 'w1', name: '김철수', phone: '010-1234-5678', birthDate: '1980-03-15', age: 45, isSenior: false, siteId: 1, teamId: 1, teamName: 'A업체(전기팀)', role: 'TEAM_ADMIN', position: '전기기사', status: 'ACTIVE', attendanceStatus: 'CHECKED_IN', totalWorkDays: 156, monthlyWorkDays: 18, registeredAt: '2024-01-15' },
  { id: 'w2', name: '박영수', phone: '010-2345-6789', birthDate: '1958-07-22', age: 67, isSenior: true, siteId: 1, teamId: 1, teamName: 'A업체(전기팀)', role: 'WORKER', position: '일반근로자', status: 'ACTIVE', attendanceStatus: 'CHECKED_IN', totalWorkDays: 89, monthlyWorkDays: 15, registeredAt: '2024-03-01' },
  { id: 'w3', name: '최민정', phone: '010-3456-7890', birthDate: '1992-11-08', age: 33, isSenior: false, siteId: 1, teamId: 1, teamName: 'A업체(전기팀)', role: 'WORKER', position: '전기기사', status: 'ACTIVE', attendanceStatus: 'CHECKED_OUT', totalWorkDays: 45, monthlyWorkDays: 12, registeredAt: '2024-06-15' },
  { id: 'w4', name: '정대호', phone: '010-4567-8901', birthDate: '1975-05-30', age: 50, isSenior: false, siteId: 1, teamId: 1, teamName: 'A업체(전기팀)', role: 'WORKER', position: '일반근로자', isRepresentative: true, status: 'ACTIVE', attendanceStatus: 'NOT_TODAY', totalWorkDays: 234, monthlyWorkDays: 20, registeredAt: '2023-08-01' },
  { id: 'w5', name: '한수진', phone: '010-5678-9012', birthDate: '1988-09-12', age: 37, isSenior: false, siteId: 1, teamId: 1, teamName: 'A업체(전기팀)', role: 'WORKER', position: '안전관리자', status: 'PENDING', registeredAt: '2025-01-02' },

  // B업체(미장팀)
  { id: 'w6', name: '이영희', phone: '010-6789-0123', birthDate: '1970-04-25', age: 55, isSenior: false, siteId: 1, teamId: 2, teamName: 'B업체(미장팀)', role: 'TEAM_ADMIN', position: '미장기사', status: 'ACTIVE', attendanceStatus: 'CHECKED_IN', totalWorkDays: 312, monthlyWorkDays: 22, registeredAt: '2023-02-10' },
  { id: 'w7', name: '송기범', phone: '010-7890-1234', birthDate: '1960-12-01', age: 65, isSenior: true, siteId: 1, teamId: 2, teamName: 'B업체(미장팀)', role: 'WORKER', position: '일반근로자', status: 'ACTIVE', attendanceStatus: 'CHECKED_IN', totalWorkDays: 178, monthlyWorkDays: 19, registeredAt: '2023-11-05' },
  { id: 'w8', name: '윤서연', phone: '010-8901-2345', birthDate: '1995-02-18', age: 30, isSenior: false, siteId: 1, teamId: 2, teamName: 'B업체(미장팀)', role: 'WORKER', position: '미장기사', status: 'ACTIVE', attendanceStatus: 'CHECKED_OUT', totalWorkDays: 67, monthlyWorkDays: 16, registeredAt: '2024-07-20' },
  { id: 'w9', name: '강민호', phone: '010-9012-3456', birthDate: '1982-08-05', age: 43, isSenior: false, siteId: 1, teamId: 2, teamName: 'B업체(미장팀)', role: 'WORKER', position: '일반근로자', status: 'INACTIVE', registeredAt: '2024-05-01' },

  // C업체(설비팀)
  { id: 'w10', name: '박민수', phone: '010-0123-4567', birthDate: '1968-06-30', age: 57, isSenior: false, siteId: 1, teamId: 3, teamName: 'C업체(설비팀)', role: 'TEAM_ADMIN', position: '설비기사', status: 'ACTIVE', attendanceStatus: 'CHECKED_IN', totalWorkDays: 289, monthlyWorkDays: 21, registeredAt: '2023-04-15' },
  { id: 'w11', name: '오지훈', phone: '010-1111-2222', birthDate: '1990-10-10', age: 35, isSenior: false, siteId: 1, teamId: 3, teamName: 'C업체(설비팀)', role: 'WORKER', position: '설비기사', status: 'ACTIVE', attendanceStatus: 'NOT_TODAY', totalWorkDays: 112, monthlyWorkDays: 14, registeredAt: '2024-04-01' },
  { id: 'w12', name: '임하늘', phone: '010-2222-3333', birthDate: '1956-01-20', age: 69, isSenior: true, siteId: 1, teamId: 3, teamName: 'C업체(설비팀)', role: 'WORKER', position: '일반근로자', status: 'ACTIVE', attendanceStatus: 'CHECKED_IN', totalWorkDays: 456, monthlyWorkDays: 22, registeredAt: '2022-06-01' },
];

// 역할 필터 옵션
type RoleFilter = 'ALL' | 'TEAM_ADMIN' | 'WORKER' | 'REPRESENTATIVE';
const ROLE_FILTER_OPTIONS: { value: RoleFilter; label: string }[] = [
  { value: 'ALL', label: '전체 역할' },
  { value: 'TEAM_ADMIN', label: '팀 관리자' },
  { value: 'WORKER', label: '일반 근로자' },
  { value: 'REPRESENTATIVE', label: '근로자 대표' },
];

// 상태 필터 옵션
type StatusFilter = 'ALL' | 'CHECKED_IN' | 'CHECKED_OUT' | 'NOT_TODAY' | 'PENDING' | 'INACTIVE';
const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: '전체 상태' },
  { value: 'CHECKED_IN', label: '출근 중' },
  { value: 'CHECKED_OUT', label: '퇴근' },
  { value: 'NOT_TODAY', label: '미출근' },
  { value: 'PENDING', label: '승인대기' },
  { value: 'INACTIVE', label: '비활성' },
];

const ITEMS_PER_PAGE = 10;

// 출퇴근 상태 표시 컴포넌트
function AttendanceStatusBadge({ status, workerStatus }: { status?: AttendanceStatus; workerStatus: Worker['status'] }) {
  if (workerStatus === 'PENDING') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-yellow-700 bg-yellow-100 rounded-full">
        승인대기
      </span>
    );
  }
  if (workerStatus === 'INACTIVE') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-red-700 bg-red-100 rounded-full">
        비활성
      </span>
    );
  }
  if (!status || status === 'NOT_TODAY') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-full">
        <Clock size={12} />
        미출근
      </span>
    );
  }
  if (status === 'CHECKED_IN') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-green-700 bg-green-100 rounded-full">
        <UserCheck size={12} />
        출근 중
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-blue-700 bg-blue-100 rounded-full">
      <UserX size={12} />
      퇴근
    </span>
  );
}

export default function WorkersPage() {
  // 필터 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [teamFilter, setTeamFilter] = useState<number | 'ALL'>('ALL');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  // UI 상태
  const [isGroupView, setIsGroupView] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [expandedTeams, setExpandedTeams] = useState<number[]>(mockTeams.map(t => t.id));

  // 필터링된 근로자 목록
  const filteredWorkers = useMemo(() => {
    return mockWorkers
      .filter(worker => {
        // 검색 필터
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          if (!worker.name.toLowerCase().includes(query) &&
              !worker.phone.includes(query)) {
            return false;
          }
        }

        // 팀 필터
        if (teamFilter !== 'ALL' && worker.teamId !== teamFilter) {
          return false;
        }

        // 역할 필터
        if (roleFilter !== 'ALL') {
          if (roleFilter === 'TEAM_ADMIN' && worker.role !== 'TEAM_ADMIN') return false;
          if (roleFilter === 'WORKER' && worker.role !== 'WORKER') return false;
          if (roleFilter === 'REPRESENTATIVE' && !worker.isRepresentative) return false;
        }

        // 상태 필터
        if (statusFilter !== 'ALL') {
          if (statusFilter === 'PENDING' && worker.status !== 'PENDING') return false;
          if (statusFilter === 'INACTIVE' && worker.status !== 'INACTIVE') return false;
          if (statusFilter === 'CHECKED_IN' && worker.attendanceStatus !== 'CHECKED_IN') return false;
          if (statusFilter === 'CHECKED_OUT' && worker.attendanceStatus !== 'CHECKED_OUT') return false;
          if (statusFilter === 'NOT_TODAY' && worker.attendanceStatus !== 'NOT_TODAY') return false;
        }

        return true;
      })
      // 정렬: 팀명 -> 역할(리더 우선) -> 이름
      .sort((a, b) => {
        // 1. 팀명 정렬
        const teamCompare = (a.teamName || '').localeCompare(b.teamName || '');
        if (teamCompare !== 0) return teamCompare;

        // 2. 역할 정렬 (리더 우선)
        if (a.role === 'TEAM_ADMIN' && b.role !== 'TEAM_ADMIN') return -1;
        if (a.role !== 'TEAM_ADMIN' && b.role === 'TEAM_ADMIN') return 1;

        // 3. 이름 정렬
        return a.name.localeCompare(b.name);
      });
  }, [searchQuery, teamFilter, roleFilter, statusFilter]);

  // 필터링된 통계 (필터 결과에 맞춰 동기화)
  const filteredStats = useMemo(() => {
    return {
      total: filteredWorkers.length,
      active: filteredWorkers.filter(w => w.status === 'ACTIVE').length,
      checkedIn: filteredWorkers.filter(w => w.attendanceStatus === 'CHECKED_IN').length,
      senior: filteredWorkers.filter(w => w.isSenior).length,
    };
  }, [filteredWorkers]);

  // 페이지네이션
  const totalPages = Math.ceil(filteredWorkers.length / ITEMS_PER_PAGE);
  const paginatedWorkers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredWorkers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredWorkers, currentPage]);

  // 팀별 그룹화 데이터
  const workersByTeam = useMemo(() => {
    return mockTeams.map(team => ({
      team,
      workers: filteredWorkers.filter(w => w.teamId === team.id),
    })).filter(g => g.workers.length > 0);
  }, [filteredWorkers]);

  // 전체 선택/해제
  const isAllSelected = paginatedWorkers.length > 0 && paginatedWorkers.every(w => selectedWorkers.includes(w.id));
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedWorkers([]);
    } else {
      setSelectedWorkers(paginatedWorkers.map(w => w.id));
    }
  };

  const toggleSelectWorker = (workerId: string) => {
    setSelectedWorkers(prev =>
      prev.includes(workerId)
        ? prev.filter(id => id !== workerId)
        : [...prev, workerId]
    );
  };

  // 필터 초기화
  const resetFilters = () => {
    setSearchQuery('');
    setTeamFilter('ALL');
    setRoleFilter('ALL');
    setStatusFilter('ALL');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery || teamFilter !== 'ALL' || roleFilter !== 'ALL' || statusFilter !== 'ALL';

  // 팀 토글
  const toggleTeam = (teamId: number) => {
    setExpandedTeams(prev =>
      prev.includes(teamId)
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    );
  };

  // 일괄 액션 핸들러
  const handleBulkAction = (action: string) => {
    alert(`${selectedWorkers.length}명 선택됨: ${action} 기능은 준비중입니다.`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-800">근로자 관리</h1>
          <p className="text-sm text-slate-500 mt-1">
            팀(업체)별 근로자 현황을 관리합니다
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white
                     bg-gradient-to-r from-orange-500 to-orange-600
                     hover:from-orange-600 hover:to-orange-700 transition-all"
        >
          <UserPlus size={18} />
          신규 동의링크
        </button>
      </div>

      {/* (1) 상단 요약 배너 - 필터 결과에 동기화 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-slate-500">전체 근로자</p>
          <p className="text-2xl font-black text-slate-800 mt-1">{filteredStats.total}명</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-slate-500">활성 근로자</p>
          <p className="text-2xl font-black text-green-600 mt-1">{filteredStats.active}명</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-slate-500">금일 출근</p>
          <p className="text-2xl font-black text-blue-600 mt-1">{filteredStats.checkedIn}명</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-slate-500">고령 근로자</p>
          <p className="text-2xl font-black text-orange-600 mt-1">{filteredStats.senior}명</p>
        </div>
      </div>

      {/* (2) 파워 필터 바 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* 검색창 */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="이름, 연락처 검색..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200
                         focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* 팀(업체) 필터 */}
          <div className="relative min-w-[160px]">
            <Users2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={teamFilter}
              onChange={(e) => {
                setTeamFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value));
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-8 py-2.5 rounded-lg border border-gray-200 appearance-none
                         focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
            >
              <option value="ALL">전체 팀</option>
              {mockTeams.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* 역할 필터 */}
          <div className="relative min-w-[140px]">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value as RoleFilter);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 appearance-none
                         focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
            >
              {ROLE_FILTER_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* 상태 필터 */}
          <div className="relative min-w-[130px]">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as StatusFilter);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 appearance-none
                         focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
            >
              {STATUS_FILTER_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* 필터 초기화 */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 px-3 py-2.5 text-sm text-slate-500 hover:text-slate-700"
            >
              <X size={16} />
              초기화
            </button>
          )}

          {/* 구분선 */}
          <div className="w-px h-8 bg-gray-200" />

          {/* 팀별 묶어보기 토글 */}
          <button
            onClick={() => setIsGroupView(!isGroupView)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${
              isGroupView
                ? 'bg-orange-100 text-orange-700'
                : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
            }`}
          >
            {isGroupView ? <LayoutGrid size={16} /> : <LayoutList size={16} />}
            팀별 묶기
          </button>
        </div>
      </div>

      {/* 일괄 편집 바 (선택 시 표시) */}
      {selectedWorkers.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-bold text-orange-700">
              {selectedWorkers.length}명 선택됨
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkAction('팀 변경')}
              className="px-4 py-2 rounded-lg bg-white border border-orange-300 text-orange-700 font-medium text-sm hover:bg-orange-100 transition-colors"
            >
              팀 변경
            </button>
            <button
              onClick={() => handleBulkAction('일괄 퇴근 처리')}
              className="px-4 py-2 rounded-lg bg-white border border-orange-300 text-orange-700 font-medium text-sm hover:bg-orange-100 transition-colors"
            >
              일괄 퇴근 처리
            </button>
            <button
              onClick={() => handleBulkAction('비활성화')}
              className="px-4 py-2 rounded-lg bg-white border border-red-300 text-red-700 font-medium text-sm hover:bg-red-50 transition-colors"
            >
              비활성화
            </button>
            <button
              onClick={() => setSelectedWorkers([])}
              className="p-2 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <X size={18} className="text-orange-600" />
            </button>
          </div>
        </div>
      )}

      {/* (3) 마스터 테이블 또는 그룹 뷰 */}
      {isGroupView ? (
        // 팀별 그룹 뷰 (아코디언)
        <div className="space-y-4">
          {workersByTeam.map(({ team, workers }) => (
            <div
              key={team.id}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
            >
              {/* Team Header */}
              <button
                onClick={() => toggleTeam(team.id)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Users size={20} className="text-orange-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-slate-800">{team.name}</h3>
                    <p className="text-sm text-slate-500">
                      {workers.length}명 / 리더: {team.leaderName}
                    </p>
                  </div>
                </div>
                <ChevronDown
                  size={20}
                  className={`text-slate-400 transition-transform duration-200 ${
                    expandedTeams.includes(team.id) ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Worker List */}
              {expandedTeams.includes(team.id) && workers.length > 0 && (
                <div className="border-t border-gray-100">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 text-left">
                        <th className="px-6 py-3 text-xs font-black uppercase tracking-widest text-slate-500">이름</th>
                        <th className="px-6 py-3 text-xs font-black uppercase tracking-widest text-slate-500">연락처</th>
                        <th className="px-6 py-3 text-xs font-black uppercase tracking-widest text-slate-500">직종</th>
                        <th className="px-6 py-3 text-xs font-black uppercase tracking-widest text-slate-500">나이</th>
                        <th className="px-6 py-3 text-xs font-black uppercase tracking-widest text-slate-500">상태</th>
                        <th className="px-6 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {workers.map((worker) => (
                        <tr
                          key={worker.id}
                          onClick={() => setSelectedWorker(worker)}
                          className="border-t border-gray-100 hover:bg-orange-50 cursor-pointer transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {worker.role === 'TEAM_ADMIN' && <Crown size={16} className="text-yellow-500" />}
                              <span className="font-bold text-slate-800">{worker.name}</span>
                              {worker.isSenior && (
                                <span className="px-1.5 py-0.5 text-xs font-bold text-orange-700 bg-orange-100 rounded">고령</span>
                              )}
                              {worker.isRepresentative && (
                                <span className="px-1.5 py-0.5 text-xs font-bold text-purple-700 bg-purple-100 rounded">대표</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <a href={`tel:${worker.phone}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-orange-600">
                              <Phone size={14} />{worker.phone}
                            </a>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">{worker.position || '-'}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{worker.age}세</td>
                          <td className="px-6 py-4">
                            <AttendanceStatusBadge status={worker.attendanceStatus} workerStatus={worker.status} />
                          </td>
                          <td className="px-6 py-4">
                            <button onClick={(e) => { e.stopPropagation(); }} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                              <MoreVertical size={16} className="text-slate-400" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        // 마스터 테이블 뷰
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left border-b border-gray-200">
                <th className="px-4 py-3 w-12">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                </th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-500">소속 팀(업체)</th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-500">이름</th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-500">연락처</th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-500">직종</th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-500">나이</th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-500">상태</th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-500 text-center">관리</th>
              </tr>
            </thead>
            <tbody>
              {paginatedWorkers.map((worker) => (
                <tr
                  key={worker.id}
                  className={`border-t border-gray-100 hover:bg-orange-50 cursor-pointer transition-colors ${
                    selectedWorkers.includes(worker.id) ? 'bg-orange-50' : ''
                  }`}
                >
                  <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedWorkers.includes(worker.id)}
                      onChange={() => toggleSelectWorker(worker.id)}
                      className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                  </td>
                  <td className="px-4 py-4" onClick={() => setSelectedWorker(worker)}>
                    <span className="text-sm text-slate-600">{worker.teamName}</span>
                  </td>
                  <td className="px-4 py-4" onClick={() => setSelectedWorker(worker)}>
                    <div className="flex items-center gap-2">
                      {worker.role === 'TEAM_ADMIN' && <Crown size={16} className="text-yellow-500" />}
                      <span className="font-bold text-slate-800">{worker.name}</span>
                      {worker.isSenior && (
                        <span className="px-1.5 py-0.5 text-xs font-bold text-orange-700 bg-orange-100 rounded">고령</span>
                      )}
                      {worker.isRepresentative && (
                        <span className="px-1.5 py-0.5 text-xs font-bold text-purple-700 bg-purple-100 rounded">대표</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <a
                      href={`tel:${worker.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-orange-600"
                    >
                      <Phone size={14} />
                      {worker.phone}
                    </a>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600" onClick={() => setSelectedWorker(worker)}>
                    {worker.position || '-'}
                  </td>
                  <td className="px-4 py-4" onClick={() => setSelectedWorker(worker)}>
                    <span className={`text-sm ${worker.isSenior ? 'font-bold text-orange-600' : 'text-slate-600'}`}>
                      {worker.age}세
                      {worker.isSenior && ' (고령)'}
                    </span>
                  </td>
                  <td className="px-4 py-4" onClick={() => setSelectedWorker(worker)}>
                    <AttendanceStatusBadge status={worker.attendanceStatus} workerStatus={worker.status} />
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedWorker(worker);
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <MoreVertical size={16} className="text-slate-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
              <p className="text-sm text-slate-500">
                총 {filteredWorkers.length}명 중 {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredWorkers.length)}명 표시
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={18} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-lg font-medium text-sm transition-colors ${
                      currentPage === page
                        ? 'bg-orange-500 text-white'
                        : 'border border-gray-200 hover:bg-white text-slate-600'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* 빈 상태 */}
          {filteredWorkers.length === 0 && (
            <div className="py-16 text-center">
              <Filter size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">필터 조건에 맞는 근로자가 없습니다</p>
              <button
                onClick={resetFilters}
                className="mt-4 text-orange-600 hover:text-orange-700 font-medium"
              >
                필터 초기화
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add Worker Modal */}
      <WorkerAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        teams={mockTeams}
      />

      {/* Worker Detail Drawer */}
      <WorkerDetailDrawer
        worker={selectedWorker}
        onClose={() => setSelectedWorker(null)}
      />
    </div>
  );
}

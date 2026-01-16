import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Calendar,
  Clock,
  Users,
  AlertTriangle,
  Search,
  Download,
  CheckCircle2,
  Crown,
  RefreshCw,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getAttendanceRecords } from '@/api/attendance';
import { getPartners } from '@/api/partners';
import { getWorkDate } from '@tong-pass/shared';
import { useDialog } from '@/hooks/useDialog';
import ConfirmDialog from '@/components/common/ConfirmDialog';

// 팀별 색상 매핑
const TEAM_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'A업체(전기팀)': { bg: 'bg-blue-500', border: 'border-blue-400', text: 'text-blue-600' },
  'B업체(미장팀)': { bg: 'bg-purple-500', border: 'border-purple-400', text: 'text-purple-600' },
  'C업체(설비팀)': { bg: 'bg-green-500', border: 'border-green-400', text: 'text-green-600' },
  '관리팀': { bg: 'bg-orange-500', border: 'border-orange-400', text: 'text-orange-600' },
};

// 출근 상태 타입
type AttendanceStatus = 'WORKING' | 'PENDING' | 'CHECKED_OUT';

// 출퇴근 기록 타입
interface AttendanceRecord {
  id: number;
  workerId: string;
  workerName: string;
  teamName: string;
  position: string; // 직급/직종
  birthDate: string;
  age: number;
  isSenior: boolean;
  isTeamAdmin: boolean;
  checkInTime: string | null;
  checkOutTime: string | null;
  isAutoOut: boolean;
  status: AttendanceStatus;
  photoUrl?: string; // 사진 URL (없으면 아바타 생성)
}

// Mock 데이터
const mockAttendanceData: AttendanceRecord[] = [
  {
    id: 1,
    workerId: 'w1',
    workerName: '김철수',
    teamName: 'A업체(전기팀)',
    position: '전기기사',
    birthDate: '1980-03-15',
    age: 45,
    isSenior: false,
    isTeamAdmin: true,
    checkInTime: '08:30',
    checkOutTime: null,
    isAutoOut: false,
    status: 'WORKING',
  },
  {
    id: 2,
    workerId: 'w2',
    workerName: '박영수',
    teamName: 'A업체(전기팀)',
    position: '일반근로자',
    birthDate: '1958-07-22',
    age: 67,
    isSenior: true,
    isTeamAdmin: false,
    checkInTime: '08:15',
    checkOutTime: '17:15',
    isAutoOut: true,
    status: 'CHECKED_OUT',
  },
  {
    id: 3,
    workerId: 'w3',
    workerName: '이영희',
    teamName: 'B업체(미장팀)',
    position: '미장기사',
    birthDate: '1970-04-25',
    age: 55,
    isSenior: false,
    isTeamAdmin: true,
    checkInTime: '09:00',
    checkOutTime: null,
    isAutoOut: false,
    status: 'WORKING',
  },
  {
    id: 4,
    workerId: 'w4',
    workerName: 'Abraham',
    teamName: 'C업체(설비팀)',
    position: '설비기사',
    birthDate: '1985-11-08',
    age: 40,
    isSenior: false,
    isTeamAdmin: false,
    checkInTime: '08:45',
    checkOutTime: null,
    isAutoOut: false,
    status: 'PENDING',
  },
  {
    id: 5,
    workerId: 'w5',
    workerName: '송기범',
    teamName: 'B업체(미장팀)',
    position: '일반근로자',
    birthDate: '1960-12-01',
    age: 65,
    isSenior: true,
    isTeamAdmin: false,
    checkInTime: '07:55',
    checkOutTime: '16:55',
    isAutoOut: false,
    status: 'CHECKED_OUT',
  },
  {
    id: 6,
    workerId: 'w6',
    workerName: '최민정',
    teamName: 'A업체(전기팀)',
    position: '전기기사',
    birthDate: '1992-11-08',
    age: 33,
    isSenior: false,
    isTeamAdmin: false,
    checkInTime: '08:50',
    checkOutTime: null,
    isAutoOut: false,
    status: 'PENDING',
  },
  {
    id: 7,
    workerId: 'w7',
    workerName: '정소장',
    teamName: '관리팀',
    position: '현장소장',
    birthDate: '1975-05-30',
    age: 50,
    isSenior: false,
    isTeamAdmin: true,
    checkInTime: '07:30',
    checkOutTime: null,
    isAutoOut: false,
    status: 'WORKING',
  },
  {
    id: 8,
    workerId: 'w8',
    workerName: '임하늘',
    teamName: 'C업체(설비팀)',
    position: '일반근로자',
    birthDate: '1956-01-20',
    age: 69,
    isSenior: true,
    isTeamAdmin: false,
    checkInTime: '08:20',
    checkOutTime: null,
    isAutoOut: false,
    status: 'WORKING',
  },
];

const teams = ['전체 팀', 'A업체(전기팀)', 'B업체(미장팀)', 'C업체(설비팀)', '관리팀'];

// 스마트 아바타: 한글=첫글자, 영어=앞3글자
function getAvatarText(name: string): string {
  const isKorean = /[가-힣]/.test(name);
  if (isKorean) {
    return name.charAt(0);
  }
  return name.slice(0, 3);
}

// 아바타 컴포넌트
function SmartAvatar({
  name,
  teamName,
  isSenior,
  photoUrl,
}: {
  name: string;
  teamName: string;
  isSenior: boolean;
  photoUrl?: string;
}) {
  const teamColor = TEAM_COLORS[teamName] || { bg: 'bg-slate-500', border: 'border-slate-400', text: 'text-slate-600' };
  const avatarText = getAvatarText(name);

  if (photoUrl) {
    return (
      <div
        className={`w-10 h-10 rounded-full overflow-hidden border-2 ${
          isSenior ? 'border-orange-400' : teamColor.border
        }`}
      >
        <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
        teamColor.bg
      } ${isSenior ? 'ring-2 ring-orange-400 ring-offset-1' : ''}`}
    >
      {avatarText}
    </div>
  );
}

// 상태 배지 컴포넌트
function StatusBadge({ status }: { status: AttendanceStatus }) {
  switch (status) {
    case 'WORKING':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">
          <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
          출근중
        </span>
      );
    case 'PENDING':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full">
          <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />
          승인대기
        </span>
      );
    case 'CHECKED_OUT':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
          퇴근
        </span>
      );
  }
}

export default function AttendancePage() {
  const { user } = useAuth();
  const { dialogState, showConfirm, showAlert, closeDialog } = useDialog();

  // 데이터 상태
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>(mockAttendanceData);
  const [teamList, setTeamList] = useState<string[]>(teams);
  const [isLoading, setIsLoading] = useState(false);
  const [useMockData, setUseMockData] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // 필터 상태
  const [selectedDate, setSelectedDate] = useState(getWorkDate());
  const [selectedTeam, setSelectedTeam] = useState('전체 팀');
  const [searchTerm, setSearchTerm] = useState('');

  // 데이터 로드
  const loadData = useCallback(async () => {
    if (!user?.siteId) {
      setUseMockData(true);
      return;
    }

    setIsLoading(true);
    try {
      const [recordsData, partnersData] = await Promise.all([
        getAttendanceRecords({ siteId: user.siteId, workDate: selectedDate }),
        getPartners(user.siteId),
      ]);

      if (recordsData && recordsData.length > 0) {
        // API 데이터를 AttendanceRecord 타입으로 변환
        const convertedRecords: AttendanceRecord[] = recordsData.map((r, idx) => ({
          id: r.id || idx,
          workerId: r.worker_id || '',
          workerName: r.worker_name || '',
          teamName: r.partnerName || '미지정',
          position: r.position || '일반근로자',
          birthDate: r.birth_date || '',
          age: r.birth_date ? new Date().getFullYear() - new Date(r.birth_date).getFullYear() : 0,
          isSenior: r.is_senior || false,
          isTeamAdmin: r.role === 'TEAM_ADMIN' || r.role === 'SITE_ADMIN',
          checkInTime: r.check_in_time ? new Date(r.check_in_time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : null,
          checkOutTime: r.check_out_time ? new Date(r.check_out_time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : null,
          isAutoOut: r.is_auto_out || false,
          status: r.check_out_time ? 'CHECKED_OUT' : 'WORKING',
        }));
        setAttendanceData(convertedRecords);
        setUseMockData(false);
      } else {
        setUseMockData(true);
      }

      if (partnersData && partnersData.length > 0) {
        const partnerNames = ['전체 팀', ...partnersData.map(p => p.name)];
        setTeamList(partnerNames);
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('출퇴근 데이터 로드 실패:', error);
      setUseMockData(true);
    } finally {
      setIsLoading(false);
    }
  }, [user?.siteId, selectedDate]);

  // 초기 로드 및 날짜 변경 시 재로드
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 현재 표시할 데이터
  const displayData = useMockData ? mockAttendanceData : attendanceData;
  const displayTeams = useMockData ? teams : teamList;

  // 필터링된 데이터
  const filteredData = useMemo(() => {
    return displayData.filter((record) => {
      if (selectedTeam !== '전체 팀' && record.teamName !== selectedTeam) {
        return false;
      }
      if (searchTerm && !record.workerName.includes(searchTerm)) {
        return false;
      }
      return true;
    });
  }, [selectedTeam, searchTerm]);

  // 통계 계산
  const stats = useMemo(() => {
    const total = filteredData.filter(r => r.checkInTime).length;
    const admins = filteredData.filter(r => r.checkInTime && r.isTeamAdmin).length;
    const workers = total - admins;
    const checkedOut = filteredData.filter(r => r.status === 'CHECKED_OUT').length;
    const working = filteredData.filter(r => r.status === 'WORKING').length;
    const pending = filteredData.filter(r => r.status === 'PENDING').length;
    const senior = filteredData.filter(r => r.isSenior && r.checkInTime).length;

    return { total, admins, workers, checkedOut, working, pending, senior };
  }, [filteredData]);

  const handleManualCheckout = (_id: number, workerName: string) => {
    showConfirm({
      title: '수동 퇴근 처리',
      message: `${workerName}님을 수동 퇴근 처리하시겠습니까?`,
      confirmText: '퇴근 처리',
      variant: 'warning',
      onConfirm: () => {
        // TODO: 실제 API 호출
        showAlert({
          title: '퇴근 처리 완료',
          message: `${workerName}님이 퇴근 처리되었습니다.`,
          variant: 'success',
        });
      },
    });
  };

  const handleApprove = (_id: number, workerName: string) => {
    showConfirm({
      title: '출근 승인',
      message: `${workerName}님의 출근을 승인하시겠습니까?`,
      confirmText: '승인',
      variant: 'info',
      onConfirm: () => {
        // TODO: 실제 API 호출
        showAlert({
          title: '승인 완료',
          message: `${workerName}님의 출근이 승인되었습니다.`,
          variant: 'success',
        });
      },
    });
  };

  const handleExport = () => {
    showAlert({
      title: '엑셀 다운로드',
      message: '출퇴근 기록을 엑셀로 다운로드합니다.',
      variant: 'info',
      onConfirm: () => {
        // TODO: 실제 다운로드 로직
      },
    });
  };

  const handleRefresh = () => {
    loadData();
  };

  // 날짜/시간 포맷
  const formatDateTime = (date: Date) => {
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-800">출퇴근 관리</h1>
            <p className="text-sm text-slate-500 mt-1">현장 근로자의 출퇴근 현황을 관리합니다</p>
          </div>
          {useMockData && (
            <span className="px-2 py-1 text-xs font-bold text-orange-600 bg-orange-50 rounded-lg">
              샘플 데이터
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            새로고침
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-gray-50 transition-colors"
          >
            <Download size={16} />
            엑셀 다운로드
          </button>
        </div>
      </div>

      {/* 실시간 업데이트 정보 + 통계 카드 */}
      <div className="space-y-3">
        <div className="flex items-center justify-end gap-2 text-xs text-slate-400">
          <Clock size={12} />
          <span>{formatDateTime(lastUpdated)} 기준</span>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {/* 총 출근 카드 (관리자/근로자 구분) */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <Users size={24} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">총 출근</p>
                <p className="text-2xl font-black text-slate-800">{stats.total}명</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  관리자 {stats.admins} / 근로자 {stats.workers}
                </p>
              </div>
            </div>
          </div>

          {/* 퇴근 완료 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                <CheckCircle2 size={24} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">퇴근 완료</p>
                <p className="text-2xl font-black text-slate-800">{stats.checkedOut}명</p>
              </div>
            </div>
          </div>

          {/* 근무 중 / 승인대기 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
                <Clock size={24} className="text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">근무 중</p>
                <p className="text-2xl font-black text-slate-800">{stats.working}명</p>
                {stats.pending > 0 && (
                  <p className="text-xs text-yellow-600 font-bold mt-0.5">
                    승인대기 {stats.pending}명
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 고령자 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                <AlertTriangle size={24} className="text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">고령 근로자</p>
                <p className="text-2xl font-black text-slate-800">{stats.senior}명</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 필터 영역 */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-4 flex-wrap">
          {/* 날짜 선택 */}
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* 팀 선택 */}
          <div className="relative">
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="px-4 py-2.5 pr-10 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white"
            >
              {displayTeams.map((team) => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* 검색 */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="근로자명 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 출퇴근 테이블 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-5 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-wider">
                  근로자명
                </th>
                <th className="px-5 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-wider">
                  소속 팀
                </th>
                <th className="px-5 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-wider">
                  직급/직종
                </th>
                <th className="px-5 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-wider">
                  나이/생년
                </th>
                <th className="px-5 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-wider">
                  출근
                </th>
                <th className="px-5 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-wider">
                  퇴근
                </th>
                <th className="px-5 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-5 py-4 text-right text-xs font-black text-slate-500 uppercase tracking-wider">
                  액션
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredData.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                  {/* 근로자명 (아바타 + 이름 + 역할 아이콘) */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <SmartAvatar
                        name={record.workerName}
                        teamName={record.teamName}
                        isSenior={record.isSenior}
                        photoUrl={record.photoUrl}
                      />
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-800">{record.workerName}</span>
                        {record.isTeamAdmin && (
                          <Crown size={16} className="text-blue-500" />
                        )}
                      </div>
                    </div>
                  </td>

                  {/* 소속 팀 */}
                  <td className="px-5 py-4">
                    <span className="text-sm text-slate-600">{record.teamName}</span>
                  </td>

                  {/* 직급/직종 */}
                  <td className="px-5 py-4">
                    <span className="text-sm text-slate-600">{record.position}</span>
                  </td>

                  {/* 나이/생년 */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${record.isSenior ? 'font-bold text-orange-600' : 'text-slate-600'}`}>
                        {record.age}세
                      </span>
                      {record.isSenior && (
                        <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded">
                          고령
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 출근 */}
                  <td className="px-5 py-4">
                    <span className="text-sm font-medium text-slate-800">{record.checkInTime || '-'}</span>
                  </td>

                  {/* 퇴근 */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-800">
                        {record.checkOutTime || '-'}
                      </span>
                      {record.isAutoOut && record.checkOutTime && (
                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded">
                          자동
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 상태 */}
                  <td className="px-5 py-4">
                    <StatusBadge status={record.status} />
                  </td>

                  {/* 액션 */}
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {record.status === 'PENDING' && (
                        <button
                          onClick={() => handleApprove(record.id, record.workerName)}
                          className="px-3 py-1.5 bg-orange-500 text-white text-xs font-bold rounded-lg hover:bg-orange-600 transition-colors"
                        >
                          승인
                        </button>
                      )}
                      {record.status === 'WORKING' && (
                        <button
                          onClick={() => handleManualCheckout(record.id, record.workerName)}
                          className="px-3 py-1.5 bg-gray-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-gray-300 transition-colors"
                        >
                          수동 퇴근
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 테이블 푸터 */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
          <p className="text-sm text-slate-500">
            총 <span className="font-bold text-slate-700">{filteredData.length}명</span>의 기록이 있습니다
          </p>
        </div>
      </div>

      {/* 공통 다이얼로그 */}
      <ConfirmDialog
        isOpen={dialogState.isOpen}
        onClose={closeDialog}
        onConfirm={dialogState.onConfirm}
        title={dialogState.title}
        message={dialogState.message}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        variant={dialogState.variant}
        alertOnly={dialogState.alertOnly}
      />
    </div>
  );
}

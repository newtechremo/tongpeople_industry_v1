import { useState } from 'react';
import { Calendar, Clock, Users, AlertTriangle, Search, Download, CheckCircle2 } from 'lucide-react';

// 임시 데이터
const mockAttendanceData = [
  {
    id: 1,
    workDate: '2024-12-22',
    workerName: '홍길동',
    partnerName: '(주)정이앤지',
    siteName: '경희대학교 학생회관',
    birthDate: '1960-05-15',
    age: 64,
    isSenior: false,
    checkInTime: '08:30',
    checkOutTime: '17:30',
    isAutoOut: true,
    role: '근로자',
  },
  {
    id: 2,
    workDate: '2024-12-22',
    workerName: '김철수',
    partnerName: '한국건설(주)',
    siteName: '경희대학교 학생회관',
    birthDate: '1958-03-20',
    age: 66,
    isSenior: true,
    checkInTime: '08:15',
    checkOutTime: '17:15',
    isAutoOut: true,
    role: '근로자',
  },
  {
    id: 3,
    workDate: '2024-12-22',
    workerName: '박영희',
    partnerName: '대한전기',
    siteName: '경희대학교 학생회관',
    birthDate: '1975-11-08',
    age: 49,
    isSenior: false,
    checkInTime: '09:00',
    checkOutTime: null,
    isAutoOut: false,
    role: '근로자',
  },
  {
    id: 4,
    workDate: '2024-12-22',
    workerName: '이민수',
    partnerName: '(주)삼우설비',
    siteName: '경희대학교 학생회관',
    birthDate: '1955-07-22',
    age: 69,
    isSenior: true,
    checkInTime: '08:45',
    checkOutTime: null,
    isAutoOut: false,
    role: '근로자',
  },
  {
    id: 5,
    workDate: '2024-12-22',
    workerName: '최준호',
    partnerName: '(주)정이앤지',
    siteName: '경희대학교 학생회관',
    birthDate: '1980-02-14',
    age: 44,
    isSenior: false,
    checkInTime: '07:55',
    checkOutTime: '16:55',
    isAutoOut: false,
    role: '근로자',
  },
];

const sites = [
  { id: 1, name: '경희대학교 학생회관' },
  { id: 2, name: '삼성전자 평택캠퍼스' },
  { id: 3, name: '현대건설 본사' },
];

const partners = [
  { id: 1, name: '(주)정이앤지' },
  { id: 2, name: '한국건설(주)' },
  { id: 3, name: '대한전기' },
  { id: 4, name: '(주)삼우설비' },
];

export default function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSite, setSelectedSite] = useState<number | ''>('');
  const [selectedPartner, setSelectedPartner] = useState<number | ''>('');
  const [searchTerm, setSearchTerm] = useState('');

  // 필터링된 데이터
  const filteredData = mockAttendanceData.filter((record) => {
    if (selectedPartner && record.partnerName !== partners.find(p => p.id === selectedPartner)?.name) {
      return false;
    }
    if (searchTerm && !record.workerName.includes(searchTerm)) {
      return false;
    }
    return true;
  });

  // 통계 계산
  const stats = {
    total: filteredData.length,
    checkedIn: filteredData.filter(r => r.checkInTime).length,
    checkedOut: filteredData.filter(r => r.checkOutTime).length,
    working: filteredData.filter(r => r.checkInTime && !r.checkOutTime).length,
    senior: filteredData.filter(r => r.isSenior).length,
  };

  const handleManualCheckout = (id: number, workerName: string) => {
    if (confirm(`${workerName}님을 수동 퇴근 처리하시겠습니까?`)) {
      alert(`${workerName}님이 퇴근 처리되었습니다.`);
    }
  };

  const handleExport = () => {
    alert('출퇴근 기록을 엑셀로 다운로드합니다.');
  };

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800">출퇴근 관리</h1>
          <p className="text-sm text-slate-500 mt-1">현장 근로자의 출퇴근 현황을 관리합니다</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-gray-50 transition-colors"
        >
          <Download size={18} />
          엑셀 다운로드
        </button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <Users size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">총 출근</p>
              <p className="text-2xl font-black text-slate-800">{stats.checkedIn}명</p>
            </div>
          </div>
        </div>
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
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
              <Clock size={24} className="text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">근무 중</p>
              <p className="text-2xl font-black text-slate-800">{stats.working}명</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
              <AlertTriangle size={24} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">고령자</p>
              <p className="text-2xl font-black text-slate-800">{stats.senior}명</p>
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
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* 현장 선택 */}
          <select
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value ? Number(e.target.value) : '')}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="">전체 현장</option>
            {sites.map((site) => (
              <option key={site.id} value={site.id}>{site.name}</option>
            ))}
          </select>

          {/* 협력업체 선택 */}
          <select
            value={selectedPartner}
            onChange={(e) => setSelectedPartner(e.target.value ? Number(e.target.value) : '')}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="">전체 협력업체</option>
            {partners.map((partner) => (
              <option key={partner.id} value={partner.id}>{partner.name}</option>
            ))}
          </select>

          {/* 검색 */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="근로자명 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                  근로자
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                  협력업체
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                  나이
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                  출근
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                  퇴근
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                  액션
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredData.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
                        {record.workerName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{record.workerName}</p>
                        <p className="text-xs text-slate-400">{record.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">{record.partnerName}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-600">{record.age}세</span>
                      {record.isSenior && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                          고령
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-slate-800">{record.checkInTime || '-'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-800">
                        {record.checkOutTime || '-'}
                      </span>
                      {record.isAutoOut && record.checkOutTime && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                          자동
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {record.checkOutTime ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                        퇴근완료
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">
                        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                        근무중
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {!record.checkOutTime && (
                      <button
                        onClick={() => handleManualCheckout(record.id, record.workerName)}
                        className="px-3 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-700 transition-colors"
                      >
                        수동 퇴근
                      </button>
                    )}
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
    </div>
  );
}

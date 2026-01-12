import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, Building2, Check, Settings, LogOut } from 'lucide-react';
import { useSites } from '@/context/SitesContext';
import { useAuth } from '@/context/AuthContext';
import WorkerDetailModal from '@/components/workers/WorkerDetailModal';
import type { Worker } from '@tong-pass/shared';

export default function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { sites, selectedSite, setSelectedSite } = useSites();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 로그아웃 처리
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // 현재 사용자를 Worker 형태로 변환 (본인 계정 설정용)
  const currentUserAsWorker: Worker | null = user ? {
    id: user.id,
    name: user.name,
    phone: user.phone,
    role: user.role,
    teamId: user.partnerId ? String(user.partnerId) : undefined,
    teamName: '관리자',
    birthDate: '1980-01-01', // 실제 데이터 연동 시 수정
    age: 45,
    position: '관리자',
    nationality: '대한민국',
    status: 'ACTIVE',
    isSenior: false,
    registeredAt: new Date().toISOString().split('T')[0],
  } : null;

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSite = (site: typeof selectedSite) => {
    setSelectedSite(site);
    setIsDropdownOpen(false);
  };

  return (
    <header className="bg-white h-16 shrink-0 z-[50] px-6 flex items-center justify-between shadow-sm border-b border-gray-200">
      {/* Left: Company & Site Selector */}
      <div className="flex items-center gap-4">
        {/* Company Name - 로고와 동일한 스타일 */}
        <span className="text-xl font-black text-orange-600">(주)통하는사람들</span>

        {/* Site Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg border transition-all ${
              isDropdownOpen
                ? 'border-orange-400 ring-2 ring-orange-100'
                : 'border-gray-200 hover:border-orange-400'
            }`}
          >
            <Building2 size={18} className="text-slate-500" />
            <span className="text-sm font-bold text-slate-700">
              {selectedSite?.name || '현장을 선택하세요'}
            </span>
            <ChevronDown
              size={16}
              className={`text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-[100]">
              <div className="p-2 border-b border-gray-100 bg-gray-50">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2">
                  현장 선택
                </p>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {sites.length > 0 ? (
                  sites.map((site) => (
                    <button
                      key={site.id}
                      onClick={() => handleSelectSite(site)}
                      className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-orange-50 transition-colors ${
                        selectedSite?.id === site.id ? 'bg-orange-50' : ''
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${
                        selectedSite?.id === site.id ? 'bg-orange-100' : 'bg-gray-100'
                      }`}>
                        <Building2
                          size={16}
                          className={selectedSite?.id === site.id ? 'text-orange-600' : 'text-slate-400'}
                        />
                      </div>
                      <div className="flex-1 text-left">
                        <p className={`text-sm font-bold ${
                          selectedSite?.id === site.id ? 'text-orange-600' : 'text-slate-700'
                        }`}>
                          {site.name}
                        </p>
                        {site.address && (
                          <p className="text-xs text-slate-400 truncate">{site.address}</p>
                        )}
                      </div>
                      {selectedSite?.id === site.id && (
                        <Check size={16} className="text-orange-600" />
                      )}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-6 text-center text-slate-400 text-sm">
                    등록된 현장이 없습니다
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell size={20} className="text-slate-500" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full" />
        </button>

        {/* User */}
        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {user?.name?.charAt(0) || '관'}
            </span>
          </div>
          <span className="hidden sm:block text-sm font-bold text-slate-700">
            {user?.name || '관리자'}
          </span>

          {/* 내 계정 설정 버튼 */}
          <button
            onClick={() => setShowProfileModal(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="내 계정 설정"
          >
            <Settings size={18} className="text-slate-500" />
          </button>

          {/* 로그아웃 버튼 */}
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
            title="로그아웃"
          >
            <LogOut size={18} className="text-slate-500 hover:text-red-500" />
          </button>
        </div>
      </div>

      {/* 내 계정 설정 모달 */}
      {showProfileModal && currentUserAsWorker && (
        <WorkerDetailModal
          worker={currentUserAsWorker}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </header>
  );
}

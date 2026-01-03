import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Crown, Building2, ChevronRight, Check, ArrowLeft, ExternalLink } from 'lucide-react';

interface AdminAddModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Mock 근로자 데이터 (검색용)
interface SearchableWorker {
  id: string;
  name: string;
  phone: string;
  birthDate: string;
  team: string;
  site: string;
}

const mockWorkers: SearchableWorker[] = [
  { id: 'w1', name: '김철수', phone: '010-1234-5678', birthDate: '1985-03-15', team: '철골팀', site: '서울본사' },
  { id: 'w2', name: '이영희', phone: '010-2345-6789', birthDate: '1990-07-22', team: '전기팀', site: '부산공장' },
  { id: 'w3', name: '박민수', phone: '010-3456-7890', birthDate: '1978-11-08', team: '도장팀', site: '서울본사' },
  { id: 'w4', name: '정수진', phone: '010-4567-8901', birthDate: '1992-01-30', team: '용접팀', site: '대구물류센터' },
  { id: 'w5', name: '최동훈', phone: '010-5678-9012', birthDate: '1983-06-17', team: '안전팀', site: '인천항만' },
];

// Mock 현장 목록
const mockSites = ['서울본사', '부산공장', '대구물류센터', '인천항만', '광주지사'];

type Step = 'search' | 'role';
type AdminRole = 'SUPER_ADMIN' | 'SITE_ADMIN';

export default function AdminAddModal({ isOpen, onClose }: AdminAddModalProps) {
  const [step, setStep] = useState<Step>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorker, setSelectedWorker] = useState<SearchableWorker | null>(null);
  const [selectedRole, setSelectedRole] = useState<AdminRole>('SITE_ADMIN');
  const [selectedSites, setSelectedSites] = useState<string[]>([]);

  // 검색 결과 필터링
  const searchResults = searchQuery.length >= 2
    ? mockWorkers.filter(worker => {
        const query = searchQuery.toLowerCase();
        const lastFourDigits = worker.phone.slice(-4);
        return (
          worker.name.toLowerCase().includes(query) ||
          lastFourDigits.includes(query)
        );
      })
    : [];

  const handleClose = useCallback(() => {
    setStep('search');
    setSearchQuery('');
    setSelectedWorker(null);
    setSelectedRole('SITE_ADMIN');
    setSelectedSites([]);
    onClose();
  }, [onClose]);

  const handleSelectWorker = (worker: SearchableWorker) => {
    setSelectedWorker(worker);
    setStep('role');
  };

  const handleBack = () => {
    setStep('search');
    setSelectedRole('SITE_ADMIN');
    setSelectedSites([]);
  };

  const handleToggleSite = (site: string) => {
    setSelectedSites(prev =>
      prev.includes(site)
        ? prev.filter(s => s !== site)
        : [...prev, site]
    );
  };

  const handleSubmit = () => {
    if (!selectedWorker) return;

    if (selectedRole === 'SITE_ADMIN' && selectedSites.length === 0) {
      alert('담당 현장을 1개 이상 선택해주세요.');
      return;
    }

    const roleText = selectedRole === 'SUPER_ADMIN' ? '최고 관리자' : '현장 관리자';
    const sitesText = selectedRole === 'SITE_ADMIN' ? ` (담당: ${selectedSites.join(', ')})` : '';

    alert(`${selectedWorker.name}님을 ${roleText}${sitesText}로 임명했습니다.`);
    handleClose();
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-500 to-orange-600">
          <div className="flex items-center gap-3">
            {step === 'role' && (
              <button
                onClick={handleBack}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <div>
              <h2 className="text-lg font-bold text-white">관리자 추가</h2>
              <p className="text-xs text-white/80">
                {step === 'search' ? 'Step 1. 근로자 검색' : 'Step 2. 권한 설정'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {step === 'search' ? (
            <div className="space-y-4">
              {/* Search Input */}
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="이름 또는 연락처 뒷자리 4자리로 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200
                             focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              {/* Search Results */}
              {searchQuery.length >= 2 ? (
                searchResults.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500">{searchResults.length}명의 근로자를 찾았습니다</p>
                    {searchResults.map((worker) => (
                      <button
                        key={worker.id}
                        onClick={() => handleSelectWorker(worker)}
                        className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl
                                   hover:bg-orange-50 hover:border-orange-200 border border-transparent
                                   transition-all group text-left"
                      >
                        <div className="space-y-1">
                          <p className="font-bold text-slate-800">{worker.name}</p>
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span>{worker.phone}</span>
                            <span>•</span>
                            <span>{worker.birthDate}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Building2 size={12} />
                            <span>{worker.site}</span>
                            <span>·</span>
                            <span>{worker.team}</span>
                          </div>
                        </div>
                        <ChevronRight
                          size={20}
                          className="text-slate-300 group-hover:text-orange-500 transition-colors"
                        />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-slate-400 mb-2">검색 결과가 없습니다</p>
                    <p className="text-xs text-slate-400">다른 검색어로 시도해보세요</p>
                  </div>
                )
              ) : (
                <div className="py-8 text-center">
                  <p className="text-slate-400">2글자 이상 입력하면 검색됩니다</p>
                </div>
              )}

              {/* Worker Registration Link */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-slate-500 text-center">
                  찾는 근로자가 없나요?{' '}
                  <a
                    href="/workers"
                    className="inline-flex items-center gap-1 text-orange-600 font-bold hover:underline"
                  >
                    근로자 등록 바로가기
                    <ExternalLink size={12} />
                  </a>
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Selected Worker Info */}
              {selectedWorker && (
                <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                  <p className="text-sm text-orange-600 mb-1">선택된 근로자</p>
                  <p className="font-bold text-slate-800 text-lg">{selectedWorker.name}</p>
                  <p className="text-sm text-slate-500">{selectedWorker.phone}</p>
                </div>
              )}

              {/* Role Selection */}
              <div className="space-y-3">
                <p className="text-sm font-bold text-slate-700">권한 선택</p>

                {/* SUPER_ADMIN */}
                <label
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all
                    ${selectedRole === 'SUPER_ADMIN'
                      ? 'border-yellow-400 bg-yellow-50'
                      : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <input
                    type="radio"
                    name="role"
                    checked={selectedRole === 'SUPER_ADMIN'}
                    onChange={() => setSelectedRole('SUPER_ADMIN')}
                    className="mt-1 accent-yellow-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Crown size={18} className="text-yellow-500" />
                      <span className="font-bold text-slate-800">최고 관리자 (본사)</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      모든 현장 조회, 관리자 추가/삭제, 결제 정보 관리
                    </p>
                  </div>
                </label>

                {/* SITE_ADMIN */}
                <label
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all
                    ${selectedRole === 'SITE_ADMIN'
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <input
                    type="radio"
                    name="role"
                    checked={selectedRole === 'SITE_ADMIN'}
                    onChange={() => setSelectedRole('SITE_ADMIN')}
                    className="mt-1 accent-blue-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Building2 size={18} className="text-blue-500" />
                      <span className="font-bold text-slate-800">현장 관리자 (소장)</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      담당 현장의 데이터 조회 및 근로자 관리
                    </p>
                  </div>
                </label>
              </div>

              {/* Site Selection (for SITE_ADMIN) */}
              {selectedRole === 'SITE_ADMIN' && (
                <div className="space-y-3">
                  <p className="text-sm font-bold text-slate-700">
                    담당 현장 선택 <span className="text-red-500">*</span>
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {mockSites.map((site) => (
                      <button
                        key={site}
                        type="button"
                        onClick={() => handleToggleSite(site)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-all
                          ${selectedSites.includes(site)
                            ? 'border-blue-400 bg-blue-50 text-blue-700'
                            : 'border-gray-200 text-slate-600 hover:border-gray-300'}`}
                      >
                        {selectedSites.includes(site) && <Check size={14} />}
                        <Building2 size={14} />
                        {site}
                      </button>
                    ))}
                  </div>
                  {selectedSites.length === 0 && (
                    <p className="text-xs text-red-500">담당 현장을 1개 이상 선택해주세요</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer (only on Step 2) */}
        {step === 'role' && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
            <button
              onClick={handleClose}
              className="px-5 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-gray-200 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={selectedRole === 'SITE_ADMIN' && selectedSites.length === 0}
              className="px-5 py-2.5 rounded-xl font-bold text-white
                         bg-gradient-to-r from-orange-500 to-orange-600
                         hover:from-orange-600 hover:to-orange-700
                         disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed
                         transition-all"
            >
              관리자 임명
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

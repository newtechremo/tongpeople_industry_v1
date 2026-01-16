import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Users, Check, Building2, Handshake, Eye } from 'lucide-react';

interface Team {
  id: number;
  siteId: number;
  siteName: string;
  companyName: string;
  teamName: string;
  displayName: string;
  isPartner: boolean;
  workerCount: number;
}

interface TeamEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: Team | null;
  onUpdate: (teamId: number, updates: {
    isPartner: boolean;
    companyName: string;
    teamName: string;
    displayName: string;
  }) => void;
}

export default function TeamEditModal({ isOpen, onClose, team, onUpdate }: TeamEditModalProps) {
  const [isPartner, setIsPartner] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [teamName, setTeamName] = useState('');

  // 모달 열릴 때 팀 정보 초기화
  useEffect(() => {
    if (isOpen && team) {
      setIsPartner(team.isPartner);
      setCompanyName(team.companyName);
      setTeamName(team.teamName);
    }
  }, [isOpen, team]);

  // 미리보기 텍스트 생성
  const getPreviewText = () => {
    if (!companyName.trim()) return null;

    const teamPart = teamName.trim() ? ` (${teamName.trim()})` : '';
    if (isPartner) {
      return `[협력사] ${companyName.trim()}${teamPart}`;
    }
    return `${companyName.trim()}${teamPart}`;
  };

  const handleSubmit = () => {
    if (!team) return;

    if (!companyName.trim()) {
      alert('업체명을 입력해주세요.');
      return;
    }

    const displayName = getPreviewText() || companyName.trim();

    onUpdate(team.id, {
      isPartner,
      companyName: companyName.trim(),
      teamName: teamName.trim(),
      displayName,
    });
    onClose();
  };

  if (!isOpen || !team) return null;

  const previewText = getPreviewText();

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-500 to-orange-600">
          <div className="flex items-center gap-3">
            <Users size={20} className="text-white" />
            <h2 className="text-lg font-bold text-white">팀(업체) 수정</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* 소속 현장 (읽기 전용) */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <Building2 size={16} className="text-slate-400" />
              소속 현장
            </label>
            <div className="px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium text-slate-600">
              {team.siteName}
            </div>
          </div>

          {/* 협력업체 여부 */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <Handshake size={16} className="text-slate-400" />
              구분
            </label>
            <label
              className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                isPartner
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="checkbox"
                checked={isPartner}
                onChange={(e) => setIsPartner(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <p className="font-bold text-slate-800">외부 협력업체입니다</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  체크 시 리스트에 [협력사] 태그가 표시됩니다
                </p>
              </div>
            </label>
          </div>

          {/* 업체명 */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">
              업체명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="예: (주)대한전기, XX건설, 관리팀"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-orange-100 hover:border-orange-400"
              autoFocus
            />
          </div>

          {/* 팀명 */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">
              세부 팀명 <span className="text-slate-400 font-normal">(선택)</span>
            </label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="예: 전기1팀, 미장팀, 설비팀"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-orange-100 hover:border-orange-400"
            />
          </div>

          {/* 미리보기 */}
          {previewText && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
              <div className="flex items-center gap-2 text-sm text-orange-700 mb-2">
                <Eye size={14} />
                <span className="font-bold">미리보기</span>
              </div>
              <p className="text-sm text-slate-700">
                리스트에 <span className="font-bold text-orange-600">"{previewText}"</span> 으로 표시됩니다.
              </p>
            </div>
          )}

          {/* 근로자 수 안내 */}
          {team.workerCount > 0 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                이 팀에 소속된 근로자 <span className="font-bold">{team.workerCount}명</span>의 팀 정보가 함께 변경됩니다.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-gray-200 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!teamName.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white
                       bg-gradient-to-r from-orange-500 to-orange-600
                       hover:from-orange-600 hover:to-orange-700
                       disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed
                       transition-all"
          >
            <Check size={16} />
            수정하기
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

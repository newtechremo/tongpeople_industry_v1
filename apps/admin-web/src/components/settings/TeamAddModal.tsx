import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Building2, Users, Check, Eye, Handshake } from 'lucide-react';
import type { Site } from '@tong-pass/shared';

interface TeamAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  sites: Site[];
  onAdd: (team: {
    siteId: number;
    companyName: string;
    teamName: string;
    isPartner: boolean;
    displayName: string;
  }) => void;
}

export default function TeamAddModal({ isOpen, onClose, sites, onAdd }: TeamAddModalProps) {
  const [selectedSiteId, setSelectedSiteId] = useState<number | null>(null);
  const [isPartner, setIsPartner] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [teamName, setTeamName] = useState('');

  // 현장이 1개면 자동 선택
  useEffect(() => {
    if (sites.length === 1) {
      setSelectedSiteId(sites[0].id);
    }
  }, [sites]);

  // 모달 열릴 때 초기화
  useEffect(() => {
    if (isOpen) {
      if (sites.length === 1) {
        setSelectedSiteId(sites[0].id);
      } else {
        setSelectedSiteId(null);
      }
      setIsPartner(false);
      setCompanyName('');
      setTeamName('');
    }
  }, [isOpen, sites]);

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
    if (!selectedSiteId) {
      alert('소속 현장을 선택해주세요.');
      return;
    }
    if (!companyName.trim()) {
      alert('업체명을 입력해주세요.');
      return;
    }

    const displayName = getPreviewText() || companyName.trim();

    onAdd({
      siteId: selectedSiteId,
      companyName: companyName.trim(),
      teamName: teamName.trim(),
      isPartner,
      displayName,
    });

    onClose();
  };

  if (!isOpen) return null;

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
            <h2 className="text-lg font-bold text-white">팀(업체) 추가</h2>
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
          {/* 소속 현장 선택 */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <Building2 size={16} className="text-slate-400" />
              소속 현장 <span className="text-red-500">*</span>
            </label>
            {sites.length === 1 ? (
              <div className="px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium text-slate-600">
                {sites[0].name}
                <span className="ml-2 text-xs text-slate-400">(자동 선택)</span>
              </div>
            ) : (
              <select
                value={selectedSiteId || ''}
                onChange={(e) => setSelectedSiteId(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-orange-100 hover:border-orange-400"
              >
                <option value="">현장을 선택해주세요</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            )}
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
              placeholder="예: (주)대한전기, XX건설"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-orange-100 hover:border-orange-400"
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
            disabled={!selectedSiteId || !companyName.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white
                       bg-gradient-to-r from-orange-500 to-orange-600
                       hover:from-orange-600 hover:to-orange-700
                       disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed
                       transition-all"
          >
            <Check size={16} />
            추가하기
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

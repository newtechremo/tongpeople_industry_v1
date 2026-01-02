import { useState } from 'react';
import { Plus, Edit2, Trash2, Briefcase, Users } from 'lucide-react';
import type { Partner } from '@tong-pass/shared';

// 임시 데이터
const initialPartners: (Partner & { workerCount: number })[] = [
  { id: 1, name: '(주)정이앤지', workerCount: 45 },
  { id: 2, name: '한국건설(주)', workerCount: 32 },
  { id: 3, name: '대한전기', workerCount: 28 },
  { id: 4, name: '(주)삼우설비', workerCount: 23 },
];

export default function PartnerManagement() {
  const [partners, setPartners] = useState(initialPartners);
  const [isAdding, setIsAdding] = useState(false);
  const [newPartnerName, setNewPartnerName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  const handleAddPartner = () => {
    if (!newPartnerName.trim()) {
      alert('협력업체명을 입력해주세요.');
      return;
    }
    const partner = {
      id: Date.now(),
      name: newPartnerName,
      workerCount: 0,
    };
    setPartners([...partners, partner]);
    setNewPartnerName('');
    setIsAdding(false);
  };

  const handleDeletePartner = (id: number) => {
    const partner = partners.find((p) => p.id === id);
    if (partner && partner.workerCount > 0) {
      alert(`해당 업체에 ${partner.workerCount}명의 근로자가 등록되어 있습니다.\n먼저 근로자를 다른 업체로 이동해주세요.`);
      return;
    }
    if (confirm('정말 삭제하시겠습니까?')) {
      setPartners(partners.filter((p) => p.id !== id));
    }
  };

  const handleUpdatePartner = (id: number, name: string) => {
    setPartners(partners.map((p) => (p.id === id ? { ...p, name } : p)));
    setEditingId(null);
  };

  const totalWorkers = partners.reduce((sum, p) => sum + p.workerCount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">협력업체 관리</h2>
          <p className="text-sm text-slate-500 mt-1">
            등록된 협력업체: {partners.length}개 / 총 근로자: {totalWorkers}명
          </p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-white
                     bg-gradient-to-r from-orange-500 to-orange-600
                     hover:from-orange-600 hover:to-orange-700
                     shadow-sm transition-all"
        >
          <Plus size={18} />
          업체 추가
        </button>
      </div>

      {/* 업체 추가 폼 */}
      {isAdding && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl space-y-4">
          <h3 className="font-bold text-slate-800">새 협력업체 추가</h3>
          <div className="flex gap-4">
            <input
              type="text"
              value={newPartnerName}
              onChange={(e) => setNewPartnerName(e.target.value)}
              placeholder="예: (주)한국건설"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-orange-100"
            />
            <button
              onClick={handleAddPartner}
              className="px-4 py-2 rounded-lg font-bold text-white bg-orange-500 hover:bg-orange-600"
            >
              추가
            </button>
            <button
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 rounded-lg font-bold text-slate-600 bg-gray-200 hover:bg-gray-300"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* 업체 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {partners.map((partner) => (
          <div
            key={partner.id}
            className="p-4 bg-white border border-gray-200 rounded-xl hover:border-orange-300 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <Briefcase size={20} className="text-orange-500" />
                </div>
                {editingId === partner.id ? (
                  <input
                    type="text"
                    defaultValue={partner.name}
                    onBlur={(e) => handleUpdatePartner(partner.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleUpdatePartner(partner.id, e.currentTarget.value);
                      }
                    }}
                    className="px-2 py-1 border border-orange-300 rounded text-sm font-bold"
                    autoFocus
                  />
                ) : (
                  <span className="font-bold text-slate-700">{partner.name}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingId(partner.id)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Edit2 size={16} className="text-slate-500" />
                </button>
                <button
                  onClick={() => handleDeletePartner(partner.id)}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} className="text-red-500" />
                </button>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
              <Users size={14} />
              <span>등록 근로자 <strong className="text-slate-700">{partner.workerCount}명</strong></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

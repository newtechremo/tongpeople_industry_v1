/**
 * 위험요인 선택 컴포넌트
 *
 * 체크박스 방식으로 여러 위험요인 선택
 */

import { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import type { MockRiskFactor } from '@/mocks/risk-assessment';

interface Props {
  availableFactors: MockRiskFactor[];
  selectedFactorIds: string[];
  onAdd: (factorIds: string[]) => void;
  disabled?: boolean;
}

export default function RiskFactorSelector({
  availableFactors,
  selectedFactorIds,
  onAdd,
  disabled = false,
}: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [tempSelected, setTempSelected] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 이미 선택된 항목 제외
  const unselectedFactors = availableFactors.filter(
    factor => !selectedFactorIds.includes(factor.id)
  );

  // 검색 필터링
  const filteredFactors = unselectedFactors.filter(factor =>
    factor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    factor.accident_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggle = (factorId: string) => {
    setTempSelected(prev =>
      prev.includes(factorId)
        ? prev.filter(id => id !== factorId)
        : [...prev, factorId]
    );
  };

  const handleAdd = () => {
    if (tempSelected.length > 0) {
      onAdd(tempSelected);
      setTempSelected([]);
      setSearchQuery('');
      setIsModalOpen(false);
    }
  };

  const handleCancel = () => {
    setTempSelected([]);
    setSearchQuery('');
    setIsModalOpen(false);
  };

  if (disabled) {
    return (
      <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
        <p className="text-slate-400">작업 분류를 먼저 선택해주세요</p>
      </div>
    );
  }

  if (unselectedFactors.length === 0) {
    return (
      <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
        <p className="text-slate-400">선택 가능한 위험요인이 없습니다</p>
      </div>
    );
  }

  return (
    <>
      {/* Add Button */}
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="w-full px-5 py-3 rounded-xl font-bold text-orange-600 bg-orange-50 border-2 border-orange-200 hover:bg-orange-100 transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        위험요인 추가
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-3xl max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-slate-800">위험요인 선택</h3>
              <button
                type="button"
                onClick={handleCancel}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {/* Search */}
            <div className="mb-4">
              <div className="flex items-center px-4 py-3 rounded-xl border-2 border-gray-200">
                <Search className="w-5 h-5 text-slate-400 mr-2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="위험요인 또는 재해형태로 검색..."
                  className="flex-1 bg-transparent focus:outline-none"
                  autoFocus
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto border-2 border-gray-200 rounded-xl mb-6">
              {filteredFactors.length > 0 ? (
                <div className="divide-y">
                  {filteredFactors.map((factor) => (
                    <label
                      key={factor.id}
                      className="flex items-start gap-3 p-4 hover:bg-orange-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={tempSelected.includes(factor.id)}
                        onChange={() => handleToggle(factor.id)}
                        className="mt-1 w-5 h-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                      />
                      <div className="flex-1">
                        <div className="font-bold text-slate-800">{factor.name}</div>
                        <div className="text-sm text-slate-500 mt-1">
                          재해형태: <span className="text-orange-600 font-medium">{factor.accident_type}</span>
                        </div>
                        {factor.description && (
                          <div className="text-xs text-slate-400 mt-1">{factor.description}</div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-slate-400">
                  검색 결과가 없습니다
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">
                {tempSelected.length}개 선택됨
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-white border-2 border-slate-200 hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={tempSelected.length === 0}
                  className="px-5 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  추가 ({tempSelected.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

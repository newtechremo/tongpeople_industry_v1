/**
 * 위험요인 선택 컴포넌트
 *
 * 체크박스 방식으로 여러 위험요인을 선택
 */

import { useState, useEffect } from 'react';
import { Search, Plus, Loader2 } from 'lucide-react';
import type { MockRiskFactor } from '@/mocks/risk-assessment';
import { getAIRecommendations, type AIRecommendation } from '@/mocks/ai-recommendations';

interface Props {
  availableFactors: MockRiskFactor[];
  selectedFactorIds: string[];
  onAdd: (factorIds: string[]) => void;
  disabled?: boolean;
  categoryId?: number;      // AI 추천용
  subcategoryId?: number;   // AI 추천용
}

export default function RiskFactorSelector({
  availableFactors,
  selectedFactorIds,
  onAdd,
  disabled = false,
  categoryId,
  subcategoryId,
}: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [tempSelected, setTempSelected] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  const itemsPerPage = 20;

  // AI 추천 로드 (모달 열릴 때)
  useEffect(() => {
    if (isModalOpen && categoryId && subcategoryId) {
      loadMockAIRecommendations();
    }
  }, [isModalOpen, categoryId, subcategoryId]);

  const loadMockAIRecommendations = () => {
    setIsLoadingAI(true);

    // Mock 데이터 로딩 시뮬레이션 (500ms 지연)
    setTimeout(() => {
      const recommendations = getAIRecommendations(categoryId!, subcategoryId!, 10);
      setAiRecommendations(recommendations);
      setIsLoadingAI(false);
    }, 500);
  };

  const unselectedFactors = availableFactors.filter(
    factor => !selectedFactorIds.includes(factor.id)
  );

  const filteredFactors = unselectedFactors.filter(factor =>
    factor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    factor.accident_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 페이지네이션
  const totalPages = Math.ceil(filteredFactors.length / itemsPerPage);
  const paginatedFactors = filteredFactors.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
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
      setCurrentPage(1);
      setIsModalOpen(false);
    }
  };

  const handleCancel = () => {
    setTempSelected([]);
    setSearchQuery('');
    setCurrentPage(1);
    setIsModalOpen(false);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // 검색 시 첫 페이지로
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
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
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="w-full px-5 py-3 rounded-xl font-bold text-orange-600 bg-orange-50 border-2 border-orange-200 hover:bg-orange-100 transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        위험요인 추가
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-3xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-slate-800">위험요인 선택</h3>
              <button
                type="button"
                onClick={handleCancel}
                className="text-slate-400 hover:text-slate-600"
              >
                닫기
              </button>
            </div>

            <div className="mb-4">
              <div className="flex items-center px-4 py-3 rounded-xl border-2 border-gray-200">
                <Search className="w-5 h-5 text-slate-400 mr-2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="위험요인 또는 사고 유형으로 검색..."
                  className="flex-1 bg-transparent focus:outline-none"
                  autoFocus
                />
              </div>
            </div>

            {/* AI 추천 섹션 */}
            {aiRecommendations.length > 0 && !searchQuery && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="text-sm font-bold text-orange-600">🤖 AI 추천 위험요인</h4>
                  {isLoadingAI && <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />}
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto border-2 border-orange-200 rounded-xl p-2 bg-orange-50/30">
                  {aiRecommendations.map((rec, index) => (
                    <label
                      key={rec.id}
                      className="flex items-start gap-3 p-3 bg-gradient-to-r from-orange-50 to-orange-100 border-2 border-orange-200 rounded-lg hover:border-orange-300 cursor-pointer transition-all"
                    >
                      <input
                        type="checkbox"
                        checked={tempSelected.includes(String(rec.id))}
                        onChange={() => handleToggle(String(rec.id))}
                        className="mt-1 w-5 h-5 rounded border-orange-300 text-orange-500 focus:ring-orange-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded">
                            AI 추천 #{index + 1}
                          </span>
                          <span className="text-xs text-orange-700 font-medium">
                            {rec.score}점
                          </span>
                        </div>
                        <div className="font-bold text-slate-800 text-sm">{rec.riskFactor}</div>
                        <div className="text-xs text-slate-500 mt-1">
                          사고 유형: <span className="text-orange-600 font-medium">{rec.accidentType}</span>
                        </div>
                        <div className="text-xs text-slate-600 mt-1 bg-white/50 rounded px-2 py-1">
                          📊 {rec.reason}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="mt-2 border-t-2 border-gray-200"></div>
              </div>
            )}

            {/* 로딩 상태 */}
            {isLoadingAI && !aiRecommendations.length && (
              <div className="mb-4 p-8 text-center border-2 border-orange-200 rounded-xl bg-orange-50">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-2" />
                <p className="text-sm text-orange-600 font-medium">AI가 추천 위험요인을 분석 중입니다...</p>
              </div>
            )}

            {/* 일반 위험요인 목록 */}
            {aiRecommendations.length > 0 && !searchQuery && (
              <h4 className="text-sm font-bold text-slate-600 mb-3">일반 위험요인</h4>
            )}

            <div className="flex-1 overflow-y-auto border-2 border-gray-200 rounded-xl">
              {paginatedFactors.length > 0 ? (
                <div className="divide-y">
                  {paginatedFactors.map((factor) => (
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
                          사고 유형: <span className="text-orange-600 font-medium">{factor.accident_type}</span>
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

            {/* 페이지네이션 */}
            {filteredFactors.length > 0 && totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 py-3 border-t-2 border-gray-200 mt-4">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg font-medium text-slate-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ◀ 이전
                </button>

                <span className="text-sm text-slate-600">
                  <span className="font-bold text-orange-600">{currentPage}</span> / {totalPages} 페이지
                </span>

                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg font-medium text-slate-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  다음 ▶
                </button>
              </div>
            )}

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

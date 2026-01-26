/**
 * 위험요인 선택 모달
 *
 * 미리 정의된 위험요인 목록에서 선택 또는 직접 입력
 */

import { useState, useEffect } from 'react';
import { X, Search, Loader2 } from 'lucide-react';
import { getAIRecommendations, type AIRecommendation } from '@/mocks/ai-recommendations';

interface RiskFactorOption {
  id: number;
  factor: string;
  improvement: string;
}

interface RiskFactorSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryId: number;
  subcategoryId: number;
  onSelect: (factors: { factor: string; improvement: string }[]) => void;
  initialMode?: 'search' | 'direct';
  isCustomSubcategory?: boolean;
  existingFactors?: string[]; // 이미 추가된 위험요인 목록
}

export default function RiskFactorSelectModal({
  isOpen,
  onClose,
  categoryId,
  subcategoryId,
  onSelect,
  initialMode = 'search',
  isCustomSubcategory = false,
  existingFactors = [],
}: RiskFactorSelectModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [inputMode, setInputMode] = useState<'search' | 'direct'>('search');
  const [directFactor, setDirectFactor] = useState('');
  const [directImprovement, setDirectImprovement] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  const itemsPerPage = 20;

  // 모달이 열릴 때 초기 모드 설정
  useEffect(() => {
    if (isOpen) {
      setInputMode(initialMode);
    }
  }, [isOpen, initialMode]);

  // AI 추천 로딩
  useEffect(() => {
    if (isOpen && categoryId !== undefined && subcategoryId !== undefined && !isCustomSubcategory) {
      loadMockAIRecommendations();
    } else {
      setAiRecommendations([]);
    }
  }, [isOpen, categoryId, subcategoryId, isCustomSubcategory]);

  // AI 추천 로딩 함수 (Mock)
  const loadMockAIRecommendations = () => {
    if (categoryId !== undefined && subcategoryId !== undefined) {
      setIsLoadingAI(true);
      const key = `${categoryId}-${subcategoryId}`;
      console.log('🔍 AI 추천 요청:', { categoryId, subcategoryId, key });

      setTimeout(() => {
        const recommendations = getAIRecommendations(categoryId, subcategoryId);
        console.log('📊 AI 추천 결과:', recommendations.length, '개', recommendations);
        setAiRecommendations(recommendations);
        setIsLoadingAI(false);
      }, 800);
    }
  };

  // Mock 데이터
  const mockFactors: RiskFactorOption[] = [
    {
      id: 1,
      factor: '안전대를 사용하지 않고 고소부위 작업중 추락',
      improvement: '고소부위 작업시 안전대 고리 체결 철저',
    },
    {
      id: 2,
      factor: '작업 발판 미설치로 인한 추락',
      improvement: '안전 작업발판 설치 후 작업 실시',
    },
    {
      id: 3,
      factor: '안전난간 미설치로 인한 추락',
      improvement: '작업 전 안전난간 설치 및 점검',
    },
    {
      id: 4,
      factor: '전선 누전으로 인한 감전',
      improvement: '누전차단기 설치 및 정기 점검',
    },
    {
      id: 5,
      factor: '보호구 미착용으로 인한 부상',
      improvement: '작업 전 보호구 착용 여부 확인',
    },
  ];

  const filteredFactors = mockFactors.filter(f =>
    // 검색 쿼리 필터
    (f.factor.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.improvement.toLowerCase().includes(searchQuery.toLowerCase())) &&
    // 이미 추가된 위험요인 제외
    !existingFactors.includes(f.factor)
  );

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredFactors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedFactors = filteredFactors.slice(startIndex, endIndex);

  // 검색어 변경 시 페이지 초기화
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  if (!isOpen) return null;

  const handleToggle = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSubmit = () => {
    let result: { factor: string; improvement: string }[] = [];

    if (inputMode === 'search') {
      // 검색 모드: AI 추천 + 일반 선택 항목들
      const aiFactors = aiRecommendations
        .filter(ai => selectedIds.includes(ai.id))
        .map(ai => ({ factor: ai.riskFactor, improvement: ai.improvement }));

      const regularFactors = mockFactors
        .filter(f => selectedIds.includes(f.id))
        .map(f => ({ factor: f.factor, improvement: f.improvement }));

      result = [...aiFactors, ...regularFactors];
    } else {
      // 직접 입력 모드: 입력한 항목
      if (directFactor.trim() && directImprovement.trim()) {
        // 중복 체크
        if (existingFactors.includes(directFactor.trim())) {
          alert('이미 추가된 위험요인입니다.');
          return;
        }
        result = [{ factor: directFactor.trim(), improvement: directImprovement.trim() }];
      }
    }

    if (result.length > 0) {
      onSelect(result);
    }

    // 상태 초기화
    setSelectedIds([]);
    setSearchQuery('');
    setInputMode('search');
    setDirectFactor('');
    setDirectImprovement('');
    setCurrentPage(1);
    setAiRecommendations([]);
    onClose();
  };

  const handleClose = () => {
    setSelectedIds([]);
    setSearchQuery('');
    setInputMode('search');
    setDirectFactor('');
    setDirectImprovement('');
    setCurrentPage(1);
    setAiRecommendations([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 오버레이 */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* 모달 콘텐츠 */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 p-6 max-h-[80vh] flex flex-col">
        {/* 닫기 버튼 */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-lg z-10"
        >
          <X size={20} className="text-slate-400" />
        </button>

        {/* 제목 */}
        <h2 className="text-lg font-bold text-slate-800 mb-4">
          위험요인 선택
        </h2>

        {/* 탭 전환 */}
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setInputMode('search')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              inputMode === 'search'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
            }`}
          >
            목록에서 선택
          </button>
          <button
            type="button"
            onClick={() => setInputMode('direct')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              inputMode === 'direct'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
            }`}
          >
            직접 입력
          </button>
        </div>

        {/* 스크롤 가능한 콘텐츠 영역 */}
        <div className="flex-1 overflow-y-auto mb-4">
          {inputMode === 'search' ? (
            <>
              {isCustomSubcategory ? (
                /* 커스텀 소분류는 추천 목록 없음 */
                <div className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <div className="mb-4">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-slate-700 mb-2">
                      해당 소분류에 따른 위험요인 추천이 없습니다
                    </h3>
                    <p className="text-sm text-slate-500 mb-4">
                      직접 추가한 소분류는 위험요인 추천 목록이 제공되지 않습니다.
                    </p>
                    <button
                      type="button"
                      onClick={() => setInputMode('direct')}
                      className="px-6 py-2 rounded-lg font-medium text-white bg-orange-500 hover:bg-orange-600 transition-colors"
                    >
                      직접 입력하기
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* 검색 */}
                  <div className="mb-4">
                    <div className="flex items-center px-4 py-2 border border-gray-300 rounded-lg focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500">
                      <Search size={18} className="text-slate-400 mr-2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="위험요인 검색..."
                        className="flex-1 text-sm bg-transparent focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* AI 추천 섹션 */}
                  {isLoadingAI ? (
                    <div className="flex items-center justify-center py-8 mb-4">
                      <Loader2 className="w-6 h-6 text-orange-500 animate-spin mr-2" />
                      <span className="text-sm text-slate-600">AI 추천 분석 중...</span>
                    </div>
                  ) : aiRecommendations.length > 0 ? (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                            AI 추천 위험요인
                          </h3>
                        </div>
                        <span className="text-xs text-slate-500 bg-orange-50 px-2 py-0.5 rounded-full">
                          {aiRecommendations.length}개 추천
                        </span>
                      </div>
                      <div className="space-y-2">
                        {aiRecommendations.map((ai) => (
                          <label
                            key={ai.id}
                            className="flex items-start gap-3 p-3 rounded-lg border-2 border-orange-100 bg-gradient-to-r from-orange-50 to-white hover:border-orange-300 cursor-pointer transition-all"
                          >
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(ai.id)}
                              onChange={() => handleToggle(ai.id)}
                              className="mt-1 w-5 h-5 rounded border-orange-300 text-orange-500 focus:ring-orange-500"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <div className="text-sm font-bold text-slate-800">
                                  {ai.riskFactor}
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded">
                                    {ai.score}점
                                  </span>
                                </div>
                              </div>
                              <div className="text-xs text-slate-600 mb-1">
                                개선대책: {ai.improvement}
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-slate-500">
                                  재해유형: <span className="font-medium text-slate-700">{ai.accidentType}</span>
                                </span>
                                <span className="text-slate-300">•</span>
                                <span className="text-slate-400 truncate">{ai.reason}</span>
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {/* 일반 위험요인 리스트 */}
                  <div>
                    {aiRecommendations.length > 0 && (
                      <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wide mb-3">
                        일반 위험요인
                      </h3>
                    )}
                    <div className="border border-gray-200 rounded-lg">
                      {paginatedFactors.length > 0 ? (
                        <div className="divide-y divide-gray-200">
                          {paginatedFactors.map((factor) => (
                            <label
                              key={factor.id}
                              className="flex items-start gap-3 p-4 hover:bg-orange-50 cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(factor.id)}
                                onChange={() => handleToggle(factor.id)}
                                className="mt-1 w-5 h-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                              />
                              <div className="flex-1">
                                <div className="text-sm font-medium text-slate-800 mb-1">
                                  {factor.factor}
                                </div>
                                <div className="text-xs text-slate-500">
                                  개선대책: {factor.improvement}
                                </div>
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
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 mt-4">
                        <button
                          type="button"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          이전
                        </button>
                        <span className="text-sm text-slate-600">
                          {currentPage} / {totalPages}
                        </span>
                        <button
                          type="button"
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          다음
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              {/* 직접 입력 폼 */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">
                    위험 요인 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={directFactor}
                    onChange={(e) => setDirectFactor(e.target.value)}
                    placeholder="위험 요인을 입력하세요..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">
                    개선 대책 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={directImprovement}
                    onChange={(e) => setDirectImprovement(e.target.value)}
                    placeholder="개선 대책을 입력하세요..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 resize-none"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* 버튼 */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600">
            {inputMode === 'search'
              ? (isCustomSubcategory ? '' : `${selectedIds.length}개 선택됨`)
              : '위험요인과 개선대책을 모두 입력하세요'
            }
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-3 rounded-xl font-medium text-slate-600 bg-gray-100 hover:bg-gray-200"
            >
              {inputMode === 'search' && isCustomSubcategory ? '닫기' : '취소'}
            </button>
            {/* 커스텀 소분류의 목록 선택 모드에서는 선택 완료 버튼 숨김 */}
            {!(inputMode === 'search' && isCustomSubcategory) && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={
                  inputMode === 'search'
                    ? selectedIds.length === 0
                    : !directFactor.trim() || !directImprovement.trim()
                }
                className="px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {inputMode === 'search'
                  ? `선택 완료 (${selectedIds.length})`
                  : '추가하기'
                }
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

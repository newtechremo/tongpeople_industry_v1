/**
 * 대분류 항목 - 수시 위험성평가
 *
 * 대분류 검색 + 소분류 체크리스트 + 위험요인 카드들 + 소분류별 조치 정보
 */

import { useState } from 'react';
import { X, Plus, Calendar, Users } from 'lucide-react';
import CategorySearchInput from './CategorySearchInput';
import SubcategoryCheckList from './SubcategoryCheckList';
import OccasionalRiskFactorCard from '@/components/risk-assessment/forms/components/OccasionalRiskFactorCard';
import ActionAssigneeSelectModal from '@/components/risk-assessment/modals/ActionAssigneeSelectModal';
import { getUsersByIds } from '@/mocks/users';
import type { RiskMethod, OccasionalRiskFactor } from '@/components/risk-assessment/types/occasional';

interface CategoryItemSubcategory {
  id: number;
  name: string;
  isCustom?: boolean;
  riskFactors: OccasionalRiskFactor[];
  actionDate?: string;
  actionAssigneeIds?: string[];
  actionConfirmerIds?: string[];
  reviewComments?: string[];
}

interface OccasionalCategoryItemProps {
  categoryId: number | null;
  categoryName: string;
  subcategories: CategoryItemSubcategory[];
  riskMethod: RiskMethod;
  onCategoryChange: (categoryId: number, categoryName: string) => void;
  onCategoryClear: () => void;
  onSubcategoryToggle: (subcategoryIds: number[]) => void;
  onAddCustomSubcategory: () => void;
  onAddRiskFactor: (subcategoryId: number) => void;
  onUpdateRiskFactor: (subcategoryId: number, factorId: string, updatedFactor: OccasionalRiskFactor) => void;
  onDeleteRiskFactor: (subcategoryId: number, factorId: string) => void;
  onSearchRiskFactor: (subcategoryId: number) => void;
  onUpdateSubcategory: (subcategoryId: number, updatedSubcategory: CategoryItemSubcategory) => void;
  onDelete: () => void;
  index: number;
  showActionFields?: boolean;
  excludedCategoryIds?: number[]; // 이미 사용된 대분류 ID 목록
  excludedSubcategoryIds?: number[]; // 이미 사용된 소분류 ID 목록
}

export default function OccasionalCategoryItem({
  categoryId,
  categoryName,
  subcategories,
  riskMethod,
  onCategoryChange,
  onCategoryClear,
  excludedCategoryIds = [],
  excludedSubcategoryIds = [],
  onSubcategoryToggle,
  onAddCustomSubcategory,
  onAddRiskFactor,
  onUpdateRiskFactor,
  onDeleteRiskFactor,
  onSearchRiskFactor,
  onUpdateSubcategory,
  onDelete,
  index,
  showActionFields = true,
}: OccasionalCategoryItemProps) {
  const selectedSubcategoryIds = subcategories.map((s) => s.id);
  const customSubcategories = subcategories.filter((s) => s.isCustom);

  // 순환 문자 배열
  const circledNumbers = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];

  // 조치자/확인자 모달 상태
  const [actionModalState, setActionModalState] = useState<{
    subcategoryId: number | null;
    type: 'assignee' | 'confirmer' | null;
  }>({ subcategoryId: null, type: null });

  // 검토내용 입력 상태
  const [reviewCommentInputs, setReviewCommentInputs] = useState<Record<number, string>>({});

  // 소분류 필드 업데이트
  const updateSubcategoryField = <K extends keyof CategoryItemSubcategory>(
    subcategoryId: number,
    key: K,
    value: CategoryItemSubcategory[K]
  ) => {
    const subcategory = subcategories.find((s) => s.id === subcategoryId);
    if (subcategory) {
      onUpdateSubcategory(subcategoryId, { ...subcategory, [key]: value });
    }
  };

  // 검토내용 추가
  const handleAddReviewComment = (subcategoryId: number) => {
    const input = reviewCommentInputs[subcategoryId] || '';
    if (!input.trim()) return;

    const subcategory = subcategories.find((s) => s.id === subcategoryId);
    if (subcategory) {
      const currentComments = subcategory.reviewComments || [];
      onUpdateSubcategory(subcategoryId, {
        ...subcategory,
        reviewComments: [...currentComments, input.trim()],
      });
      setReviewCommentInputs({ ...reviewCommentInputs, [subcategoryId]: '' });
    }
  };

  // 검토내용 삭제
  const handleDeleteReviewComment = (subcategoryId: number, index: number) => {
    const subcategory = subcategories.find((s) => s.id === subcategoryId);
    if (subcategory) {
      const currentComments = subcategory.reviewComments || [];
      onUpdateSubcategory(subcategoryId, {
        ...subcategory,
        reviewComments: currentComments.filter((_, i) => i !== index),
      });
    }
  };

  return (
    <>
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 space-y-4">
        {/* 대분류 헤더 */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-600 mb-2">
              대분류{index + 1}
            </label>
            <CategorySearchInput
              value={categoryName}
              categoryId={categoryId}
              onChange={onCategoryChange}
              onClear={onCategoryClear}
              excludedIds={excludedCategoryIds}
            />
          </div>
          <button
            type="button"
            onClick={onDelete}
            className="mt-6 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
          >
            대분류 삭제
          </button>
        </div>

        {/* 소분류 체크리스트 */}
        {categoryId && (
          <SubcategoryCheckList
            categoryId={categoryId}
            selectedIds={selectedSubcategoryIds}
            customItems={customSubcategories}
            onChange={onSubcategoryToggle}
            onAddCustom={onAddCustomSubcategory}
            excludedIds={excludedSubcategoryIds}
          />
        )}

        {/* 선택된 소분류별 위험요인 + 조치 정보 */}
        {subcategories.map((subcategory, subIndex) => {
          const assignees = getUsersByIds(subcategory.actionAssigneeIds || []);
          const confirmers = getUsersByIds(subcategory.actionConfirmerIds || []);

          return (
            <div key={subcategory.id} className="bg-orange-50/30 rounded-lg p-4 ml-4 space-y-4">
              {/* 소분류 헤더 */}
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-700">
                  소분류{circledNumbers[subIndex] || `${subIndex + 1}`} {subcategory.name}
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    const newIds = selectedSubcategoryIds.filter((id) => id !== subcategory.id);
                    onSubcategoryToggle(newIds);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-gray-100 rounded"
                >
                  <X size={18} />
                </button>
              </div>

              {/* 위험요인 섹션 */}
              {subcategory.riskFactors.length === 0 ? (
                /* Empty State - 위험요인이 없을 때 */
                <div className="p-8 rounded-xl border-2 border-dashed border-orange-300 bg-orange-50/30">
                  <div className="text-center space-y-4">
                    <div className="flex justify-center">
                      <div className="p-4 rounded-full bg-orange-100">
                        <svg
                          className="w-12 h-12 text-orange-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-orange-700 mb-2">
                        위험요인을 추가해주세요
                      </h4>
                      <p className="text-sm text-orange-600">
                        이 소분류에 대한 위험요인을 최소 1개 이상 추가해야 합니다
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onAddRiskFactor(subcategory.id)}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all shadow-md"
                    >
                      <Plus size={20} />
                      위험요인 추가하기
                    </button>
                  </div>
                </div>
              ) : (
                /* 위험요인이 있을 때 */
                <div className="space-y-4">
                  {/* 위험요인 카드들 */}
                  <div className="space-y-4">
                    {subcategory.riskFactors.map((factor, factorIndex) => (
                      <OccasionalRiskFactorCard
                        key={factor.id}
                        index={factorIndex}
                        factor={factor}
                        riskMethod={riskMethod}
                        onChange={(updatedFactor) =>
                          onUpdateRiskFactor(subcategory.id, factor.id, updatedFactor)
                        }
                        onRemove={() => onDeleteRiskFactor(subcategory.id, factor.id)}
                      />
                    ))}
                  </div>

                  {/* 추가 버튼 */}
                  <button
                    type="button"
                    onClick={() => onAddRiskFactor(subcategory.id)}
                    className="w-full py-3 border-2 border-dashed border-orange-300 rounded-lg text-orange-600 hover:border-orange-500 hover:bg-orange-50 transition-colors flex items-center justify-center gap-2 font-bold"
                  >
                    <Plus size={20} />
                    위험요인 추가하기
                  </button>
                </div>
              )}

              {/* 소분류별 조치 정보 */}
              {showActionFields && (
                <div className="p-4 rounded-lg bg-white border-2 border-orange-300 space-y-4">
                <h5 className="text-sm font-bold text-orange-700">
                  📋 소분류 조치 정보
                </h5>

                {/* 조치일 */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    <Calendar size={16} className="inline mr-1" />
                    조치일 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={subcategory.actionDate || ''}
                    onChange={(e) => updateSubcategoryField(subcategory.id, 'actionDate', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* 조치자 */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    <Users size={16} className="inline mr-1" />
                    조치자 <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setActionModalState({ subcategoryId: subcategory.id, type: 'assignee' })
                    }
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-left hover:border-orange-300 hover:bg-orange-50/50 transition-colors"
                  >
                    {assignees.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {assignees.map((user) => (
                          <span
                            key={user.id}
                            className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-700"
                          >
                            {user.name} ({user.position})
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400">조치자를 선택해주세요</span>
                    )}
                  </button>
                </div>

                {/* 조치확인자 */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    <Users size={16} className="inline mr-1" />
                    조치확인자 <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setActionModalState({ subcategoryId: subcategory.id, type: 'confirmer' })
                    }
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-left hover:border-orange-300 hover:bg-orange-50/50 transition-colors"
                  >
                    {confirmers.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {confirmers.map((user) => (
                          <span
                            key={user.id}
                            className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700"
                          >
                            {user.name} ({user.position})
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400">조치확인자를 선택해주세요</span>
                    )}
                  </button>
                </div>

                {/* 검토내용 */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">검토내용</label>

                  {/* 기존 검토내용 목록 */}
                  {subcategory.reviewComments && subcategory.reviewComments.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {subcategory.reviewComments.map((comment, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 p-3 rounded-lg bg-gray-50 border border-gray-200"
                        >
                          <span className="text-sm text-slate-700 flex-1">{comment}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteReviewComment(subcategory.id, idx)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="삭제"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 새 검토내용 입력 */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={reviewCommentInputs[subcategory.id] || ''}
                      onChange={(e) =>
                        setReviewCommentInputs({
                          ...reviewCommentInputs,
                          [subcategory.id]: e.target.value,
                        })
                      }
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddReviewComment(subcategory.id);
                        }
                      }}
                      placeholder="검토내용을 입력하세요 (Enter로 추가)"
                      className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddReviewComment(subcategory.id)}
                      disabled={!(reviewCommentInputs[subcategory.id] || '').trim()}
                      className="px-4 py-2.5 rounded-lg font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      <Plus size={16} />
                      추가
                    </button>
                  </div>
                </div>
              </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 조치자/확인자 선택 모달 */}
      {showActionFields && actionModalState.subcategoryId !== null && actionModalState.type && (
        <ActionAssigneeSelectModal
          isOpen={true}
          title={actionModalState.type === 'assignee' ? '조치자 선택' : '조치확인자 선택'}
          selectedIds={
            actionModalState.type === 'assignee'
              ? subcategories.find((s) => s.id === actionModalState.subcategoryId)
                  ?.actionAssigneeIds || []
              : subcategories.find((s) => s.id === actionModalState.subcategoryId)
                  ?.actionConfirmerIds || []
          }
          onConfirm={(ids) => {
            if (actionModalState.subcategoryId !== null) {
              updateSubcategoryField(
                actionModalState.subcategoryId,
                actionModalState.type === 'assignee' ? 'actionAssigneeIds' : 'actionConfirmerIds',
                ids
              );
            }
            setActionModalState({ subcategoryId: null, type: null });
          }}
          onClose={() => setActionModalState({ subcategoryId: null, type: null })}
        />
      )}
    </>
  );
}


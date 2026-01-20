/**
 * 대분류 항목 - 최초 위험성평가
 *
 * 대분류 검색 + 소분류 체크리스트 + 위험요인 카드들
 */

import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import CategorySearchInput from './CategorySearchInput';
import SubcategoryCheckList from './SubcategoryCheckList';
import RiskFactorCard from './RiskFactorCard';
import { v4 as uuidv4 } from 'uuid';

interface RiskFactor {
  id: string;
  factor: string;
  level: 'HIGH' | 'MEDIUM' | 'LOW' | null;
  improvement: string;
  workPeriodStart: string;
  workPeriodEnd: string;
}

interface Subcategory {
  id: number;
  name: string;
  isCustom?: boolean;
  riskFactors: RiskFactor[];
}

interface CategoryItemProps {
  categoryId: number | null;
  categoryName: string;
  subcategories: Subcategory[];
  onCategoryChange: (categoryId: number, categoryName: string) => void;
  onCategoryClear: () => void;
  onSubcategoryToggle: (subcategoryIds: number[]) => void;
  onAddCustomSubcategory: () => void;
  onAddRiskFactor: (subcategoryId: number) => void;
  onUpdateRiskFactor: (subcategoryId: number, factorId: string, field: string, value: string) => void;
  onDeleteRiskFactor: (subcategoryId: number, factorId: string) => void;
  onSearchRiskFactor: (subcategoryId: number) => void;
  onDelete: () => void;
  index: number;
}

export default function CategoryItem({
  categoryId,
  categoryName,
  subcategories,
  onCategoryChange,
  onCategoryClear,
  onSubcategoryToggle,
  onAddCustomSubcategory,
  onAddRiskFactor,
  onUpdateRiskFactor,
  onDeleteRiskFactor,
  onSearchRiskFactor,
  onDelete,
  index,
}: CategoryItemProps) {
  const selectedSubcategoryIds = subcategories.map(s => s.id);
  const customSubcategories = subcategories.filter(s => s.isCustom);

  // 순환 문자 배열
  const circledNumbers = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];

  return (
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
        />
      )}

      {/* 선택된 소분류별 위험요인 */}
      {subcategories.map((subcategory, subIndex) => (
        <div key={subcategory.id} className="bg-orange-50/30 rounded-lg p-4 ml-4 space-y-4">
          {/* 소분류 헤더 */}
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-700">
              소분류{circledNumbers[subIndex] || `${subIndex + 1}`} {subcategory.name}
            </h4>
            <button
              type="button"
              onClick={() => {
                // 소분류 제거 로직
                const newIds = selectedSubcategoryIds.filter(id => id !== subcategory.id);
                onSubcategoryToggle(newIds);
              }}
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-gray-100 rounded"
            >
              <X size={18} />
            </button>
          </div>

          {/* 위험요인 추가 버튼 */}
          <div className="flex items-center justify-start">
            <button
              type="button"
              onClick={() => onAddRiskFactor(subcategory.id)}
              className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700 font-medium"
            >
              <Plus size={16} />
              위험요인 추가하기
            </button>
          </div>

          {/* 위험 요인 카드들 */}
          <div className="space-y-4">
            {subcategory.riskFactors.map((factor) => (
              <RiskFactorCard
                key={factor.id}
                factor={factor.factor}
                level={factor.level}
                improvement={factor.improvement}
                workPeriodStart={factor.workPeriodStart}
                workPeriodEnd={factor.workPeriodEnd}
                onChange={(field, value) =>
                  onUpdateRiskFactor(subcategory.id, factor.id, field, value)
                }
                onDelete={() => onDeleteRiskFactor(subcategory.id, factor.id)}
                onSearchFactor={() => onSearchRiskFactor(subcategory.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

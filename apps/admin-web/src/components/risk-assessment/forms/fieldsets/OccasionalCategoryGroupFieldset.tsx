/**
 * 수시 위험성평가 공종 그룹 Fieldset
 *
 * Category -> Subcategory -> RiskFactor 3단계 구조
 */

import { useState } from 'react';
import { Plus, X, ChevronDown, ChevronRight } from 'lucide-react';
import OccasionalRiskFactorCard from '../components/OccasionalRiskFactorCard';
import SubcategoryAddModal from '@/pages/risk-assessment/modals/SubcategoryAddModal';
import type {
  RiskMethod,
  OccasionalCategory,
  OccasionalSubcategory,
  OccasionalRiskFactor,
  RiskFactorLevel,
  RiskFactorFrequencyIntensity,
} from '../../types/occasional';

interface Props {
  categories: OccasionalCategory[];
  riskMethod: RiskMethod;
  workPeriodStart: string;
  workPeriodEnd: string;
  onChange: (categories: OccasionalCategory[]) => void;
  disabled?: boolean;
}

let idCounter = 0;
const generateId = () => `temp-${Date.now()}-${++idCounter}`;

export default function OccasionalCategoryGroupFieldset({
  categories,
  riskMethod,
  workPeriodStart,
  workPeriodEnd,
  onChange,
  disabled = false,
}: Props) {
  const [subcategoryModalOpen, setSubcategoryModalOpen] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(
    new Set()
  );

  // Category 추가
  const handleAddCategory = () => {
    const newCategory: OccasionalCategory = {
      id: generateId(),
      categoryId: null,
      categoryName: '',
      subcategories: [],
    };
    onChange([...categories, newCategory]);
  };

  // Category 삭제
  const handleDeleteCategory = (categoryId: string) => {
    onChange(categories.filter((cat) => cat.id !== categoryId));
  };

  // Category 이름 변경
  const handleCategoryNameChange = (categoryId: string, name: string) => {
    onChange(
      categories.map((cat) =>
        cat.id === categoryId ? { ...cat, categoryName: name } : cat
      )
    );
  };

  // Subcategory 추가
  const handleAddSubcategory = (categoryId: string, name: string) => {
    const newSub: OccasionalSubcategory = {
      id: Date.now(),
      name,
      isCustom: true,
      riskFactors: [],
    };

    onChange(
      categories.map((cat) =>
        cat.id === categoryId
          ? { ...cat, subcategories: [...cat.subcategories, newSub] }
          : cat
      )
    );

    setSubcategoryModalOpen(false);
  };

  // Subcategory 삭제
  const handleDeleteSubcategory = (categoryId: string, subcategoryId: number) => {
    onChange(
      categories.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              subcategories: cat.subcategories.filter((sub) => sub.id !== subcategoryId),
            }
          : cat
      )
    );
  };

  // RiskFactor 추가
  const handleAddRiskFactor = (categoryId: string, subcategoryId: number) => {
    const baseFactor = {
      id: generateId(),
      factor: '',
      improvement: '',
      workPeriodStart,
      workPeriodEnd,
      actionDate: '',
      actionAssigneeIds: [],
      actionConfirmerIds: [],
    };

    const newFactor: OccasionalRiskFactor =
      riskMethod === 'LEVEL'
        ? ({ ...baseFactor, level: null } as RiskFactorLevel)
        : ({
            ...baseFactor,
            frequency: null,
            intensity: null,
            riskScore: null,
            gradeLevel: null,
          } as RiskFactorFrequencyIntensity);

    onChange(
      categories.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              subcategories: cat.subcategories.map((sub) =>
                sub.id === subcategoryId
                  ? { ...sub, riskFactors: [...sub.riskFactors, newFactor] }
                  : sub
              ),
            }
          : cat
      )
    );
  };

  // RiskFactor 업데이트
  const handleUpdateRiskFactor = (
    categoryId: string,
    subcategoryId: number,
    factorId: string,
    updatedFactor: OccasionalRiskFactor
  ) => {
    onChange(
      categories.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              subcategories: cat.subcategories.map((sub) =>
                sub.id === subcategoryId
                  ? {
                      ...sub,
                      riskFactors: sub.riskFactors.map((f) =>
                        f.id === factorId ? updatedFactor : f
                      ),
                    }
                  : sub
              ),
            }
          : cat
      )
    );
  };

  // RiskFactor 삭제
  const handleDeleteRiskFactor = (
    categoryId: string,
    subcategoryId: number,
    factorId: string
  ) => {
    onChange(
      categories.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              subcategories: cat.subcategories.map((sub) =>
                sub.id === subcategoryId
                  ? {
                      ...sub,
                      riskFactors: sub.riskFactors.filter((f) => f.id !== factorId),
                    }
                  : sub
              ),
            }
          : cat
      )
    );
  };

  // Category 확장/축소
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  // Subcategory 확장/축소
  const toggleSubcategory = (subcategoryKey: string) => {
    setExpandedSubcategories((prev) => {
      const next = new Set(prev);
      if (next.has(subcategoryKey)) {
        next.delete(subcategoryKey);
      } else {
        next.add(subcategoryKey);
      }
      return next;
    });
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-700">작업 공종 및 위험요인</h3>
          <span className="text-sm text-slate-600">
            총 <span className="font-bold text-orange-600">{categories.length}</span>개 공종
          </span>
        </div>

        {categories.map((category, catIndex) => {
          const isCategoryExpanded = expandedCategories.has(category.id);

          return (
            <div
              key={category.id}
              className="bg-gray-50 rounded-xl border-2 border-gray-200 p-6 space-y-4"
            >
              {/* Category 헤더 */}
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  {isCategoryExpanded ? (
                    <ChevronDown size={20} className="text-slate-600" />
                  ) : (
                    <ChevronRight size={20} className="text-slate-600" />
                  )}
                </button>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-600 mb-2">
                    공종 {catIndex + 1} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={category.categoryName}
                    onChange={(e) =>
                      handleCategoryNameChange(category.id, e.target.value)
                    }
                    disabled={disabled}
                    placeholder="예: 철근공사, 콘크리트공사"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-50"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteCategory(category.id)}
                  disabled={disabled}
                  className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  공종 삭제
                </button>
              </div>

              {/* Subcategory 목록 */}
              {isCategoryExpanded && (
                <div className="ml-8 space-y-4">
                  {category.subcategories.map((subcategory) => {
                    const subcategoryKey = `${category.id}-${subcategory.id}`;
                    const isSubExpanded = expandedSubcategories.has(subcategoryKey);

                    return (
                      <div
                        key={subcategory.id}
                        className="bg-white rounded-lg border border-gray-200 p-4 space-y-4"
                      >
                        {/* Subcategory 헤더 */}
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => toggleSubcategory(subcategoryKey)}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            {isSubExpanded ? (
                              <ChevronDown size={18} className="text-slate-600" />
                            ) : (
                              <ChevronRight size={18} className="text-slate-600" />
                            )}
                          </button>
                          <div className="flex-1">
                            <div className="font-bold text-slate-700">
                              {subcategory.name}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                              위험요인 {subcategory.riskFactors.length}개
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteSubcategory(category.id, subcategory.id)
                            }
                            disabled={disabled}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <X size={16} />
                          </button>
                        </div>

                        {/* RiskFactor 목록 */}
                        {isSubExpanded && (
                          <div className="ml-6 space-y-4">
                            {subcategory.riskFactors.map((factor, factorIndex) => (
                              <OccasionalRiskFactorCard
                                key={factor.id}
                                index={factorIndex}
                                factor={factor}
                                riskMethod={riskMethod}
                                onChange={(updatedFactor) =>
                                  handleUpdateRiskFactor(
                                    category.id,
                                    subcategory.id,
                                    factor.id,
                                    updatedFactor
                                  )
                                }
                                onRemove={() =>
                                  handleDeleteRiskFactor(
                                    category.id,
                                    subcategory.id,
                                    factor.id
                                  )
                                }
                                disabled={disabled}
                              />
                            ))}

                            {/* 위험요인 추가 버튼 */}
                            <button
                              type="button"
                              onClick={() =>
                                handleAddRiskFactor(category.id, subcategory.id)
                              }
                              disabled={disabled}
                              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-orange-600 hover:border-orange-500 hover:bg-orange-50 transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50"
                            >
                              <Plus size={18} />
                              위험요인 추가
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Subcategory 추가 버튼 */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCategoryId(category.id);
                      setSubcategoryModalOpen(true);
                    }}
                    disabled={disabled}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-orange-600 hover:border-orange-500 hover:bg-orange-50 transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50"
                  >
                    <Plus size={18} />
                    하위 분류 추가
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Category 추가 버튼 */}
        <button
          type="button"
          onClick={handleAddCategory}
          disabled={disabled}
          className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-orange-600 hover:border-orange-500 hover:bg-orange-50 transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50"
        >
          <Plus size={20} />
          작업 공종 추가하기
        </button>
      </div>

      {/* Subcategory 추가 모달 */}
      <SubcategoryAddModal
        isOpen={subcategoryModalOpen}
        onClose={() => {
          setSubcategoryModalOpen(false);
          setActiveCategoryId(null);
        }}
        onAdd={(name) => {
          if (activeCategoryId) {
            handleAddSubcategory(activeCategoryId, name);
          }
        }}
      />
    </>
  );
}

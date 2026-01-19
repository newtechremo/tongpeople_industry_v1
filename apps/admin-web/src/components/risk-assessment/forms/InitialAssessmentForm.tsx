/**
 * 최초 위험성평가 폼
 *
 * 기본정보 + 작업기간 + 작업분류 + 위험요인 목록
 */

import { useState } from 'react';
import BasicInfoFieldset from './fieldsets/BasicInfoFieldset';
import WorkPeriodFieldset from './fieldsets/WorkPeriodFieldset';
import CategoryFieldset from './fieldsets/CategoryFieldset';
import RiskItemsFieldset from './fieldsets/RiskItemsFieldset';
import {
  mockCategories,
  mockSubcategories,
  mockRiskFactors,
  getSubcategoriesByCategoryId,
  getRiskFactorsBySubcategoryId,
  type MockRiskFactor,
} from '@/mocks/risk-assessment';

interface InitialAssessmentData {
  title: string;
  site_id: string;
  team_id?: string;
  work_start_date: Date;
  work_end_date: Date;
  category_id: string;
  subcategory_id?: string;
  selected_factors: MockRiskFactor[];
}

interface Props {
  onSubmit: (data: InitialAssessmentData) => void;
  onCancel: () => void;
}

export default function InitialAssessmentForm({ onSubmit, onCancel }: Props) {
  const [formData, setFormData] = useState<InitialAssessmentData>({
    title: '',
    site_id: '',
    team_id: '',
    work_start_date: new Date(),
    work_end_date: new Date(),
    category_id: '',
    subcategory_id: '',
    selected_factors: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // 필드 값 변경 핸들러
  const handleChange = (field: string, value: string | Date) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    // 에러 초기화
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // 위험요인 추가 핸들러
  const handleAddFactors = (factorIds: string[]) => {
    const newFactors = mockRiskFactors.filter(f => factorIds.includes(f.id));
    setFormData(prev => ({
      ...prev,
      selected_factors: [...prev.selected_factors, ...newFactors],
    }));
    // 에러 초기화
    if (errors.selected_factors) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.selected_factors;
        return newErrors;
      });
    }
  };

  // 위험요인 제거 핸들러
  const handleRemoveFactor = (factorId: string) => {
    setFormData(prev => ({
      ...prev,
      selected_factors: prev.selected_factors.filter(f => f.id !== factorId),
    }));
  };

  // 유효성 검사
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = '평가명을 입력해주세요';
    }

    if (!formData.site_id) {
      newErrors.site_id = '현장을 선택해주세요';
    }

    if (!formData.category_id) {
      newErrors.category_id = '대분류를 선택해주세요';
    }

    if (formData.work_end_date < formData.work_start_date) {
      newErrors.work_end_date = '종료일은 시작일 이후여야 합니다';
    }

    if (formData.selected_factors.length === 0) {
      newErrors.selected_factors = '최소 1개 이상의 위험요인을 선택해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 제출 핸들러
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validate()) {
      onSubmit(formData);
    }
  };

  // 소분류 필터링
  const filteredSubcategories = formData.category_id
    ? getSubcategoriesByCategoryId(formData.category_id)
    : [];

  // 위험요인 필터링
  const availableFactors = formData.subcategory_id
    ? getRiskFactorsBySubcategoryId(formData.subcategory_id)
    : formData.category_id
    ? mockRiskFactors.filter(f => {
        const subcats = getSubcategoriesByCategoryId(formData.category_id);
        return subcats.some(sub => sub.id === f.subcategory_id);
      })
    : [];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 기본정보 */}
      <BasicInfoFieldset
        title={formData.title}
        siteId={formData.site_id}
        teamId={formData.team_id}
        errors={errors}
        onChange={handleChange}
      />

      {/* 작업기간 */}
      <WorkPeriodFieldset
        startDate={formData.work_start_date}
        endDate={formData.work_end_date}
        errors={errors}
        onChange={handleChange}
      />

      {/* 작업 분류 */}
      <CategoryFieldset
        categoryId={formData.category_id}
        subcategoryId={formData.subcategory_id}
        categories={mockCategories}
        subcategories={filteredSubcategories}
        errors={errors}
        onChange={handleChange}
      />

      {/* 위험요인 목록 */}
      <RiskItemsFieldset
        selectedFactors={formData.selected_factors}
        availableFactors={availableFactors}
        onAdd={handleAddFactors}
        onRemove={handleRemoveFactor}
        disabled={!formData.category_id}
        error={errors.selected_factors}
      />

      {/* 액션 버튼 */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 rounded-xl font-bold text-slate-600 bg-white border-2 border-slate-200 hover:bg-slate-50 transition-colors"
        >
          취소
        </button>
        <button
          type="submit"
          className="px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl"
        >
          평가 생성
        </button>
      </div>
    </form>
  );
}

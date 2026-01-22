/**
 * 작업 분류 Fieldset
 *
 * 작업 공종/세부 공종 선택
 */

import CategorySearchInput from '@/components/risk-assessment/inputs/CategorySearchInput';
import SubcategorySearchInput from '@/components/risk-assessment/inputs/SubcategorySearchInput';
import type { MockRiskCategory, MockRiskSubcategory } from '@/mocks/risk-assessment';

interface Props {
  categoryId: string;
  subcategoryId?: string;
  categories: MockRiskCategory[];
  subcategories: MockRiskSubcategory[];
  errors: Record<string, string>;
  onChange: (field: string, value: string) => void;
}

export default function CategoryFieldset({
  categoryId,
  subcategoryId,
  categories,
  subcategories,
  errors,
  onChange,
}: Props) {
  const handleCategoryChange = (newCategoryId: string) => {
    onChange('category_id', newCategoryId);
    onChange('subcategory_id', '');
  };

  return (
    <div className="p-8 rounded-2xl border border-gray-200 bg-white space-y-6">
      <h3 className="text-lg font-bold text-slate-800">작업 분류</h3>

      <div className="grid grid-cols-2 gap-4">
        <CategorySearchInput
          categories={categories}
          value={categoryId}
          onChange={handleCategoryChange}
          error={errors.category_id}
        />

        <SubcategorySearchInput
          subcategories={subcategories}
          value={subcategoryId || ''}
          onChange={(value) => onChange('subcategory_id', value)}
          disabled={!categoryId}
          error={errors.subcategory_id}
        />
      </div>

      {categoryId && (
        <div className="p-4 rounded-xl bg-orange-50 border border-orange-200">
          <p className="text-sm text-slate-600">
            선택된 작업 분류:{' '}
            <span className="font-bold text-orange-600">
              {categories.find(c => c.id === categoryId)?.name}
              {subcategoryId && (
                <> &gt; {subcategories.find(s => s.id === subcategoryId)?.name}</>
              )}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * 위험성평가 폼 (최초/정기)
 *
 * 기본정보 + 작업 공종/소분류 + 위험요인 입력 흐름 유지
 */

import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BasicInfoSection from '@/pages/risk-assessment/components/BasicInfoSection';
import CategoryItem from '@/pages/risk-assessment/components/CategoryItem';
import ApprovalLineSelectModal from '@/pages/risk-assessment/modals/ApprovalLineSelectModal';
import SubcategoryAddModal from '@/pages/risk-assessment/modals/SubcategoryAddModal';
import RiskFactorSelectModal from '@/pages/risk-assessment/modals/RiskFactorSelectModal';
import { useApprovalLines } from '@/stores/approvalLinesStore';

let idCounter = 0;
const generateId = () => `temp-${Date.now()}-${++idCounter}`;

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

interface Category {
  id: string;
  categoryId: number | null;
  categoryName: string;
  subcategories: Subcategory[];
}

interface InitialAssessmentPayload {
  siteName: string;
  companyName: string;
  approvalLineId: string | null;
  workPeriodStart: string;
  workPeriodEnd: string;
  categories: Category[];
}

interface Props {
  type: 'initial' | 'regular';
  onSubmit: (data: InitialAssessmentPayload) => void;
  onCancel: () => void;
}

export default function InitialAssessmentForm({ type, onSubmit, onCancel }: Props) {
  const navigate = useNavigate();

  const [siteName] = useState('통사통사현장');
  const [companyName] = useState('(주)통하는사람들');
  const [workPeriodStart, setWorkPeriodStart] = useState('2026-01-01');
  const [workPeriodEnd, setWorkPeriodEnd] = useState('2026-01-31');
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);

  const approvalLines = useApprovalLines();
  const availableApprovalLines = useMemo(() => {
    return approvalLines.filter((line) =>
      line.tags.includes('RISK_ASSESSMENT') || line.tags.includes('GENERAL')
    );
  }, [approvalLines]);

  const defaultApprovalLine = useMemo(() => {
    const pinned = availableApprovalLines.find((line) => line.isPinned);
    return pinned || availableApprovalLines[0] || null;
  }, [availableApprovalLines]);

  const [selectedApprovalLine, setSelectedApprovalLine] = useState(defaultApprovalLine);

  useEffect(() => {
    if (!selectedApprovalLine || !availableApprovalLines.some((line) => line.id === selectedApprovalLine.id)) {
      setSelectedApprovalLine(defaultApprovalLine);
    }
  }, [availableApprovalLines, defaultApprovalLine, selectedApprovalLine]);

  const [categories, setCategories] = useState<Category[]>([]);

  const [subcategoryModalOpen, setSubcategoryModalOpen] = useState(false);
  const [riskFactorModalOpen, setRiskFactorModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeSubcategory, setActiveSubcategory] = useState<number | null>(null);

  const handleAddCategory = () => {
    setCategories([
      ...categories,
      {
        id: generateId(),
        categoryId: null,
        categoryName: '',
        subcategories: [],
      },
    ]);
  };

  const handleCategoryChange = (categoryId: string, newCategoryId: number, newCategoryName: string) => {
    setCategories(
      categories.map((cat) =>
        cat.id === categoryId
          ? { ...cat, categoryId: newCategoryId, categoryName: newCategoryName }
          : cat
      )
    );
  };

  const handleDeleteCategory = (categoryId: string) => {
    setCategories(categories.filter((cat) => cat.id !== categoryId));
  };

  const getMockSubcategoryName = (id: number): string => {
    const mockData: Record<number, string> = {
      101: '가설전선 설치작업',
      102: '가설전선 점검작업',
      103: '꽂음 접속기작업',
      104: '이동형 릴 전선작업',
      105: '전동공구 사용/정리정돈작업',
    };
    return mockData[id] || `소분류 ${id}`;
  };

  const handleSubcategoryToggle = (categoryId: string, subcategoryIds: number[]) => {
    setCategories(
      categories.map((cat) => {
        if (cat.id !== categoryId) return cat;

        const existingSubs = cat.subcategories.filter((sub) =>
          subcategoryIds.includes(sub.id)
        );

        const newSubIds = subcategoryIds.filter(
          (id) => !cat.subcategories.find((sub) => sub.id === id)
        );

        const newSubs: Subcategory[] = newSubIds.map((id) => ({
          id,
          name: getMockSubcategoryName(id),
          riskFactors: [],
        }));

        return {
          ...cat,
          subcategories: [...existingSubs, ...newSubs],
        };
      })
    );
  };

  const handleAddCustomSubcategory = (name: string) => {
    if (!activeCategory) {
      alert('대분류를 먼저 선택해주세요.');
      return;
    }

    const newSubcategoryId = Math.floor(Math.random() * 1000000) + 1000;

    setCategories(
      categories.map((cat) => {
        if (cat.id !== activeCategory) return cat;

        return {
          ...cat,
          subcategories: [
            ...cat.subcategories,
            {
              id: newSubcategoryId,
              name,
              isCustom: true,
              riskFactors: [],
            },
          ],
        };
      })
    );
  };

  const handleAddRiskFactor = (categoryId: string, subcategoryId: number) => {
    setActiveCategory(categoryId);
    setActiveSubcategory(subcategoryId);
    setRiskFactorModalOpen(true);
  };

  const handleSelectRiskFactors = (factors: { factor: string; improvement: string }[]) => {
    if (!activeCategory || !activeSubcategory) return;

    setCategories(
      categories.map((cat) => {
        if (cat.id !== activeCategory) return cat;

        return {
          ...cat,
          subcategories: cat.subcategories.map((sub) => {
            if (sub.id !== activeSubcategory) return sub;

            const newFactors: RiskFactor[] = factors.map((f) => ({
              id: generateId(),
              factor: f.factor,
              level: null,
              improvement: f.improvement,
              workPeriodStart,
              workPeriodEnd,
            }));

            return {
              ...sub,
              riskFactors: [...sub.riskFactors, ...newFactors],
            };
          }),
        };
      })
    );
  };

  const handleUpdateRiskFactor = (
    categoryId: string,
    subcategoryId: number,
    factorId: string,
    field: string,
    value: string
  ) => {
    setCategories(
      categories.map((cat) => {
        if (cat.id !== categoryId) return cat;

        return {
          ...cat,
          subcategories: cat.subcategories.map((sub) => {
            if (sub.id !== subcategoryId) return sub;

            return {
              ...sub,
              riskFactors: sub.riskFactors.map((factor) =>
                factor.id === factorId ? { ...factor, [field]: value } : factor
              ),
            };
          }),
        };
      })
    );
  };

  const handleDeleteRiskFactor = (categoryId: string, subcategoryId: number, factorId: string) => {
    setCategories(
      categories.map((cat) => {
        if (cat.id !== categoryId) return cat;

        return {
          ...cat,
          subcategories: cat.subcategories.map((sub) => {
            if (sub.id !== subcategoryId) return sub;

            return {
              ...sub,
              riskFactors: sub.riskFactors.filter((factor) => factor.id !== factorId),
            };
          }),
        };
      })
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (categories.length === 0) {
      alert('최소 1개 이상의 작업 공종을 추가해주세요.');
      return;
    }

    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      if (!category.categoryId) {
        alert(`대분류${i + 1}를 선택해주세요.`);
        return;
      }
      if (category.subcategories.length === 0) {
        alert(`대분류${i + 1} (${category.categoryName})에 최소 1개 이상의 소분류를 선택해주세요.`);
        return;
      }

      for (let j = 0; j < category.subcategories.length; j++) {
        const subcategory = category.subcategories[j];
        if (subcategory.riskFactors.length === 0) {
          alert(`소분류 "${subcategory.name}"에 최소 1개 이상의 위험요인을 추가해주세요.`);
          return;
        }

        for (let k = 0; k < subcategory.riskFactors.length; k++) {
          const factor = subcategory.riskFactors[k];
          if (!factor.factor.trim()) {
            alert(`소분류 "${subcategory.name}"의 위험요인 ${k + 1}번째 항목에 위험요인을 입력해주세요.`);
            return;
          }
          if (!factor.level) {
            alert(`소분류 "${subcategory.name}"의 위험요인 "${factor.factor}"의 위험성 수준을 선택해주세요.`);
            return;
          }
          if (!factor.improvement.trim()) {
            alert(`소분류 "${subcategory.name}"의 위험요인 "${factor.factor}"의 개선대책을 입력해주세요.`);
            return;
          }
        }
      }
    }

    onSubmit({
      siteName,
      companyName,
      approvalLineId: selectedApprovalLine?.id || null,
      workPeriodStart,
      workPeriodEnd,
      categories,
    });
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <BasicInfoSection
          siteName={siteName}
          companyName={companyName}
          approvalLineName={selectedApprovalLine?.name || null}
          approvalLineCount={selectedApprovalLine?.approvers.length || null}
          approvalLineApprovers={
            selectedApprovalLine?.approvers.map((approver) => ({
              approvalTitle: approver.approvalTitle,
              userName: approver.userName,
              userId: approver.userId,
              position: approver.position,
            })) || []
          }
          workPeriodStart={workPeriodStart}
          workPeriodEnd={workPeriodEnd}
          onApprovalLineChange={() => setApprovalModalOpen(true)}
          onDateChange={(field, value) => {
            if (field === 'start') setWorkPeriodStart(value);
            else setWorkPeriodEnd(value);
          }}
        />

        <div className="space-y-6">
          <h3 className="text-lg font-bold text-slate-700">작업 공종</h3>

          {categories.map((category, index) => (
            <CategoryItem
              key={category.id}
              categoryId={category.categoryId}
              categoryName={category.categoryName}
              subcategories={category.subcategories}
              onCategoryChange={(catId, catName) =>
                handleCategoryChange(category.id, catId, catName)
              }
              onCategoryClear={() => handleCategoryChange(category.id, null as any, '')}
              onSubcategoryToggle={(ids) => handleSubcategoryToggle(category.id, ids)}
              onAddCustomSubcategory={() => {
                setActiveCategory(category.id);
                setSubcategoryModalOpen(true);
              }}
              onAddRiskFactor={(subId) => handleAddRiskFactor(category.id, subId)}
              onUpdateRiskFactor={(subId, factorId, field, value) =>
                handleUpdateRiskFactor(category.id, subId, factorId, field, value)
              }
              onDeleteRiskFactor={(subId, factorId) =>
                handleDeleteRiskFactor(category.id, subId, factorId)
              }
              onSearchRiskFactor={(subId) => handleAddRiskFactor(category.id, subId)}
              onDelete={() => handleDeleteCategory(category.id)}
              index={index}
            />
          ))}

          <button
            type="button"
            onClick={handleAddCategory}
            className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-orange-600 hover:border-orange-500 hover:bg-orange-50 transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <Plus size={20} />
            작업 공종(대분류) 추가하기
          </button>
        </div>

        <div className="flex items-center justify-center gap-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-8 py-3 rounded-xl font-medium text-slate-600 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            className="px-8 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg"
          >
            만들기
          </button>
        </div>
      </form>

      <SubcategoryAddModal
        isOpen={subcategoryModalOpen}
        onClose={() => setSubcategoryModalOpen(false)}
        onAdd={handleAddCustomSubcategory}
      />

      <RiskFactorSelectModal
        isOpen={riskFactorModalOpen}
        onClose={() => setRiskFactorModalOpen(false)}
        categoryId={
          categories.find((c) => c.id === activeCategory)?.categoryId || 0
        }
        subcategoryId={activeSubcategory || 0}
        onSelect={handleSelectRiskFactors}
        initialMode={
          categories
            .find((c) => c.id === activeCategory)
            ?.subcategories.find((s) => s.id === activeSubcategory)
            ?.isCustom
            ? 'direct'
            : 'search'
        }
        isCustomSubcategory={
          categories
            .find((c) => c.id === activeCategory)
            ?.subcategories.find((s) => s.id === activeSubcategory)
            ?.isCustom || false
        }
        existingFactors={
          categories
            .find((c) => c.id === activeCategory)
            ?.subcategories.find((s) => s.id === activeSubcategory)
            ?.riskFactors.map(rf => rf.factor) || []
        }
      />

      <ApprovalLineSelectModal
        isOpen={approvalModalOpen}
        lines={availableApprovalLines}
        selectedId={selectedApprovalLine?.id || null}
        onClose={() => setApprovalModalOpen(false)}
        onSelect={(line) => {
          setSelectedApprovalLine(line);
          setApprovalModalOpen(false);
        }}
        onCreate={() => {
          setApprovalModalOpen(false);
          navigate('/settings', { state: { tab: 'approval-lines', openModal: 'add' } });
        }}
      />
    </>
  );
}

/**
 * 최초 위험성평가 폼
 *
 * 전체 폼을 통합하여 관리
 */

import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BasicInfoSection from './components/BasicInfoSection';
import CategoryItem from './components/CategoryItem';
import ApprovalLineSelectModal from './modals/ApprovalLineSelectModal';
import SubcategoryAddModal from './modals/SubcategoryAddModal';
import RiskFactorSelectModal from './modals/RiskFactorSelectModal';
import SuccessModal from './modals/SuccessModal';
import { useApprovalLines } from '@/stores/approvalLinesStore';

// UUID 대체 - 간단한 ID 생성기
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

interface InitialAssessmentFormProps {
  onBack: () => void;
  onSuccess: () => void;
}

export default function InitialAssessmentForm({
  onBack,
  onSuccess,
}: InitialAssessmentFormProps) {
  const navigate = useNavigate();
  // 기본 정보
  const [siteName] = useState('통사통사현장');
  const [companyName] = useState('(주)통하는사람들');
  const [workerRepName] = useState('36');
  const [workerRepId] = useState('0017');
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

  // 작업 공종 (대분류)
  const [categories, setCategories] = useState<Category[]>([]);

  // 모달 상태
  const [subcategoryModalOpen, setSubcategoryModalOpen] = useState(false);
  const [riskFactorModalOpen, setRiskFactorModalOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeSubcategory, setActiveSubcategory] = useState<number | null>(null);

  // 대분류 추가
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

  // 대분류 선택
  const handleCategoryChange = (categoryId: string, newCategoryId: number, newCategoryName: string) => {
    setCategories(
      categories.map((cat) =>
        cat.id === categoryId
          ? { ...cat, categoryId: newCategoryId, categoryName: newCategoryName }
          : cat
      )
    );
  };

  // 대분류 삭제
  const handleDeleteCategory = (categoryId: string) => {
    setCategories(categories.filter((cat) => cat.id !== categoryId));
  };

  // Mock 소분류 데이터 (실제로는 API에서 categoryId로 조회)
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

  // 소분류 토글
  const handleSubcategoryToggle = (categoryId: string, subcategoryIds: number[]) => {
    setCategories(
      categories.map((cat) => {
        if (cat.id !== categoryId) return cat;

        // 기존 소분류 중 선택된 것만 유지
        const existingSubs = cat.subcategories.filter((sub) =>
          subcategoryIds.includes(sub.id)
        );

        // 새로 추가된 소분류 찾기
        const newSubIds = subcategoryIds.filter(
          (id) => !cat.subcategories.find((sub) => sub.id === id)
        );

        // Mock: 새 소분류 생성 (실제로는 API에서 가져와야 함)
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

  // 커스텀 소분류 추가
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

  // 위험요인 추가
  const handleAddRiskFactor = (categoryId: string, subcategoryId: number) => {
    setActiveCategory(categoryId);
    setActiveSubcategory(subcategoryId);
    setRiskFactorModalOpen(true);
  };

  // 위험요인 선택 완료
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

  // 위험요인 업데이트
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

  // 위험요인 삭제
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

  // 폼 제출
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 유효성 검사
    if (categories.length === 0) {
      alert('최소 1개 이상의 작업 공종을 추가해주세요.');
      return;
    }

    // 각 대분류마다 최소 1개 이상의 소분류 확인
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

      // 각 소분류마다 최소 1개 이상의 위험요인 확인
      for (let j = 0; j < category.subcategories.length; j++) {
        const subcategory = category.subcategories[j];
        if (subcategory.riskFactors.length === 0) {
          alert(`소분류 "${subcategory.name}"에 최소 1개 이상의 위험요인을 추가해주세요.`);
          return;
        }

        // 각 위험요인의 필수 항목 확인
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

    // TODO: API 호출
    console.log('제출 데이터:', {
      siteName,
      companyName,
      approvalLineId,
      workPeriodStart,
      workPeriodEnd,
      categories,
    });

    setSuccessModalOpen(true);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} className="text-slate-600" />
          </button>
          <h1 className="text-xl font-black tracking-tight text-slate-800">
            최초 위험성 평가 만들기
          </h1>
        </div>

        {/* 기본 정보 */}
        <BasicInfoSection
          siteName={siteName}
          companyName={companyName}
          approvalLineName={selectedApprovalLine?.name || null}
          approvalLineCount={selectedApprovalLine?.approvers.length || null}
          approvalLineApprovers={
            selectedApprovalLine?.approvers.map((approver) => ({
              approvalTitle: approver.approvalTitle,
              userName: approver.userName,
            })) || []
          }
          workerRepName={workerRepName}
          workerRepId={workerRepId}
          workPeriodStart={workPeriodStart}
          workPeriodEnd={workPeriodEnd}
          onApprovalLineChange={() => setApprovalModalOpen(true)}
          onDateChange={(field, value) => {
            if (field === 'start') setWorkPeriodStart(value);
            else setWorkPeriodEnd(value);
          }}
        />

        {/* 작업 공종 */}
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

          {/* 작업 공종 추가 버튼 */}
          <button
            type="button"
            onClick={handleAddCategory}
            className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-orange-600 hover:border-orange-500 hover:bg-orange-50 transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <Plus size={20} />
            작업 공종(대분류) 추가하기
          </button>
        </div>

        {/* 하단 버튼 */}
        <div className="flex items-center justify-center gap-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onBack}
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

      {/* 모달들 - form 밖에 위치 */}
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

      <SuccessModal
        isOpen={successModalOpen}
        onConfirm={() => {
          setSuccessModalOpen(false);
          onSuccess();
        }}
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

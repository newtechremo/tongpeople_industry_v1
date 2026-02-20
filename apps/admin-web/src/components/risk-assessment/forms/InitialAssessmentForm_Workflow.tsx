/**
 * 최초/정기 위험성평가 폼 - 워크플로우 버전
 *
 * 순차적 작성 방식 (2단계):
 * 1. 기본 정보
 * 2. 작업 공종
 *
 * 특징:
 * - 위험성 산정 방식: 상중하(LEVEL) 고정
 * - 아코디언 순차 확장 + 섹션 잠금 구조
 * - 조치 정보 없음 (수시와 차이점)
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import BasicInfoSection from '@/pages/risk-assessment/components/BasicInfoSection';
import OccasionalCategoryItem from '@/pages/risk-assessment/components/OccasionalCategoryItem';
import WorkflowSection from './components/WorkflowSection';
import ScrollToTop from './components/ScrollToTop';
import SubcategoryAddModal from '@/pages/risk-assessment/modals/SubcategoryAddModal';
import RiskFactorSelectModal from '@/pages/risk-assessment/modals/RiskFactorSelectModal';
import ApprovalLineSelectModal from '@/pages/risk-assessment/modals/ApprovalLineSelectModal';
import { useApprovalLines } from '@/stores/approvalLinesStore';
import { getActiveTeams } from '@/mocks/teams';
import { useWorkflow } from '../hooks/useWorkflow';
import { useAutoScroll } from '../hooks/useAutoScroll';
import { validateBasicInfo } from '../validation/workflowValidation';
import { validateRiskFactorByMethod } from '../validation/common';
import {
  getExcludedCategoryIds,
  getExcludedSubcategoryIds,
} from '../utils/duplicateGuard';
import { normalizeString } from '../utils/stringNormalize';
import {
  generateId,
  formatDateInputValue,
  addMonths,
  type RiskFactorLevel,
} from '../types/common';
import type { InitialAssessmentPayload } from '../types/initial';

// ==================== 타입 정의 ====================

/**
 * 워크플로우용 소분류 (조치 정보 없음)
 */
interface WorkflowSubcategory {
  id: number;
  name: string;
  isCustom?: boolean;
  riskFactors: RiskFactorLevel[];
}

/**
 * 워크플로우용 대분류
 */
interface WorkflowCategory {
  id: string;
  categoryId: number | null;
  categoryName: string;
  subcategories: WorkflowSubcategory[];
}

interface Props {
  type: 'initial' | 'regular';
  onSubmit: (data: InitialAssessmentPayload) => void;
  onCancel: () => void;
  onProgressChange?: (completed: number, total: number) => void;
}

// ==================== 워크플로우 메타데이터 ====================

const WORKFLOW_META = {
  BASIC_INFO: {
    title: '기본 정보',
    description: '현장, 소속팀, 작업기간, 결재라인 정보를 입력합니다.',
  },
  WORK_CATEGORY: {
    title: '작업 공종',
    description: '대분류, 소분류, 위험요인을 입력합니다.',
  },
} as const;

// ==================== 검증 함수 ====================

/**
 * 작업 공종 섹션 검증
 */
function validateWorkCategorySection(
  categories: WorkflowCategory[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (categories.length === 0) {
    errors.push('최소 1개 이상의 작업 공종(대분류)을 추가해주세요.');
    return { isValid: false, errors };
  }

  const usedCategoryIds = new Set<number>();
  const usedCategoryNames = new Set<string>();
  const usedSubcategoryIds = new Set<number>();
  const usedSubcategoryNames = new Set<string>();
  const usedRiskFactorNames = new Set<string>();

  categories.forEach((category, catIdx) => {
    const catPrefix = `대분류 ${catIdx + 1}`;

    // 대분류 ID 검증
    if (!category.categoryId) {
      errors.push(`${catPrefix}: 대분류를 선택해주세요.`);
    } else if (usedCategoryIds.has(category.categoryId)) {
      errors.push(`${catPrefix}: 이미 선택된 대분류입니다.`);
    } else {
      usedCategoryIds.add(category.categoryId);
    }

    // 대분류명 검증
    if (!category.categoryName || category.categoryName.trim() === '') {
      errors.push(`${catPrefix}: 대분류명을 입력해주세요.`);
    } else {
      const normalizedName = normalizeString(category.categoryName);
      if (usedCategoryNames.has(normalizedName)) {
        errors.push(`${catPrefix}: 이미 사용된 대분류명입니다.`);
      } else {
        usedCategoryNames.add(normalizedName);
      }
    }

    // 소분류 개수 검증
    if (category.subcategories.length === 0) {
      errors.push(`${catPrefix}: 최소 1개 이상의 소분류를 추가해주세요.`);
      return;
    }

    // 소분류별 검증
    category.subcategories.forEach((subcategory, subIdx) => {
      const subPrefix = `${catPrefix} > 소분류 ${subIdx + 1}`;
      const normalizedSubName = normalizeString(subcategory.name);

      // 소분류 ID 중복 검증
      if (usedSubcategoryIds.has(subcategory.id)) {
        errors.push(`${subPrefix}: 이미 선택된 소분류입니다.`);
      } else {
        usedSubcategoryIds.add(subcategory.id);
      }

      // 소분류명 중복 검증
      if (normalizedSubName && usedSubcategoryNames.has(normalizedSubName)) {
        errors.push(`${subPrefix}: 이미 사용된 소분류명입니다.`);
      } else if (normalizedSubName) {
        usedSubcategoryNames.add(normalizedSubName);
      }

      // 위험요인 개수 검증
      if (subcategory.riskFactors.length === 0) {
        errors.push(`${subPrefix}: 최소 1개 이상의 위험요인을 추가해주세요.`);
      }

      // 위험요인별 검증
      subcategory.riskFactors.forEach((factor, factorIdx) => {
        const factorPrefix = `${subPrefix} > 위험요인 ${factorIdx + 1}`;
        const normalizedFactorName = normalizeString(factor.factor);

        // 위험요인명 중복 검증
        if (normalizedFactorName && usedRiskFactorNames.has(normalizedFactorName)) {
          errors.push(`${factorPrefix}: 이미 추가된 위험요인입니다.`);
        } else if (normalizedFactorName) {
          usedRiskFactorNames.add(normalizedFactorName);
        }

        // 위험요인 필드 검증 (상중하 방식)
        const factorErrors = validateRiskFactorByMethod(factor, 'LEVEL');
        factorErrors.forEach((err) => errors.push(`${factorPrefix}: ${err}`));
      });
    });
  });

  return { isValid: errors.length === 0, errors };
}

// ==================== 컴포넌트 ====================

export default function InitialAssessmentForm_Workflow({
  type,
  onSubmit,
  onCancel,
  onProgressChange,
}: Props) {
  const navigate = useNavigate();
  const { scrollToSection } = useAutoScroll();
  const workflow = useWorkflow();

  // 진행률 계산 (2단계 기준)
  const visibleTotalSections = 2;
  const visibleCompletedCount =
    (workflow.sections.BASIC_INFO === 'completed' ? 1 : 0) +
    (workflow.sections.WORK_CATEGORY === 'completed' ? 1 : 0);

  // 제출 가능 여부
  const canSubmit =
    workflow.sections.BASIC_INFO === 'completed' &&
    workflow.sections.WORK_CATEGORY === 'completed';

  const { today, oneMonthLater } = useMemo(() => {
    const base = new Date();
    return {
      today: formatDateInputValue(base),
      oneMonthLater: formatDateInputValue(addMonths(base, 1)),
    };
  }, []);

  useEffect(() => {
    onProgressChange?.(visibleCompletedCount, visibleTotalSections);
  }, [visibleCompletedCount, visibleTotalSections, onProgressChange]);

  // ==================== Form 데이터 ====================

  // 기본 정보
  const [siteName] = useState('통사통사현장');
  const [companyName] = useState('(주)통하는사람들');
  const [teamId, setTeamId] = useState<string>('all');
  const [workPeriodStart, setWorkPeriodStart] = useState(today);
  const [workPeriodEnd, setWorkPeriodEnd] = useState(oneMonthLater);

  // 결재라인
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const approvalLines = useApprovalLines();
  const availableApprovalLines = useMemo(() => approvalLines, [approvalLines]);
  const defaultApprovalLine = useMemo(() => {
    const pinned = availableApprovalLines.find((line) => line.isPinned);
    return pinned || availableApprovalLines[0] || null;
  }, [availableApprovalLines]);
  const [selectedApprovalLine, setSelectedApprovalLine] = useState(defaultApprovalLine);

  useEffect(() => {
    if (
      !selectedApprovalLine ||
      !availableApprovalLines.some((line) => line.id === selectedApprovalLine.id)
    ) {
      setSelectedApprovalLine(defaultApprovalLine);
    }
  }, [availableApprovalLines, defaultApprovalLine, selectedApprovalLine]);

  // 팀 목록
  const teams = useMemo(() => getActiveTeams(), []);

  // Categories (대분류/소분류/위험요인)
  const [categories, setCategories] = useState<WorkflowCategory[]>([]);

  // 모달 상태
  const [subcategoryModalOpen, setSubcategoryModalOpen] = useState(false);
  const [riskFactorModalOpen, setRiskFactorModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeSubcategory, setActiveSubcategory] = useState<number | null>(null);

  // 이미 사용된 위험요인 목록 (중복 방지용)
  const usedRiskFactors = useMemo(() => {
    const factors = new Set<string>();
    categories.forEach((cat) => {
      cat.subcategories.forEach((sub) => {
        sub.riskFactors.forEach((factor) => {
          if (factor.factor?.trim()) factors.add(factor.factor);
        });
      });
    });
    return Array.from(factors);
  }, [categories]);

  // ==================== 검증 데이터 생성 ====================

  const getBasicInfoData = useCallback(() => {
    return {
      siteName,
      companyName,
      teamId,
      workPeriodStart,
      workPeriodEnd,
      approvalLineId: selectedApprovalLine?.id || null,
    };
  }, [siteName, companyName, teamId, workPeriodStart, workPeriodEnd, selectedApprovalLine]);

  // ==================== Workflow 핸들러 ====================

  const handleBasicInfoNext = () => {
    const validation = validateBasicInfo(getBasicInfoData());

    if (!validation.isValid) {
      workflow.handleNext('BASIC_INFO', false);
      alert(`입력 오류:\n\n${validation.errors.join('\n')}`);
      return;
    }

    workflow.handleNext('BASIC_INFO', true);
    // RISK_METHOD는 자동 완료 처리 (상중하 고정)
    workflow.handleNext('RISK_METHOD', true);
    setTimeout(() => scrollToSection('WORK_CATEGORY'), 100);
  };

  const handleWorkCategoryNext = () => {
    const validation = validateWorkCategorySection(categories);
    workflow.handleNext('WORK_CATEGORY', validation.isValid);

    if (!validation.isValid) {
      alert(`작업 공종 오류:\n\n${validation.errors.join('\n')}`);
    }
  };

  // ==================== Category/Subcategory/RiskFactor 관리 ====================

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

  const handleAddCategory = () => {
    setCategories((prev) => [
      ...prev,
      {
        id: generateId(),
        categoryId: null,
        categoryName: '',
        subcategories: [],
      },
    ]);
    workflow.handleEditField('WORK_CATEGORY');
  };

  const handleCategoryChange = (
    categoryKey: string,
    newCategoryId: number | null,
    newCategoryName: string
  ) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryKey
          ? { ...cat, categoryId: newCategoryId, categoryName: newCategoryName }
          : cat
      )
    );
    workflow.handleEditField('WORK_CATEGORY');
  };

  const handleDeleteCategory = (categoryKey: string) => {
    setCategories((prev) => prev.filter((cat) => cat.id !== categoryKey));
    workflow.handleEditField('WORK_CATEGORY');
  };

  const handleSubcategoryToggle = (categoryKey: string, subcategoryIds: number[]) => {
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== categoryKey) return cat;

        const existingSubs = cat.subcategories.filter((sub) => subcategoryIds.includes(sub.id));
        const newSubIds = subcategoryIds.filter(
          (id) => !cat.subcategories.some((sub) => sub.id === id)
        );

        const newSubs: WorkflowSubcategory[] = newSubIds.map((id) => ({
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
    workflow.handleEditField('WORK_CATEGORY');
  };

  const handleAddCustomSubcategory = (name: string) => {
    if (!activeCategory) {
      alert('대분류를 먼저 선택해주세요.');
      return;
    }

    const newSubcategoryId = Math.floor(Math.random() * 1000000) + 1000;

    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === activeCategory
          ? {
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
            }
          : cat
      )
    );

    workflow.handleEditField('WORK_CATEGORY');
  };

  const handleAddRiskFactor = (categoryKey: string, subcategoryId: number) => {
    setActiveCategory(categoryKey);
    setActiveSubcategory(subcategoryId);
    setRiskFactorModalOpen(true);
  };

  const handleSelectRiskFactors = (factors: { factor: string; improvement: string }[]) => {
    if (!activeCategory || !activeSubcategory) return;

    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== activeCategory) return cat;

        return {
          ...cat,
          subcategories: cat.subcategories.map((sub) => {
            if (sub.id !== activeSubcategory) return sub;

            const newFactors: RiskFactorLevel[] = factors.map((f) => ({
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

    workflow.handleEditField('WORK_CATEGORY');
  };

  const handleUpdateRiskFactor = (
    categoryKey: string,
    subcategoryId: number,
    factorId: string,
    updatedFactor: RiskFactorLevel
  ) => {
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== categoryKey) return cat;

        return {
          ...cat,
          subcategories: cat.subcategories.map((sub) => {
            if (sub.id !== subcategoryId) return sub;

            return {
              ...sub,
              riskFactors: sub.riskFactors.map((factor) =>
                factor.id === factorId ? updatedFactor : factor
              ),
            };
          }),
        };
      })
    );
    workflow.handleEditField('WORK_CATEGORY');
  };

  const handleDeleteRiskFactor = (categoryKey: string, subcategoryId: number, factorId: string) => {
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== categoryKey) return cat;

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
    workflow.handleEditField('WORK_CATEGORY');
  };

  const handleUpdateSubcategory = (
    categoryKey: string,
    subcategoryId: number,
    updatedSubcategory: WorkflowSubcategory
  ) => {
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== categoryKey) return cat;
        return {
          ...cat,
          subcategories: cat.subcategories.map((sub) =>
            sub.id === subcategoryId ? updatedSubcategory : sub
          ),
        };
      })
    );
    workflow.handleEditField('WORK_CATEGORY');
  };

  // ==================== 제출 처리 ====================

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const basicValidation = validateBasicInfo(getBasicInfoData());
    const categoryValidation = validateWorkCategorySection(categories);

    if (!basicValidation.isValid || !categoryValidation.isValid || !canSubmit) {
      workflow.handleSubmitAttempt(false);
      const errors = [...basicValidation.errors, ...categoryValidation.errors];
      alert(`입력 오류:\n\n${errors.join('\n')}`);
      return;
    }

    const payload: InitialAssessmentPayload = {
      siteName,
      companyName,
      approvalLineId: selectedApprovalLine?.id || null,
      workPeriodStart,
      workPeriodEnd,
      riskMethod: 'LEVEL',
      categories: categories.map((cat) => ({
        id: cat.id,
        categoryId: cat.categoryId,
        categoryName: cat.categoryName,
        subcategories: cat.subcategories,
      })),
    };

    onSubmit(payload);
  };

  // ==================== UI ====================

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Section 1: 기본 정보 */}
        <div id="section-BASIC_INFO">
          <WorkflowSection
            sectionNumber={1}
            title={WORKFLOW_META.BASIC_INFO.title}
            description={WORKFLOW_META.BASIC_INFO.description}
            state={workflow.sections.BASIC_INFO}
            isExpanded={workflow.isSectionExpanded('BASIC_INFO')}
            onHeaderClick={() => workflow.handleSectionClick('BASIC_INFO')}
            onPrevClick={null}
            onNextClick={handleBasicInfoNext}
          >
            <BasicInfoSection
              siteName={siteName}
              companyName={companyName}
              teamId={teamId}
              teams={teams}
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
              onApprovalLineChange={() => {
                setApprovalModalOpen(true);
                workflow.handleEditField('BASIC_INFO');
              }}
              onDateChange={(field, value) => {
                if (field === 'start') setWorkPeriodStart(value);
                else setWorkPeriodEnd(value);
                workflow.handleEditField('BASIC_INFO');
              }}
              onTeamChange={(value) => {
                setTeamId(value);
                workflow.handleEditField('BASIC_INFO');
              }}
              compact
              embedded
              hideSectionTitle
            />

            {/* 위험성 산정 방식 안내 */}
            <div className="mt-3 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2">
              <p className="text-xs font-semibold text-orange-700">위험성 산정 방식</p>
              <p className="mt-0.5 text-xs text-orange-700/80">
                {type === 'initial' ? '최초' : '정기'} 평가는 상중하 방식으로 고정됩니다.
              </p>
            </div>
          </WorkflowSection>
        </div>

        {/* Section 2: 작업 공종 */}
        <div id="section-WORK_CATEGORY">
          <WorkflowSection
            sectionNumber={2}
            title={WORKFLOW_META.WORK_CATEGORY.title}
            description={WORKFLOW_META.WORK_CATEGORY.description}
            state={workflow.sections.WORK_CATEGORY}
            isExpanded={workflow.isSectionExpanded('WORK_CATEGORY')}
            onHeaderClick={() => workflow.handleSectionClick('WORK_CATEGORY')}
            onPrevClick={() => {
              if (!workflow.isSectionExpanded('BASIC_INFO')) {
                workflow.handleSectionClick('BASIC_INFO');
              }
              workflow.handleEditField('BASIC_INFO');
              setTimeout(() => scrollToSection('BASIC_INFO'), 100);
            }}
            onNextClick={handleWorkCategoryNext}
          >
            <div className="space-y-4">
              {categories.map((category, index) => (
                <OccasionalCategoryItem
                  key={category.id}
                  categoryId={category.categoryId}
                  categoryName={category.categoryName}
                  subcategories={category.subcategories as any}
                  riskMethod="LEVEL"
                  onCategoryChange={(catId, catName) =>
                    handleCategoryChange(category.id, catId, catName)
                  }
                  onCategoryClear={() => handleCategoryChange(category.id, null, '')}
                  onSubcategoryToggle={(ids) => handleSubcategoryToggle(category.id, ids)}
                  onAddCustomSubcategory={() => {
                    setActiveCategory(category.id);
                    setSubcategoryModalOpen(true);
                  }}
                  onAddRiskFactor={(subId) => handleAddRiskFactor(category.id, subId)}
                  onUpdateRiskFactor={(subId, factorId, updatedFactor) =>
                    handleUpdateRiskFactor(category.id, subId, factorId, updatedFactor as any)
                  }
                  onDeleteRiskFactor={(subId, factorId) =>
                    handleDeleteRiskFactor(category.id, subId, factorId)
                  }
                  onSearchRiskFactor={(subId) => handleAddRiskFactor(category.id, subId)}
                  onUpdateSubcategory={(subId, updatedSub) =>
                    handleUpdateSubcategory(category.id, subId, updatedSub as any)
                  }
                  onDelete={() => handleDeleteCategory(category.id)}
                  index={index}
                  excludedCategoryIds={getExcludedCategoryIds(categories as any, category.id)}
                  excludedSubcategoryIds={getExcludedSubcategoryIds(category as any)}
                  showActionFields={false}
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
          </WorkflowSection>
        </div>

        {/* 액션 버튼 */}
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
            disabled={!canSubmit}
            className="px-8 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            만들기
          </button>
        </div>
      </form>

      {/* 소분류 추가 모달 */}
      <SubcategoryAddModal
        isOpen={subcategoryModalOpen}
        onClose={() => setSubcategoryModalOpen(false)}
        onAdd={handleAddCustomSubcategory}
      />

      {/* 위험요인 선택 모달 */}
      <RiskFactorSelectModal
        isOpen={riskFactorModalOpen}
        onClose={() => setRiskFactorModalOpen(false)}
        categoryId={categories.find((c) => c.id === activeCategory)?.categoryId || 0}
        subcategoryId={activeSubcategory || 0}
        onSelect={handleSelectRiskFactors}
        initialMode={
          categories
            .find((c) => c.id === activeCategory)
            ?.subcategories.find((s) => s.id === activeSubcategory)?.isCustom
            ? 'direct'
            : 'search'
        }
        isCustomSubcategory={
          categories
            .find((c) => c.id === activeCategory)
            ?.subcategories.find((s) => s.id === activeSubcategory)?.isCustom || false
        }
        existingFactors={usedRiskFactors}
      />

      {/* 결재라인 선택 모달 */}
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
          navigate('/settings', {
            state: { tab: 'approval-lines', openModal: 'add' },
          });
        }}
      />

      {/* 맨 위로 버튼 */}
      <ScrollToTop />
    </>
  );
}

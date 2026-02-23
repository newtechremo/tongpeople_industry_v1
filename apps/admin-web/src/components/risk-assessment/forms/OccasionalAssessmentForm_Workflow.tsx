/**
 * 수시 위험성평가 폼 - 워크플로우 버전
 *
 * 순차적 작성 방식:
 * 1. 기본 정보
 * 2. 수시 평가 정보
 * 3. 위험성 산정 방식
 * 4. 작업 공종
 *
 * 아코디언 순차 확장 + 섹션 잠금 구조
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import BasicInfoSection from '@/pages/risk-assessment/components/BasicInfoSection';
import OccasionalCategoryItem from '@/pages/risk-assessment/components/OccasionalCategoryItem';
import RiskMethodSelector from './components/RiskMethodSelector';
import WorkflowSection from './components/WorkflowSection';
import ScrollToTop from './components/ScrollToTop';
import SubcategoryAddModal from '@/pages/risk-assessment/modals/SubcategoryAddModal';
import RiskFactorSelectModal from '@/pages/risk-assessment/modals/RiskFactorSelectModal';
import ApprovalLineSelectModal from '@/pages/risk-assessment/modals/ApprovalLineSelectModal';
import { useApprovalLines } from '@/stores/approvalLinesStore';
import { getActiveTeams } from '@/mocks/teams';
import { validateOccasionalAssessment } from '../validation/occasional';
import { useWorkflow, SECTION_METADATA } from '../hooks/useWorkflow';
import { useAutoScroll } from '../hooks/useAutoScroll';
import {
  validateBasicInfo,
  validateOccasionalInfo,
  validateRiskMethod,
  validateWorkCategory,
} from '../validation/workflowValidation';
import {
  syncAllRiskFactorsWorkPeriod,
  resetAllRiskFactorsForMethodChange,
  shouldRevalidateWorkPeriod,
} from '../utils/invalidation';
import type {
  RiskMethod,
  OccasionalRiskFactor,
  OccasionalAssessmentPayload,
  RiskFactorLevel,
  RiskFactorFrequencyIntensity,
} from '../types/occasional';
import {
  generateId,
  formatDateInputValue,
  addMonths,
} from '../types/common';

interface OccasionalSubcategory {
  id: number;
  name: string;
  isCustom?: boolean;
  riskFactors: OccasionalRiskFactor[];
  actionDate: string;
  actionAssigneeIds: string[];
  actionConfirmerIds: string[];
  reviewComments?: string[];
}

interface OccasionalCategory {
  id: string;
  categoryId: number | null;
  categoryName: string;
  subcategories: OccasionalSubcategory[];
}

interface Props {
  onSubmit: (data: OccasionalAssessmentPayload) => void;
  onCancel: () => void;
  onProgressChange?: (completed: number, total: number) => void;
}

export default function OccasionalAssessmentForm({
  onSubmit,
  onCancel,
  onProgressChange,
}: Props) {
  const navigate = useNavigate();
  const { today, oneMonthLater } = useMemo(() => {
    const base = new Date();
    return {
      today: formatDateInputValue(base),
      oneMonthLater: formatDateInputValue(addMonths(base, 1)),
    };
  }, []);

  // ==================== Workflow 상태 ====================
  const workflow = useWorkflow();
  const { scrollToSection } = useAutoScroll();

  useEffect(() => {
    onProgressChange?.(workflow.completedCount, workflow.totalSections);
  }, [workflow.completedCount, workflow.totalSections, onProgressChange]);

  // ==================== Form 데이터 ====================

  // 기본 정보
  const [siteName] = useState('통사통사현장');
  const [companyName] = useState('(주)통하는사람들');
  const [teamId, setTeamId] = useState<string>('all');
  const [workPeriodStart, setWorkPeriodStart] = useState(today);
  const [workPeriodEnd, setWorkPeriodEnd] = useState(oneMonthLater);

  // 수시 평가 특화 필드
  const [includeTriggerInfo, setIncludeTriggerInfo] = useState(false);
  const [triggerReason, setTriggerReason] = useState('');
  const [triggerDate, setTriggerDate] = useState(today);
  const [riskMethod, setRiskMethod] = useState<RiskMethod>('LEVEL');

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

  // Categories (3단계 구조)
  const [categories, setCategories] = useState<OccasionalCategory[]>([]);

  // 모달 상태
  const [subcategoryModalOpen, setSubcategoryModalOpen] = useState(false);
  const [riskFactorModalOpen, setRiskFactorModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeSubcategory, setActiveSubcategory] = useState<number | null>(null);

  // ==================== 검증 함수 ====================

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

  const getOccasionalInfoData = useCallback(() => {
    return {
      includeTriggerInfo,
      triggerDate,
      triggerReason,
    };
  }, [includeTriggerInfo, triggerDate, triggerReason]);

  const getRiskMethodData = useCallback(() => {
    return {
      riskMethod,
    };
  }, [riskMethod]);

  const getWorkCategoryData = useCallback(() => {
    return {
      riskMethod,
      categories,
    };
  }, [riskMethod, categories]);

  // ==================== Workflow 핸들러 ====================

  const handleBasicInfoNext = () => {
    const basicValidation = validateBasicInfo(getBasicInfoData());
    const occasionalValidation = validateOccasionalInfo(getOccasionalInfoData());
    const isValid = basicValidation.isValid && occasionalValidation.isValid;
    workflow.handleNext('BASIC_INFO', isValid);

    if (!isValid) {
      const allErrors = [...basicValidation.errors, ...occasionalValidation.errors];
      alert(`입력 오류:\n\n${allErrors.join('\n')}`);
    } else {
      setTimeout(() => scrollToSection('RISK_METHOD'), 100);
    }
  };

  const handleRiskMethodNext = () => {
    const validation = validateRiskMethod(getRiskMethodData());
    workflow.handleNext('RISK_METHOD', validation.isValid);

    if (!validation.isValid) {
      alert(`입력 오류:\n\n${validation.errors.join('\n')}`);
    } else {
      setTimeout(() => scrollToSection('WORK_CATEGORY'), 100);
    }
  };

  const handleWorkCategoryNext = () => {
    const validation = validateWorkCategory(getWorkCategoryData());
    workflow.handleNext('WORK_CATEGORY', validation.isValid);

    if (!validation.isValid) {
      alert(`입력 오류:\n\n${validation.errors.join('\n')}`);
    }
  };

  // ==================== 중복 방지: 이미 사용된 항목 추적 ====================

  // 이미 사용된 대분류 ID 목록
  const usedCategoryIds = useMemo(() => {
    return categories
      .filter((cat) => cat.categoryId !== null)
      .map((cat) => cat.categoryId as number);
  }, [categories]);

  // 이미 사용된 소분류 ID 목록 (모든 대분류 통합)
  const usedSubcategoryIds = useMemo(() => {
    const ids = new Set<number>();
    categories.forEach((cat) => {
      cat.subcategories.forEach((sub) => {
        ids.add(sub.id);
      });
    });
    return Array.from(ids);
  }, [categories]);

  // 이미 사용된 위험요인 텍스트 목록 (모든 소분류 통합)
  const usedRiskFactors = useMemo(() => {
    const factors = new Set<string>();
    categories.forEach((cat) => {
      cat.subcategories.forEach((sub) => {
        sub.riskFactors.forEach((factor) => {
          factors.add(factor.factor);
        });
      });
    });
    return Array.from(factors);
  }, [categories]);

  // ==================== 필드 변경 핸들러 (무효화 규칙 적용) ====================

  const handleWorkPeriodStartChange = (newStart: string) => {
    const oldStart = workPeriodStart;
    setWorkPeriodStart(newStart);

    // 작업기간 변경 시 위험요인 동기화
    if (shouldRevalidateWorkPeriod(oldStart, workPeriodEnd, newStart, workPeriodEnd)) {
      setCategories((prev) => syncAllRiskFactorsWorkPeriod(prev, newStart, workPeriodEnd));
      // WORK_CATEGORY 섹션을 active로 변경 (재검증 필요)
      if (workflow.sections.WORK_CATEGORY === 'completed') {
        workflow.handleEditField('WORK_CATEGORY');
      }
    }
  };

  const handleWorkPeriodEndChange = (newEnd: string) => {
    const oldEnd = workPeriodEnd;
    setWorkPeriodEnd(newEnd);

    if (shouldRevalidateWorkPeriod(workPeriodStart, oldEnd, workPeriodStart, newEnd)) {
      setCategories((prev) => syncAllRiskFactorsWorkPeriod(prev, workPeriodStart, newEnd));
      if (workflow.sections.WORK_CATEGORY === 'completed') {
        workflow.handleEditField('WORK_CATEGORY');
      }
    }
  };

  const handleRiskMethodChange = (newMethod: RiskMethod) => {
    const oldMethod = riskMethod;
    setRiskMethod(newMethod);

    // 방식 변경 시 위험요인 필드 초기화
    if (oldMethod !== newMethod && categories.length > 0) {
      const confirmed = confirm(
        '위험성 산정 방식을 변경하면 기존 위험요인의 평가 데이터가 초기화됩니다. 계속하시겠습니까?'
      );

      if (confirmed) {
        setCategories((prev) => resetAllRiskFactorsForMethodChange(prev, newMethod));
        workflow.handleRiskMethodChanged();
      } else {
        // 변경 취소
        setRiskMethod(oldMethod);
      }
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
    setCategories([
      ...categories,
      {
        id: generateId(),
        categoryId: null,
        categoryName: '',
        subcategories: [],
      },
    ]);
    // WORK_CATEGORY 편집 모드로 전환
    workflow.handleEditField('WORK_CATEGORY');
  };

  const handleCategoryChange = (
    categoryId: string,
    newCategoryId: number,
    newCategoryName: string
  ) => {
    setCategories(
      categories.map((cat) =>
        cat.id === categoryId
          ? { ...cat, categoryId: newCategoryId, categoryName: newCategoryName }
          : cat
      )
    );
    workflow.handleEditField('WORK_CATEGORY');
  };

  const handleDeleteCategory = (categoryId: string) => {
    setCategories(categories.filter((cat) => cat.id !== categoryId));
    workflow.handleEditField('WORK_CATEGORY');
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

        const newSubs: OccasionalSubcategory[] = newSubIds.map((id) => ({
          id,
          name: getMockSubcategoryName(id),
          riskFactors: [],
          actionDate: '',
          actionAssigneeIds: [],
          actionConfirmerIds: [],
          reviewComments: [],
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
              actionDate: '',
              actionAssigneeIds: [],
              actionConfirmerIds: [],
              reviewComments: [],
            },
          ],
        };
      })
    );
    workflow.handleEditField('WORK_CATEGORY');
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

            const newFactors: OccasionalRiskFactor[] = factors.map((f) => {
              const baseFactor = {
                id: generateId(),
                factor: f.factor,
                improvement: f.improvement,
                workPeriodStart,
                workPeriodEnd,
              };

              return riskMethod === 'LEVEL'
                ? ({ ...baseFactor, level: null } as RiskFactorLevel)
                : ({
                    ...baseFactor,
                    beforeFrequency: null,
                    beforeIntensity: null,
                    beforeRiskScore: null,
                    beforeGradeLevel: null,
                    afterFrequency: null,
                    afterIntensity: null,
                    afterRiskScore: null,
                    afterGradeLevel: null,
                  } as RiskFactorFrequencyIntensity);
            });

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
    categoryId: string,
    subcategoryId: number,
    factorId: string,
    updatedFactor: OccasionalRiskFactor
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
                factor.id === factorId ? updatedFactor : factor
              ),
            };
          }),
        };
      })
    );
    workflow.handleEditField('WORK_CATEGORY');
  };

  const handleDeleteRiskFactor = (
    categoryId: string,
    subcategoryId: number,
    factorId: string
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
              riskFactors: sub.riskFactors.filter((factor) => factor.id !== factorId),
            };
          }),
        };
      })
    );
    workflow.handleEditField('WORK_CATEGORY');
  };

  const handleUpdateSubcategory = (
    categoryId: string,
    subcategoryId: number,
    updatedSubcategory: OccasionalSubcategory
  ) => {
    setCategories(
      categories.map((cat) => {
        if (cat.id !== categoryId) return cat;

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

    const payload: OccasionalAssessmentPayload = {
      siteName,
      companyName,
      teamId,
      approvalLineId: selectedApprovalLine?.id || null,
      workPeriodStart,
      workPeriodEnd,
      triggerReason: includeTriggerInfo ? triggerReason : '',
      triggerDate: includeTriggerInfo ? triggerDate : today,
      riskMethod,
      categories: categories.map((cat) => ({
        id: cat.id,
        categoryId: cat.categoryId,
        categoryName: cat.categoryName,
        subcategories: cat.subcategories,
      })),
    };

    const validation = validateOccasionalAssessment(payload);

    if (!validation.isValid) {
      workflow.handleSubmitAttempt(false);
      alert(`입력 오류:\n\n${validation.errors.join('\n')}`);
      return;
    }

    onSubmit(payload);
  };

  // ==================== UI ====================

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Section 1: 기본 정보 */}
        <div id="section-BASIC_INFO">
          <WorkflowSection
            sectionNumber={1}
            title={SECTION_METADATA.BASIC_INFO.title}
            description={SECTION_METADATA.BASIC_INFO.description}
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
              onApprovalLineChange={() => setApprovalModalOpen(true)}
              onDateChange={(field, value) => {
                if (field === 'start') handleWorkPeriodStartChange(value);
                else handleWorkPeriodEndChange(value);
              }}
              onTeamChange={setTeamId}
              compact
              embedded
              hideSectionTitle
            />

            <div className="border-t border-gray-200 pt-3 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-700">수시 평가 정보</h4>
                <div className="flex items-center gap-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="includeTriggerInfo"
                      checked={!includeTriggerInfo}
                      onChange={() => {
                        setIncludeTriggerInfo(false);
                        workflow.handleEditField('BASIC_INFO');
                      }}
                      className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-xs font-medium text-slate-700">미포함</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="includeTriggerInfo"
                      checked={includeTriggerInfo}
                      onChange={() => {
                        setIncludeTriggerInfo(true);
                        workflow.handleEditField('BASIC_INFO');
                      }}
                      className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-xs font-medium text-slate-700">포함</span>
                  </label>
                </div>
              </div>

              {includeTriggerInfo ? (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-[220px,1fr]">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      발생일 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={triggerDate}
                      onChange={(e) => {
                        setTriggerDate(e.target.value);
                        workflow.handleEditField('BASIC_INFO');
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      수시 평가 사유 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={triggerReason}
                      onChange={(e) => {
                        setTriggerReason(e.target.value);
                        workflow.handleEditField('BASIC_INFO');
                      }}
                      placeholder="예: 신규 기계 도입, 작업방법 변경, 산업재해 발생"
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="py-2 px-3 rounded-lg bg-gray-50 border border-gray-200">
                  <p className="text-xs text-slate-500">
                    수시 평가 정보 미포함 (발생일/사유 입력 생략)
                  </p>
                </div>
              )}
            </div>
          </WorkflowSection>
        </div>

        {/* Section 2: 위험성 산정 방식 */}
        <div id="section-RISK_METHOD">
          <WorkflowSection
            sectionNumber={2}
            title={SECTION_METADATA.RISK_METHOD.title}
            description={SECTION_METADATA.RISK_METHOD.description}
            state={workflow.sections.RISK_METHOD}
            isExpanded={workflow.isSectionExpanded('RISK_METHOD')}
            onHeaderClick={() => workflow.handleSectionClick('RISK_METHOD')}
            onPrevClick={() => {
              workflow.handlePrev('RISK_METHOD');
              setTimeout(() => scrollToSection('BASIC_INFO'), 100);
            }}
            onNextClick={handleRiskMethodNext}
          >
            <RiskMethodSelector value={riskMethod} onChange={handleRiskMethodChange} />
          </WorkflowSection>
        </div>

        {/* Section 3: 작업 공종 */}
        <div id="section-WORK_CATEGORY">
          <WorkflowSection
            sectionNumber={3}
            title={SECTION_METADATA.WORK_CATEGORY.title}
            description={SECTION_METADATA.WORK_CATEGORY.description}
            state={workflow.sections.WORK_CATEGORY}
            isExpanded={workflow.isSectionExpanded('WORK_CATEGORY')}
            onHeaderClick={() => workflow.handleSectionClick('WORK_CATEGORY')}
            onPrevClick={() => {
              workflow.handlePrev('WORK_CATEGORY');
              setTimeout(() => scrollToSection('RISK_METHOD'), 100);
            }}
            onNextClick={handleWorkCategoryNext}
          >
            <div className="space-y-4">
              {categories.map((category, index) => (
                <OccasionalCategoryItem
                  key={category.id}
                  categoryId={category.categoryId}
                  categoryName={category.categoryName}
                  subcategories={category.subcategories}
                  riskMethod={riskMethod}
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
                  onUpdateRiskFactor={(subId, factorId, updatedFactor) =>
                    handleUpdateRiskFactor(category.id, subId, factorId, updatedFactor)
                  }
                  onDeleteRiskFactor={(subId, factorId) =>
                    handleDeleteRiskFactor(category.id, subId, factorId)
                  }
                  onSearchRiskFactor={(subId) => handleAddRiskFactor(category.id, subId)}
                  onUpdateSubcategory={(subId, updatedSub) =>
                    handleUpdateSubcategory(category.id, subId, updatedSub as OccasionalSubcategory)
                  }
                  onDelete={() => handleDeleteCategory(category.id)}
                  index={index}
                  excludedCategoryIds={usedCategoryIds}
                  excludedSubcategoryIds={usedSubcategoryIds}
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
            disabled={!workflow.canSubmit}
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

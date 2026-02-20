/**
 * 수시 위험성평가 워크플로우 상태 관리
 *
 * 아코디언 순차 확장 + 섹션 잠금 구조
 * 상태 전이 문서: docs/risk-assessment/occasional-create-workflow-state-machine.md
 */

import { useReducer, useCallback } from 'react';

// ==================== 타입 정의 ====================

/**
 * 섹션 ID
 */
export type SectionId = 'BASIC_INFO' | 'OCCASIONAL_INFO' | 'RISK_METHOD' | 'WORK_CATEGORY';

/**
 * 섹션 상태
 */
export type SectionState = 'locked' | 'active' | 'completed' | 'error';

/**
 * 섹션 메타데이터
 */
export interface SectionMeta {
  id: SectionId;
  title: string;
  description: string;
  order: number;
}

/**
 * 워크플로우 상태
 */
export interface WorkflowState {
  sections: Record<SectionId, SectionState>;
  expandedSections: Set<SectionId>;
  currentSection: SectionId | null;
  completedCount: number;
}

/**
 * 워크플로우 액션
 */
export type WorkflowAction =
  | { type: 'INIT_FORM' }
  | { type: 'CLICK_NEXT'; section: SectionId; isValid: boolean }
  | { type: 'CLICK_PREV'; section: SectionId }
  | { type: 'CLICK_SECTION'; section: SectionId }
  | { type: 'EDIT_FIELD'; section: SectionId }
  | { type: 'AUTO_VALIDATE'; section: SectionId; isValid: boolean }
  | { type: 'SUBMIT_ATTEMPT'; allValid: boolean }
  | { type: 'RISK_METHOD_CHANGED' }
  | { type: 'SET_ERROR'; section: SectionId }
  | { type: 'CLEAR_ERROR'; section: SectionId };

// ==================== 섹션 메타데이터 ====================

export const SECTION_METADATA: Record<SectionId, SectionMeta> = {
  BASIC_INFO: {
    id: 'BASIC_INFO',
    title: '기본 정보',
    description: '현장명, 회사명, 작업기간 등',
    order: 1,
  },
  OCCASIONAL_INFO: {
    id: 'OCCASIONAL_INFO',
    title: '수시 평가 정보',
    description: '발생일, 수시 평가 사유 (선택)',
    order: 2,
  },
  RISK_METHOD: {
    id: 'RISK_METHOD',
    title: '위험성 산정 방식',
    description: '상중하 또는 빈도강도',
    order: 3,
  },
  WORK_CATEGORY: {
    id: 'WORK_CATEGORY',
    title: '작업 공종',
    description: '공종, 소분류, 위험요인 입력',
    order: 4,
  },
};

/**
 * 섹션 순서 배열
 */
export const SECTION_ORDER: SectionId[] = [
  'BASIC_INFO',
  'OCCASIONAL_INFO',
  'RISK_METHOD',
  'WORK_CATEGORY',
];

// ==================== 초기 상태 ====================

const initialState: WorkflowState = {
  sections: {
    BASIC_INFO: 'active',
    OCCASIONAL_INFO: 'locked',
    RISK_METHOD: 'locked',
    WORK_CATEGORY: 'locked',
  },
  expandedSections: new Set(['BASIC_INFO']),
  currentSection: 'BASIC_INFO',
  completedCount: 0,
};

// ==================== 헬퍼 함수 ====================

/**
 * 다음 섹션 가져오기
 */
function getNextSection(current: SectionId): SectionId | null {
  const currentIndex = SECTION_ORDER.indexOf(current);
  if (currentIndex === -1 || currentIndex === SECTION_ORDER.length - 1) {
    return null;
  }
  return SECTION_ORDER[currentIndex + 1];
}

/**
 * 이전 섹션 가져오기
 */
function getPrevSection(current: SectionId): SectionId | null {
  const currentIndex = SECTION_ORDER.indexOf(current);
  if (currentIndex <= 0) {
    return null;
  }
  return SECTION_ORDER[currentIndex - 1];
}

/**
 * 완료된 섹션 개수 계산
 */
function countCompleted(sections: Record<SectionId, SectionState>): number {
  return Object.values(sections).filter((state) => state === 'completed').length;
}

// ==================== Reducer ====================

function workflowReducer(state: WorkflowState, action: WorkflowAction): WorkflowState {
  switch (action.type) {
    case 'INIT_FORM': {
      return initialState;
    }

    case 'CLICK_NEXT': {
      const { section, isValid } = action;

      // 유효하지 않으면 error 상태로
      if (!isValid) {
        return {
          ...state,
          sections: {
            ...state.sections,
            [section]: 'error',
          },
        };
      }

      // 현재 섹션 completed로 변경
      const nextSection = getNextSection(section);
      if (!nextSection) {
        // 마지막 섹션
        return {
          ...state,
          sections: {
            ...state.sections,
            [section]: 'completed',
          },
          completedCount: countCompleted({
            ...state.sections,
            [section]: 'completed',
          }),
        };
      }

      // 다음 섹션 활성화 및 확장
      const newExpandedSections = new Set(state.expandedSections);
      newExpandedSections.add(nextSection);

      return {
        ...state,
        sections: {
          ...state.sections,
          [section]: 'completed',
          [nextSection]: 'active',
        },
        expandedSections: newExpandedSections,
        currentSection: nextSection,
        completedCount: countCompleted({
          ...state.sections,
          [section]: 'completed',
        }),
      };
    }

    case 'CLICK_PREV': {
      const { section } = action;
      const prevSection = getPrevSection(section);
      if (!prevSection) return state;

      const newExpandedSections = new Set(state.expandedSections);
      newExpandedSections.add(prevSection);

      return {
        ...state,
        sections: {
          ...state.sections,
          [prevSection]: 'active',
        },
        expandedSections: newExpandedSections,
        currentSection: prevSection,
      };
    }

    case 'CLICK_SECTION': {
      const { section } = action;
      const sectionState = state.sections[section];

      // locked 섹션은 클릭 불가
      if (sectionState === 'locked') {
        return state;
      }

      // 확장/축소 토글
      const newExpandedSections = new Set(state.expandedSections);
      if (newExpandedSections.has(section)) {
        newExpandedSections.delete(section);
      } else {
        newExpandedSections.add(section);
      }

      // completed 섹션을 클릭하면 active로 변경 (수정 모드)
      if (sectionState === 'completed') {
        return {
          ...state,
          sections: {
            ...state.sections,
            [section]: 'active',
          },
          expandedSections: newExpandedSections,
          currentSection: section,
          completedCount: countCompleted({
            ...state.sections,
            [section]: 'active',
          }),
        };
      }

      return {
        ...state,
        expandedSections: newExpandedSections,
        currentSection: section,
      };
    }

    case 'EDIT_FIELD': {
      const { section } = action;
      // 편집 시작하면 해당 섹션을 active로
      if (state.sections[section] === 'completed') {
        return {
          ...state,
          sections: {
            ...state.sections,
            [section]: 'active',
          },
          currentSection: section,
          completedCount: countCompleted({
            ...state.sections,
            [section]: 'active',
          }),
        };
      }
      return state;
    }

    case 'AUTO_VALIDATE': {
      const { section, isValid } = action;
      const newState = isValid ? 'completed' : 'error';

      return {
        ...state,
        sections: {
          ...state.sections,
          [section]: newState,
        },
        completedCount: countCompleted({
          ...state.sections,
          [section]: newState,
        }),
      };
    }

    case 'SUBMIT_ATTEMPT': {
      const { allValid } = action;
      if (allValid) {
        return state;
      }

      // 첫 번째 error/미완료 섹션 찾기
      const firstInvalid = SECTION_ORDER.find(
        (id) => state.sections[id] !== 'completed'
      );

      if (!firstInvalid) return state;

      const newExpandedSections = new Set(state.expandedSections);
      newExpandedSections.add(firstInvalid);

      return {
        ...state,
        sections: {
          ...state.sections,
          [firstInvalid]: 'error',
        },
        expandedSections: newExpandedSections,
        currentSection: firstInvalid,
      };
    }

    case 'RISK_METHOD_CHANGED': {
      // WORK_CATEGORY를 active로 변경 (재입력 필요)
      if (state.sections.WORK_CATEGORY === 'completed') {
        return {
          ...state,
          sections: {
            ...state.sections,
            WORK_CATEGORY: 'active',
          },
          completedCount: countCompleted({
            ...state.sections,
            WORK_CATEGORY: 'active',
          }),
        };
      }
      return state;
    }

    case 'SET_ERROR': {
      const { section } = action;
      return {
        ...state,
        sections: {
          ...state.sections,
          [section]: 'error',
        },
      };
    }

    case 'CLEAR_ERROR': {
      const { section } = action;
      if (state.sections[section] === 'error') {
        return {
          ...state,
          sections: {
            ...state.sections,
            [section]: 'active',
          },
        };
      }
      return state;
    }

    default:
      return state;
  }
}

// ==================== Custom Hook ====================

export function useWorkflow() {
  const [state, dispatch] = useReducer(workflowReducer, initialState);

  const handleNext = useCallback(
    (section: SectionId, isValid: boolean) => {
      dispatch({ type: 'CLICK_NEXT', section, isValid });
    },
    []
  );

  const handlePrev = useCallback((section: SectionId) => {
    dispatch({ type: 'CLICK_PREV', section });
  }, []);

  const handleSectionClick = useCallback((section: SectionId) => {
    dispatch({ type: 'CLICK_SECTION', section });
  }, []);

  const handleEditField = useCallback((section: SectionId) => {
    dispatch({ type: 'EDIT_FIELD', section });
  }, []);

  const handleAutoValidate = useCallback((section: SectionId, isValid: boolean) => {
    dispatch({ type: 'AUTO_VALIDATE', section, isValid });
  }, []);

  const handleSubmitAttempt = useCallback((allValid: boolean) => {
    dispatch({ type: 'SUBMIT_ATTEMPT', allValid });
  }, []);

  const handleRiskMethodChanged = useCallback(() => {
    dispatch({ type: 'RISK_METHOD_CHANGED' });
  }, []);

  const setError = useCallback((section: SectionId) => {
    dispatch({ type: 'SET_ERROR', section });
  }, []);

  const clearError = useCallback((section: SectionId) => {
    dispatch({ type: 'CLEAR_ERROR', section });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'INIT_FORM' });
  }, []);

  const isSectionExpanded = useCallback(
    (section: SectionId) => {
      return state.expandedSections.has(section);
    },
    [state.expandedSections]
  );

  const canSubmit = state.completedCount === SECTION_ORDER.length;

  return {
    state,
    sections: state.sections,
    currentSection: state.currentSection,
    completedCount: state.completedCount,
    totalSections: SECTION_ORDER.length,
    canSubmit,
    isSectionExpanded,
    handleNext,
    handlePrev,
    handleSectionClick,
    handleEditField,
    handleAutoValidate,
    handleSubmitAttempt,
    handleRiskMethodChanged,
    setError,
    clearError,
    reset,
  };
}

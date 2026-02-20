/**
 * 워크플로우 아코디언 섹션 컴포넌트
 *
 * 상태 기반 UI:
 * - locked: 잠김 (이전 섹션 미완료)
 * - active: 현재 작성 중
 * - completed: 완료 (재편집 가능)
 * - error: 오류 있음
 */

import { ReactNode } from 'react';
import { ChevronDown, Lock, CheckCircle, AlertCircle, Circle } from 'lucide-react';
import type { SectionState } from '../../hooks/useWorkflow';

interface WorkflowSectionProps {
  /** 섹션 번호 (1, 2, 3, 4) */
  sectionNumber: number;
  /** 섹션 제목 */
  title: string;
  /** 섹션 설명 */
  description: string;
  /** 섹션 상태 */
  state: SectionState;
  /** 확장 여부 */
  isExpanded: boolean;
  /** 헤더 클릭 핸들러 */
  onHeaderClick: () => void;
  /** 이전 버튼 핸들러 (첫 섹션이면 null) */
  onPrevClick: (() => void) | null;
  /** 다음 버튼 핸들러 (마지막 섹션이면 null) */
  onNextClick: (() => void) | null;
  /** 섹션 내용 */
  children: ReactNode;
}

export default function WorkflowSection({
  sectionNumber,
  title,
  description,
  state,
  isExpanded,
  onHeaderClick,
  onPrevClick,
  onNextClick,
  children,
}: WorkflowSectionProps) {
  // 상태별 스타일 정의
  const stateStyles = {
    locked: {
      header: 'bg-gray-100 border-gray-300 cursor-not-allowed',
      badge: 'bg-gray-200 text-gray-600',
      icon: Lock,
      iconColor: 'text-gray-500',
      title: 'text-gray-500',
    },
    active: {
      header: 'bg-orange-50 border-orange-400 cursor-pointer hover:bg-orange-100',
      badge: 'bg-orange-200 text-orange-800',
      icon: Circle,
      iconColor: 'text-orange-600',
      title: 'text-orange-700 font-bold',
    },
    completed: {
      header: 'bg-green-50 border-green-400 cursor-pointer hover:bg-green-100',
      badge: 'bg-green-200 text-green-800',
      icon: CheckCircle,
      iconColor: 'text-green-600',
      title: 'text-green-700',
    },
    error: {
      header: 'bg-red-50 border-red-400 cursor-pointer hover:bg-red-100',
      badge: 'bg-red-200 text-red-800',
      icon: AlertCircle,
      iconColor: 'text-red-600',
      title: 'text-red-700',
    },
  };

  const currentStyle = stateStyles[state];
  const StateIcon = currentStyle.icon;

  // locked 상태에서는 클릭 차단
  const handleHeaderClick = () => {
    if (state === 'locked') return;
    onHeaderClick();
  };

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden transition-all duration-300">
      {/* 섹션 헤더 */}
      <div
        className={`flex items-center justify-between p-4 border-b-2 transition-all duration-200 ${currentStyle.header}`}
        onClick={handleHeaderClick}
        role="button"
        tabIndex={state === 'locked' ? -1 : 0}
        aria-expanded={isExpanded}
        aria-disabled={state === 'locked'}
      >
        <div className="flex items-center gap-4 flex-1">
          {/* 섹션 번호 + 아이콘 */}
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-black ${currentStyle.title}`}>{sectionNumber}</span>
            <StateIcon size={24} className={currentStyle.iconColor} />
          </div>

          {/* 섹션 제목 + 설명 */}
          <div className="flex-1">
            <h3 className={`text-lg font-bold ${currentStyle.title}`}>{title}</h3>
            <p className="text-sm text-slate-500 mt-1">{description}</p>
          </div>
        </div>

        {/* 상태 배지 + 확장 아이콘 */}
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${currentStyle.badge}`}
          >
            {state === 'locked' && '잠김'}
            {state === 'active' && '작성중'}
            {state === 'completed' && '완료'}
            {state === 'error' && '오류'}
          </span>

          {state !== 'locked' && (
            <ChevronDown
              size={24}
              className={`transition-transform duration-300 ${
                isExpanded ? 'rotate-180' : ''
              } ${currentStyle.iconColor}`}
            />
          )}
        </div>
      </div>

      {/* 섹션 바디 (확장 시에만 표시) */}
      {isExpanded && state !== 'locked' && (
        <div className="animate-slideDown">
          {/* 섹션 내용 */}
          <div className="p-6 space-y-4">{children}</div>

          {/* 섹션 푸터 (이전/다음 버튼) */}
          <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
            {onPrevClick ? (
              <button
                type="button"
                onClick={onPrevClick}
                className="px-6 py-2.5 rounded-lg font-medium text-slate-600 bg-white border border-gray-300 hover:bg-gray-100 transition-colors"
              >
                ← 이전
              </button>
            ) : (
              <div />
            )}

            {onNextClick ? (
              <button
                type="button"
                onClick={onNextClick}
                className="px-6 py-2.5 rounded-lg font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all shadow-md"
              >
                다음 →
              </button>
            ) : (
              <div className="px-6 py-2.5 text-sm text-green-600 font-bold">
                ✓ 모든 섹션 작성 완료
              </div>
            )}
          </div>
        </div>
      )}

      {/* locked 상태일 때 안내 메시지 */}
      {state === 'locked' && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            이전 섹션을 완료하면 잠금이 해제됩니다
          </p>
        </div>
      )}
    </div>
  );
}

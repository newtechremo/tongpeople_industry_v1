import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, HelpCircle, FileText, Calendar, RefreshCw, Clock } from 'lucide-react';

/** 위험성평가 유형 */
export type AssessmentType = 'INITIAL' | 'REGULAR' | 'OCCASIONAL' | 'CONTINUOUS';

interface AssessmentTypeOption {
  id: AssessmentType;
  label: string;
  description: string;
  icon: React.ElementType;
  detailInfo?: {
    title: string;
    subtitle: string;
    items: string[];
  };
}

const ASSESSMENT_TYPE_OPTIONS: AssessmentTypeOption[] = [
  {
    id: 'INITIAL',
    label: '최초 위험성평가',
    description: '사업장 최초 시공 시 1회 작성',
    icon: FileText,
    detailInfo: {
      title: '최초 위험성평가란?',
      subtitle: '사업장에서 최초로 공사를 시행할 시 1회에 한해 작성하는 위험성 평가입니다. 기존에 실시한 적이 없는 위험성 평가를 실시합니다.',
      items: [
        '작업대상자 : 현장관리인',
        '위험성평가 대상 : 시공 작업 및 현장 작업',
        '작업 내용에 대한 위험성 평가 실시',
        '작업 공정 / 작업 위험요인 분석',
        '작업 환경 / 장소 위험요인 분석',
        '위험성 수준 상, 중 (위, 위험 관리) 안내',
      ],
    },
  },
  {
    id: 'REGULAR',
    label: '정기 위험성평가',
    description: '월/분기별 정기적으로 작성',
    icon: Calendar,
    detailInfo: {
      title: '정기 위험성평가란?',
      subtitle: '연간계획서 또는 사업장의 공정 시행 기간 내 매분기 1회 이상 정기적으로 시행하는 위험성평가입니다.',
      items: [
        '작업대상자 : 현장관리인',
        '위험성평가 대상 : 시공, 공정',
      ],
    },
  },
  {
    id: 'OCCASIONAL',
    label: '수시 위험성평가',
    description: '작업 변경 또는 위험 발생 시 작성',
    icon: RefreshCw,
    detailInfo: {
      title: '수시 위험성평가란?',
      subtitle: '아래의 경우 작업 변경 또는 사고/재해가 발생할 시 수시로 위험성 평가를 시행합니다. 기존에 시행하던 공정을 변경한 경우 아래의 경우에 해당합니다.',
      items: [
        '작업 변경(장비/방법) 시',
        '위험요인 발견 및 재해 발생 시 재해 재발 방지',
        '정기 위험성 평가 결과 허용 불가능한 위험 발견 시',
        '유해 물질 사용 / 도입 (MSDS 업데이트)',
        '작업 환경 / 장소 변경(이동) 시',
        '위험성 수준 상, 중 (위, 위험 관리) 안내',
      ],
    },
  },
  {
    id: 'CONTINUOUS',
    label: '상시 위험성평가',
    description: '일상적인 위험요인 관리용',
    icon: Clock,
    detailInfo: {
      title: '상시 위험성평가란?',
      subtitle: '일상적으로 반복되는 작업에 대해 지속적으로 위험요인을 관리하는 위험성평가입니다.',
      items: [
        '작업대상자 : 현장 근로자 전체',
        '위험성평가 대상 : 일상 작업',
        '반복 작업에 대한 지속적 모니터링',
      ],
    },
  },
];

interface AssessmentTypeSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: AssessmentType) => void;
}

export default function AssessmentTypeSelectModal({
  isOpen,
  onClose,
  onSelect,
}: AssessmentTypeSelectModalProps) {
  const [selectedType, setSelectedType] = useState<AssessmentType | null>(null);
  const [expandedType, setExpandedType] = useState<AssessmentType | null>(null);

  // 모달 열릴 때 초기화
  useEffect(() => {
    if (isOpen) {
      setSelectedType(null);
      setExpandedType(null);
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!selectedType) {
      return;
    }
    onSelect(selectedType);
    onClose();
  };

  const handleHelpClick = (type: AssessmentType, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedType(expandedType === type ? null : type);
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-slate-800">위험성평가 유형 선택</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-3">
            {ASSESSMENT_TYPE_OPTIONS.map((option) => {
              const isSelected = selectedType === option.id;
              const isExpanded = expandedType === option.id;
              const Icon = option.icon;

              return (
                <div
                  key={option.id}
                  className="relative"
                >
                  <label
                    className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all
                      ${isSelected
                        ? 'border-orange-400 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-200 hover:bg-orange-50/30'
                      }
                      ${isExpanded ? 'rounded-b-none' : ''}`}
                  >
                    {/* Radio button */}
                    <input
                      type="radio"
                      name="assessmentType"
                      value={option.id}
                      checked={isSelected}
                      onChange={() => setSelectedType(option.id)}
                      className="w-5 h-5 text-orange-500 border-gray-300 focus:ring-orange-500"
                    />

                    {/* Icon */}
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-orange-100' : 'bg-gray-100'}`}>
                      <Icon size={20} className={isSelected ? 'text-orange-600' : 'text-slate-500'} />
                    </div>

                    {/* Label */}
                    <span className={`font-medium flex-1 ${isSelected ? 'text-orange-700' : 'text-slate-700'}`}>
                      {option.label}
                    </span>

                    {/* Help icon button */}
                    <button
                      type="button"
                      onClick={(e) => handleHelpClick(option.id, e)}
                      className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <HelpCircle
                        size={18}
                        className={isExpanded ? 'text-orange-500' : 'text-slate-400'}
                      />
                    </button>
                  </label>

                  {/* 카드 내부 상세 설명 영역 */}
                  {isExpanded && option.detailInfo && (
                    <div className={`border-2 border-t-0 rounded-b-xl p-5 bg-gray-50
                      ${isSelected ? 'border-orange-400' : 'border-gray-200'}`}
                    >
                      {/* 제목 */}
                      <h3 className="text-sm font-bold text-orange-600 mb-2">
                        {option.detailInfo.title}
                      </h3>
                      {/* 부제목 */}
                      <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                        {option.detailInfo.subtitle}
                      </p>
                      {/* 항목 리스트 */}
                      <ul className="space-y-1.5">
                        {option.detailInfo.items.map((item, idx) => (
                          <li key={idx} className="text-xs text-slate-700 flex gap-2">
                            <span className="text-orange-500 flex-shrink-0">{idx + 1}.</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-gray-200 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedType}
            className="px-5 py-2.5 rounded-xl font-bold text-white
                       bg-gradient-to-r from-orange-500 to-orange-600
                       hover:from-orange-600 hover:to-orange-700
                       disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed
                       transition-all"
          >
            선택완료
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

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
}

const ASSESSMENT_TYPE_OPTIONS: AssessmentTypeOption[] = [
  {
    id: 'INITIAL',
    label: '최초 위험성평가',
    description: '사업장 최초 시공 시 1회 작성',
    icon: FileText,
  },
  {
    id: 'REGULAR',
    label: '정기 위험성평가',
    description: '월/분기별 정기적으로 작성',
    icon: Calendar,
  },
  {
    id: 'OCCASIONAL',
    label: '수시 위험성평가',
    description: '작업 변경 또는 위험 발생 시 작성',
    icon: RefreshCw,
  },
  {
    id: 'CONTINUOUS',
    label: '상시 위험성평가',
    description: '일상적인 위험요인 관리용',
    icon: Clock,
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
  const [hoveredType, setHoveredType] = useState<AssessmentType | null>(null);

  // 모달 열릴 때 초기화
  useEffect(() => {
    if (isOpen) {
      setSelectedType(null);
      setHoveredType(null);
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!selectedType) {
      return;
    }
    onSelect(selectedType);
    onClose();
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-slate-800">위험성평가 유형 선택</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-3">
          {ASSESSMENT_TYPE_OPTIONS.map((option) => {
            const isSelected = selectedType === option.id;
            const isHovered = hoveredType === option.id;
            const Icon = option.icon;

            return (
              <div
                key={option.id}
                className="relative"
                onMouseEnter={() => setHoveredType(option.id)}
                onMouseLeave={() => setHoveredType(null)}
              >
                <label
                  className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all
                    ${isSelected
                      ? 'border-orange-400 bg-orange-50'
                      : 'border-gray-200 hover:border-orange-200 hover:bg-orange-50/30'
                    }`}
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

                  {/* Help icon with tooltip */}
                  <div className="relative group">
                    <HelpCircle
                      size={18}
                      className="text-slate-400 hover:text-slate-600 cursor-help"
                    />
                    {/* Tooltip */}
                    {isHovered && (
                      <div className="absolute right-0 bottom-full mb-2 w-48 p-2 bg-slate-800 text-white text-xs rounded-lg shadow-lg z-10">
                        {option.description}
                        <div className="absolute right-3 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800" />
                      </div>
                    )}
                  </div>
                </label>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
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

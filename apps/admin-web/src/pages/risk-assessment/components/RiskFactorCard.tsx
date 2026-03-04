/**
 * 위험 요인 카드 - 최초 위험성평가
 *
 * 위험요인, 위험성수준(상/중/하), 개선대책, 작업기간 입력
 */

import { Search, Trash2, Calendar } from 'lucide-react';

interface RiskFactorCardProps {
  factor: string;
  level: 'HIGH' | 'MEDIUM' | 'LOW' | null;
  improvement: string;
  workPeriodStart: string;
  workPeriodEnd: string;
  onChange: (field: string, value: string) => void;
  onDelete: () => void;
  onSearchFactor: () => void;
}

export default function RiskFactorCard({
  factor,
  level,
  improvement,
  workPeriodStart,
  workPeriodEnd,
  onChange,
  onDelete,
  onSearchFactor,
}: RiskFactorCardProps) {
  // 위험도별 색상 매핑
  const getLevelStyles = () => {
    switch (level) {
      case 'HIGH':
        return 'border-red-600 bg-red-50/50';
      case 'MEDIUM':
        return 'border-amber-600 bg-amber-50/50';
      case 'LOW':
        return 'border-green-600 bg-green-50/50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  return (
    <div className={`rounded-xl p-4 space-y-4 ${getLevelStyles()}`}>
      {/* 삭제 버튼 */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onDelete}
          className="flex items-center gap-1 text-base text-red-500 font-medium hover:text-red-600 transition-colors"
        >
          <Trash2 size={16} />
          항목 삭제
        </button>
      </div>

      {/* 위험 요인 */}
      <div>
        <label className="block text-base font-medium text-slate-600 mb-2">
          위험 요인
        </label>
        <div className="relative">
          <input
            type="text"
            value={factor}
            onChange={(e) => onChange('factor', e.target.value)}
            placeholder="위험 요인을 입력하세요..."
            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg text-base focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          />
          <button
            type="button"
            onClick={onSearchFactor}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <Search size={18} />
          </button>
        </div>
      </div>

      {/* 위험성 수준 */}
      <div>
        <div className="flex items-center gap-6">
          <span className="text-base font-medium text-slate-600">위험성 수준</span>

          <div className="flex items-center gap-4">
            {[
              { value: 'HIGH', label: '상' },
              { value: 'MEDIUM', label: '중' },
              { value: 'LOW', label: '하' },
            ].map((option) => (
              <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={`risk-level-${factor}`}
                  value={option.value}
                  checked={level === option.value}
                  onChange={() => onChange('level', option.value)}
                  className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                />
                <span className="text-base text-slate-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* 개선 대책 */}
      <div>
        <label className="block text-base font-medium text-slate-600 mb-2">
          개선 대책
        </label>
        <input
          type="text"
          value={improvement}
          onChange={(e) => onChange('improvement', e.target.value)}
          placeholder="개선 대책을 입력하세요..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
        />
      </div>

      {/* 작업 기간 */}
      <div>
        <label className="block text-base font-medium text-slate-600 mb-2">
          작업 기간
        </label>
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <input
              type="date"
              value={workPeriodStart}
              onChange={(e) => onChange('workPeriodStart', e.target.value)}
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg text-base focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          <span className="text-slate-500">~</span>
          <div className="relative flex-1">
            <input
              type="date"
              value={workPeriodEnd}
              onChange={(e) => onChange('workPeriodEnd', e.target.value)}
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg text-base focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}

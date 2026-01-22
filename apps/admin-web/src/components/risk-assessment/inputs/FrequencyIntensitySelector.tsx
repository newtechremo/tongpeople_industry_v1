/**
 * 빈도/강도 선택 UI
 *
 * 위험요인별 빈도(1-4)와 강도(1-5) 선택
 */

import { FREQUENCY_LEVELS, SEVERITY_LEVELS, calculateRiskGrade } from '@tong-pass/shared/risk-assessment/recommender';

interface Props {
  frequency: number;
  severity: number;
  onChange: (field: 'frequency' | 'severity', value: number) => void;
}

export default function FrequencyIntensitySelector({
  frequency,
  severity,
  onChange,
}: Props) {
  const riskResult = calculateRiskGrade(frequency, severity);

  return (
    <div className="space-y-6">
      {/* 빈도 선택 */}
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-3">
          빈도 (Frequency) <span className="text-orange-500">*</span>
        </label>
        <div className="grid grid-cols-4 gap-3">
          {FREQUENCY_LEVELS.map((level) => (
            <button
              key={level.value}
              type="button"
              onClick={() => onChange('frequency', level.value)}
              className={`p-4 rounded-xl border-2 transition-all ${
                frequency === level.value
                  ? 'border-orange-500 bg-orange-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-orange-300'
              }`}
            >
              <div className="text-2xl font-black text-slate-800 mb-1">{level.value}</div>
              <div className="text-xs font-bold text-slate-600">{level.label}</div>
              <div className="text-xs text-slate-500 mt-1">{level.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 강도 선택 */}
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-3">
          강도 (Severity) <span className="text-orange-500">*</span>
        </label>
        <div className="grid grid-cols-5 gap-3">
          {SEVERITY_LEVELS.map((level) => (
            <button
              key={level.value}
              type="button"
              onClick={() => onChange('severity', level.value)}
              className={`p-4 rounded-xl border-2 transition-all ${
                severity === level.value
                  ? 'border-orange-500 bg-orange-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-orange-300'
              }`}
            >
              <div className="text-2xl font-black text-slate-800 mb-1">{level.value}</div>
              <div className="text-xs font-bold text-slate-600">{level.label}</div>
              <div className="text-xs text-slate-500 mt-1">{level.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 위험성 등급 표시 */}
      {frequency > 0 && severity > 0 && (
        <div className={`p-6 rounded-xl border-2 ${
          riskResult.grade === '하' ? 'bg-green-50 border-green-300' :
          riskResult.grade === '중' ? 'bg-yellow-50 border-yellow-300' :
          'bg-red-50 border-red-300'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-700 mb-1">평가 결과</p>
              <p className="text-xs text-slate-600">
                빈도 {frequency} × 강도 {severity} = 위험도 {riskResult.score}
              </p>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-black ${
                riskResult.grade === '하' ? 'text-green-600' :
                riskResult.grade === '중' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {riskResult.grade}
              </div>
              <div className="text-xs font-medium text-slate-600 mt-1">위험성 등급</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

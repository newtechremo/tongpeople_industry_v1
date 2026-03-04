/**
 * 수시 위험성평가 위험요인 입력 카드
 *
 * 공통 필드 + 방식별 위험성 입력만 포함
 * (조치 정보는 소분류 레벨에서 관리)
 */

import { Trash2 } from 'lucide-react';
import type { RiskMethod, OccasionalRiskFactor } from '../../types/occasional';

interface Props {
  index: number;
  factor: OccasionalRiskFactor;
  riskMethod: RiskMethod;
  onChange: (factor: OccasionalRiskFactor) => void;
  onRemove: () => void;
  disabled?: boolean;
}

export default function OccasionalRiskFactorCard({
  index,
  factor,
  riskMethod,
  onChange,
  onRemove,
  disabled = false,
}: Props) {
  // 공통 필드 업데이트
  const updateField = <K extends keyof OccasionalRiskFactor>(
    key: K,
    value: OccasionalRiskFactor[K]
  ) => {
    onChange({ ...factor, [key]: value });
  };

  // LEVEL 방식 필드 업데이트
  const updateLevel = (level: 'HIGH' | 'MEDIUM' | 'LOW' | null) => {
    if ('level' in factor) {
      onChange({ ...factor, level });
    }
  };

  // FREQUENCY_INTENSITY 방식 - 개선 전 평가 업데이트
  const updateBeforeEvaluation = (
    beforeFrequency: number | null,
    beforeIntensity: number | null
  ) => {
    if ('beforeFrequency' in factor && 'beforeIntensity' in factor) {
      const beforeRiskScore =
        beforeFrequency !== null && beforeIntensity !== null
          ? beforeFrequency * beforeIntensity
          : null;
      const beforeGradeLevel =
        beforeRiskScore !== null ? calculateGradeLevel(beforeRiskScore) : null;

      onChange({
        ...factor,
        beforeFrequency,
        beforeIntensity,
        beforeRiskScore,
        beforeGradeLevel,
      });
    }
  };

  // FREQUENCY_INTENSITY 방식 - 개선 후 평가 업데이트
  const updateAfterEvaluation = (
    afterFrequency: number | null,
    afterIntensity: number | null
  ) => {
    if ('afterFrequency' in factor && 'afterIntensity' in factor) {
      const afterRiskScore =
        afterFrequency !== null && afterIntensity !== null
          ? afterFrequency * afterIntensity
          : null;
      const afterGradeLevel =
        afterRiskScore !== null ? calculateGradeLevel(afterRiskScore) : null;

      onChange({
        ...factor,
        afterFrequency,
        afterIntensity,
        afterRiskScore,
        afterGradeLevel,
      });
    }
  };

  // 등급 계산
  const calculateGradeLevel = (score: number): 'LOW' | 'MEDIUM' | 'HIGH' => {
    if (score >= 15) return 'HIGH';
    if (score >= 6) return 'MEDIUM';
    return 'LOW';
  };

  const getGradeText = (grade: 'LOW' | 'MEDIUM' | 'HIGH') => {
    if (grade === 'HIGH') return '상';
    if (grade === 'MEDIUM') return '중';
    return '하';
  };

  const getGradeTextColor = (grade: 'LOW' | 'MEDIUM' | 'HIGH') => {
    if (grade === 'HIGH') return 'text-red-600';
    if (grade === 'MEDIUM') return 'text-orange-600';
    return 'text-green-600';
  };

  return (
    <div className="p-6 rounded-xl border-2 border-gray-200 bg-white space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h4 className="text-base font-bold text-slate-700">
          위험요인 #{index + 1}
        </h4>
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
          title="삭제"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* 위험요인 */}
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">
          위험요인 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={factor.factor}
          onChange={(e) => updateField('factor', e.target.value)}
          disabled={disabled}
          placeholder="예: 높은 곳에서의 추락"
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-50"
        />
      </div>

      {/* 개선대책 */}
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">
          개선대책 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={factor.improvement}
          onChange={(e) => updateField('improvement', e.target.value)}
          disabled={disabled}
          placeholder="예: 안전난간 설치, 안전대 착용 의무화"
          rows={3}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none disabled:bg-gray-50"
        />
      </div>

      {/* 작업 기간 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            작업 시작일 <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={factor.workPeriodStart}
            onChange={(e) => updateField('workPeriodStart', e.target.value)}
            disabled={disabled}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-50"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            작업 종료일 <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={factor.workPeriodEnd}
            onChange={(e) => updateField('workPeriodEnd', e.target.value)}
            disabled={disabled}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-50"
          />
        </div>
      </div>

      {/* 방식별 위험성 입력 */}
      <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
        <h5 className="text-sm font-bold text-slate-700 mb-3">
          위험성 평가 <span className="text-red-500">*</span>
        </h5>

        {riskMethod === 'LEVEL' && 'level' in factor && (
          <div className="grid grid-cols-[40px,1fr] items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">수준</span>
            <div className="grid grid-cols-3 gap-1.5">
              {(['HIGH', 'MEDIUM', 'LOW'] as const).map((level) => (
                <label
                  key={level}
                  className={`
                    h-8 rounded-md border text-xs font-semibold flex items-center justify-center cursor-pointer transition-colors
                    ${
                      factor.level === level
                        ? level === 'HIGH'
                          ? 'border-red-500 bg-red-100 text-red-700'
                          : level === 'MEDIUM'
                          ? 'border-orange-500 bg-orange-100 text-orange-700'
                          : 'border-green-500 bg-green-100 text-green-700'
                        : 'border-gray-200 bg-white text-slate-600 hover:border-slate-300'
                    }
                  `}
                >
                  <input
                    type="radio"
                    name={`level-${factor.id}`}
                    value={level}
                    checked={factor.level === level}
                    onChange={() => updateLevel(level)}
                    disabled={disabled}
                    className="hidden"
                  />
                  {level === 'HIGH' ? '상' : level === 'MEDIUM' ? '중' : '하'}
                </label>
              ))}
            </div>
          </div>
        )}

        {riskMethod === 'FREQUENCY_INTENSITY' && 'beforeFrequency' in factor && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {/* 개선 전 */}
            <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <h6 className="text-sm font-bold text-blue-700">개선 전</h6>
                {factor.beforeRiskScore !== null && factor.beforeGradeLevel !== null ? (
                  <span className="text-xs font-semibold text-blue-700">
                    점수 {factor.beforeRiskScore} /{' '}
                    <span className={getGradeTextColor(factor.beforeGradeLevel)}>
                      {getGradeText(factor.beforeGradeLevel)}
                    </span>
                  </span>
                ) : (
                  <span className="text-xs text-slate-500">미입력</span>
                )}
              </div>

              <div className="grid grid-cols-[46px,1fr] items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">빈도</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {[1, 2, 3, 4].map((freq) => (
                    <label
                      key={freq}
                      className={`h-8 rounded-md border text-sm font-semibold flex items-center justify-center cursor-pointer transition-colors ${
                        factor.beforeFrequency === freq
                          ? 'border-blue-500 bg-blue-100 text-blue-700'
                          : 'border-gray-200 bg-white text-slate-600 hover:border-blue-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`before-frequency-${factor.id}`}
                        value={freq}
                        checked={factor.beforeFrequency === freq}
                        onChange={() => updateBeforeEvaluation(freq, factor.beforeIntensity)}
                        disabled={disabled}
                        className="hidden"
                      />
                      {freq}
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-[46px,1fr] items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">강도</span>
                <div className="grid grid-cols-5 gap-1.5">
                  {[1, 2, 3, 4, 5].map((intens) => (
                    <label
                      key={intens}
                      className={`h-8 rounded-md border text-sm font-semibold flex items-center justify-center cursor-pointer transition-colors ${
                        factor.beforeIntensity === intens
                          ? 'border-blue-500 bg-blue-100 text-blue-700'
                          : 'border-gray-200 bg-white text-slate-600 hover:border-blue-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`before-intensity-${factor.id}`}
                        value={intens}
                        checked={factor.beforeIntensity === intens}
                        onChange={() => updateBeforeEvaluation(factor.beforeFrequency, intens)}
                        disabled={disabled}
                        className="hidden"
                      />
                      {intens}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* 개선 후 */}
            <div className="rounded-lg border border-green-200 bg-green-50/50 p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <h6 className="text-sm font-bold text-green-700">개선 후</h6>
                {factor.afterRiskScore !== null && factor.afterGradeLevel !== null ? (
                  <span className="text-xs font-semibold text-green-700">
                    점수 {factor.afterRiskScore} /{' '}
                    <span className={getGradeTextColor(factor.afterGradeLevel)}>
                      {getGradeText(factor.afterGradeLevel)}
                    </span>
                  </span>
                ) : (
                  <span className="text-xs text-slate-500">미입력</span>
                )}
              </div>

              <div className="grid grid-cols-[46px,1fr] items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">빈도</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {[1, 2, 3, 4].map((freq) => (
                    <label
                      key={freq}
                      className={`h-8 rounded-md border text-sm font-semibold flex items-center justify-center cursor-pointer transition-colors ${
                        factor.afterFrequency === freq
                          ? 'border-green-500 bg-green-100 text-green-700'
                          : 'border-gray-200 bg-white text-slate-600 hover:border-green-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`after-frequency-${factor.id}`}
                        value={freq}
                        checked={factor.afterFrequency === freq}
                        onChange={() => updateAfterEvaluation(freq, factor.afterIntensity)}
                        disabled={disabled}
                        className="hidden"
                      />
                      {freq}
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-[46px,1fr] items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">강도</span>
                <div className="grid grid-cols-5 gap-1.5">
                  {[1, 2, 3, 4, 5].map((intens) => (
                    <label
                      key={intens}
                      className={`h-8 rounded-md border text-sm font-semibold flex items-center justify-center cursor-pointer transition-colors ${
                        factor.afterIntensity === intens
                          ? 'border-green-500 bg-green-100 text-green-700'
                          : 'border-gray-200 bg-white text-slate-600 hover:border-green-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`after-intensity-${factor.id}`}
                        value={intens}
                        checked={factor.afterIntensity === intens}
                        onChange={() => updateAfterEvaluation(factor.afterFrequency, intens)}
                        disabled={disabled}
                        className="hidden"
                      />
                      {intens}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            </div>

            {/* 개선 효과 표시 */}
            {factor.beforeRiskScore !== null &&
              factor.afterRiskScore !== null &&
              factor.beforeGradeLevel !== null &&
              factor.afterGradeLevel !== null && (
                <div className="p-4 rounded-lg border-2 border-slate-200 bg-gradient-to-r from-slate-50 to-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* 점수 변화 */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-600">점수 변화:</span>
                        <span className="text-lg font-bold text-slate-800">
                          {factor.beforeRiskScore}
                        </span>
                        <span className="text-slate-400">→</span>
                        <span className="text-lg font-bold text-slate-800">
                          {factor.afterRiskScore}
                        </span>
                        {factor.beforeRiskScore !== factor.afterRiskScore && (
                          <span
                            className={`text-sm font-bold ${
                              factor.afterRiskScore < factor.beforeRiskScore
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            ({factor.afterRiskScore > factor.beforeRiskScore ? '+' : ''}
                            {factor.afterRiskScore - factor.beforeRiskScore})
                          </span>
                        )}
                      </div>

                      <div className="h-6 w-px bg-slate-300" />

                      {/* 등급 변화 */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-600">등급 변화:</span>
                        <span className={`text-lg font-bold ${getGradeTextColor(factor.beforeGradeLevel)}`}>
                          {getGradeText(factor.beforeGradeLevel)}
                        </span>
                        <span className="text-slate-400">→</span>
                        <span className={`text-lg font-bold ${getGradeTextColor(factor.afterGradeLevel)}`}>
                          {getGradeText(factor.afterGradeLevel)}
                        </span>
                      </div>
                    </div>

                    {/* 개선 상태 배지 */}
                    {factor.beforeRiskScore !== factor.afterRiskScore && (
                      <div>
                        {factor.afterRiskScore < factor.beforeRiskScore ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 border border-green-300 text-green-700 text-sm font-bold">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            개선됨
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-amber-700 text-sm font-bold">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            주의 필요
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
}

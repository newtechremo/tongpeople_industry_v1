/**
 * 빈도/강도 평가 영역 Fieldset
 *
 * 선택된 위험요인별로 빈도와 강도를 평가
 */

import { useState } from 'react';
import FrequencyIntensitySelector from '@/components/risk-assessment/inputs/FrequencyIntensitySelector';
import RiskGradeDisplay from '@/components/risk-assessment/displays/RiskGradeDisplay';
import { calculateRiskGrade } from '@tong-pass/shared/risk-assessment/recommender';
import type { MockRiskFactor } from '@/mocks/risk-assessment';

interface RiskFactorAssessment {
  factor_id: string;
  frequency: number;
  severity: number;
  score: number;
  grade: '하' | '중' | '고';
}

interface Props {
  selectedFactors: MockRiskFactor[];
  assessments: RiskFactorAssessment[];
  onChange: (assessments: RiskFactorAssessment[]) => void;
  error?: string;
}

export default function FrequencyIntensityFieldset({
  selectedFactors,
  assessments,
  onChange,
  error,
}: Props) {
  const [activeFactorIndex, setActiveFactorIndex] = useState(0);

  if (selectedFactors.length === 0) {
    return (
      <div className="p-8 rounded-2xl border border-gray-200 bg-white">
        <h3 className="text-lg font-bold text-slate-800 mb-4">빈도/강도 평가</h3>
        <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
          <p className="text-slate-400">평가할 위험요인을 먼저 선택해주세요</p>
        </div>
      </div>
    );
  }

  const currentFactor = selectedFactors[activeFactorIndex];
  const currentAssessment = assessments.find(a => a.factor_id === currentFactor.id) || {
    factor_id: currentFactor.id,
    frequency: 0,
    severity: 0,
    score: 0,
    grade: '하' as const,
  };

  const handleChange = (field: 'frequency' | 'severity', value: number) => {
    const newFrequency = field === 'frequency' ? value : currentAssessment.frequency;
    const newSeverity = field === 'severity' ? value : currentAssessment.severity;
    const riskResult = calculateRiskGrade(newFrequency, newSeverity);

    const newAssessment: RiskFactorAssessment = {
      factor_id: currentFactor.id,
      frequency: newFrequency,
      severity: newSeverity,
      score: riskResult.score,
      grade: riskResult.grade,
    };

    const updatedAssessments = assessments.filter(a => a.factor_id !== currentFactor.id);
    onChange([...updatedAssessments, newAssessment]);
  };

  // 모든 평가가 완료되었는지 확인
  const completedCount = selectedFactors.filter(factor =>
    assessments.some(a => a.factor_id === factor.id && a.frequency > 0 && a.severity > 0)
  ).length;

  return (
    <div className="p-8 rounded-2xl border border-gray-200 bg-white space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-800">빈도/강도 평가</h3>
        <span className="text-sm text-slate-600">
          평가 완료: <span className="font-bold text-orange-600">{completedCount}</span> / {selectedFactors.length}
        </span>
      </div>

      {/* 위험요인 탭 네비게이션 */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {selectedFactors.map((factor, index) => {
          const assessment = assessments.find(a => a.factor_id === factor.id);
          const isCompleted = assessment && assessment.frequency > 0 && assessment.severity > 0;

          return (
            <button
              key={factor.id}
              type="button"
              onClick={() => setActiveFactorIndex(index)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                activeFactorIndex === index
                  ? 'bg-orange-500 text-white shadow-md'
                  : isCompleted
                  ? 'bg-green-50 text-green-700 border border-green-300'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {index + 1}. {factor.name}
              {isCompleted && activeFactorIndex !== index && (
                <span className="ml-2">✓</span>
              )}
            </button>
          );
        })}
      </div>

      {/* 현재 위험요인 정보 */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
        <div className="font-bold text-slate-800">{currentFactor.name}</div>
        <div className="text-sm text-slate-600 mt-1">
          재해형태: <span className="text-orange-600 font-medium">{currentFactor.accident_type}</span>
        </div>
        {currentFactor.description && (
          <div className="text-xs text-slate-500 mt-2">{currentFactor.description}</div>
        )}
      </div>

      {/* 빈도/강도 선택 */}
      <FrequencyIntensitySelector
        frequency={currentAssessment.frequency}
        severity={currentAssessment.severity}
        onChange={handleChange}
      />

      {/* 네비게이션 버튼 */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={() => setActiveFactorIndex(prev => Math.max(0, prev - 1))}
          disabled={activeFactorIndex === 0}
          className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-white border-2 border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          이전
        </button>
        <button
          type="button"
          onClick={() => setActiveFactorIndex(prev => Math.min(selectedFactors.length - 1, prev + 1))}
          disabled={activeFactorIndex === selectedFactors.length - 1}
          className="px-5 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          다음
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

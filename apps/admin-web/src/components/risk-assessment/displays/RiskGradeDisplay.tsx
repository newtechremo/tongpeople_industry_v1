/**
 * 위험성 등급 표시 컴포넌트
 *
 * 계산된 위험도와 등급을 시각적으로 표시
 */

interface Props {
  score: number;
  grade: '하' | '중' | '고';
  frequency?: number;
  severity?: number;
  showDetails?: boolean;
}

export default function RiskGradeDisplay({
  score,
  grade,
  frequency,
  severity,
  showDetails = false,
}: Props) {
  const gradeConfig = {
    '하': {
      bg: 'bg-green-50',
      border: 'border-green-300',
      text: 'text-green-600',
      badge: 'bg-green-500',
    },
    '중': {
      bg: 'bg-yellow-50',
      border: 'border-yellow-300',
      text: 'text-yellow-600',
      badge: 'bg-yellow-500',
    },
    '고': {
      bg: 'bg-red-50',
      border: 'border-red-300',
      text: 'text-red-600',
      badge: 'bg-red-500',
    },
  };

  const config = gradeConfig[grade];

  return (
    <div className={`p-6 rounded-xl border-2 ${config.bg} ${config.border}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-700 mb-2">위험성 평가 결과</p>
          {showDetails && frequency && severity && (
            <p className="text-xs text-slate-600">
              빈도 <span className="font-bold">{frequency}</span> × 강도 <span className="font-bold">{severity}</span> = 위험도 <span className="font-bold">{score}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          {/* 위험도 점수 */}
          <div className="text-center">
            <div className={`text-4xl font-black ${config.text}`}>{score}</div>
            <div className="text-xs font-medium text-slate-600 mt-1">위험도</div>
          </div>
          {/* 등급 뱃지 */}
          <div className={`flex items-center justify-center w-16 h-16 rounded-2xl ${config.badge} shadow-lg`}>
            <span className="text-3xl font-black text-white">{grade}</span>
          </div>
        </div>
      </div>

      {/* 등급 설명 */}
      <div className="mt-4 pt-4 border-t border-slate-200">
        <p className="text-xs text-slate-600">
          {grade === '하' && '허용 가능한 위험 수준입니다. 현재 안전조치를 유지하십시오.'}
          {grade === '중' && '주의가 필요한 위험 수준입니다. 추가 안전조치를 검토하십시오.'}
          {grade === '고' && '즉각적인 조치가 필요한 위험 수준입니다. 작업 중지 및 개선조치를 시행하십시오.'}
        </p>
      </div>
    </div>
  );
}

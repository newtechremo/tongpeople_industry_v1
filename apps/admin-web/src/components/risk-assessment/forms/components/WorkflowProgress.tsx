/**
 * 워크플로우 진행률 표시 컴포넌트
 *
 * 완료된 섹션 수 / 전체 섹션 수 표시
 */

interface WorkflowProgressProps {
  /** 완료된 섹션 수 */
  completedCount: number;
  /** 전체 섹션 수 */
  totalSections: number;
}

export default function WorkflowProgress({
  completedCount,
  totalSections,
}: WorkflowProgressProps) {
  const progress = (completedCount / totalSections) * 100;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider">
          작성 진행률
        </h3>
        <span className="text-2xl font-black text-orange-600">
          {completedCount} / {totalSections}
        </span>
      </div>

      {/* 진행률 바 */}
      <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 상태 메시지 */}
      <div className="mt-3 text-center">
        {completedCount === 0 && (
          <p className="text-sm text-slate-500">작성을 시작해주세요</p>
        )}
        {completedCount > 0 && completedCount < totalSections && (
          <p className="text-sm text-orange-600 font-medium">
            {totalSections - completedCount}개 섹션 남음
          </p>
        )}
        {completedCount === totalSections && (
          <p className="text-sm text-green-600 font-bold">✓ 모든 섹션 완료!</p>
        )}
      </div>
    </div>
  );
}

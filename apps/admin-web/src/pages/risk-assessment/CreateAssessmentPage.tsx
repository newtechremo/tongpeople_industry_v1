import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

// URL 파라미터 → 라벨 매핑
const TYPE_LABELS: Record<string, string> = {
  initial: '최초',
  regular: '정기',
  occasional: '수시',
  continuous: '상시',
};

export default function CreateAssessmentPage() {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();

  const typeLabel = type ? TYPE_LABELS[type] || type.toUpperCase() : '알 수 없음';

  const handleBack = () => {
    navigate('/safety/risk');
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft size={20} className="text-slate-600" />
        </button>
        <h1 className="text-xl font-black tracking-tight text-slate-800">
          {typeLabel} 위험성평가 만들기
        </h1>
      </div>

      {/* 임시 콘텐츠 */}
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <p className="text-slate-500 text-center">
          {typeLabel} 위험성평가 폼 구현 예정
        </p>
      </div>
    </div>
  );
}

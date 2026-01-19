import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle, AlertCircle } from 'lucide-react';
import InitialAssessmentForm from '@/components/risk-assessment/forms/InitialAssessmentForm';
import AdHocAssessmentForm from '@/components/risk-assessment/forms/AdHocAssessmentForm';

// URL 파라미터 → 라벨 매핑
const TYPE_LABELS: Record<string, string> = {
  initial: '최초',
  regular: '정기',
  occasional: '수시',
  continuous: '상시',
};

type AssessmentType = 'INITIAL' | 'ADHOC' | 'FREQUENCY_INTENSITY';

const TYPE_MAPPING: Record<string, AssessmentType> = {
  initial: 'INITIAL',
  occasional: 'ADHOC',
  continuous: 'FREQUENCY_INTENSITY',
};

export default function CreateAssessmentPage() {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null);

  const typeLabel = type ? TYPE_LABELS[type] || type.toUpperCase() : '알 수 없음';
  const assessmentType = type ? TYPE_MAPPING[type] : null;

  const handleBack = () => {
    navigate('/safety/risk');
  };

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // TODO: API 호출로 데이터 저장
      console.log('평가 데이터:', {
        ...data,
        type: assessmentType,
        created_at: new Date().toISOString(),
        status: 'DRAFT',
      });

      // 임시: 2초 대기 (API 호출 시뮬레이션)
      await new Promise(resolve => setTimeout(resolve, 2000));

      setSubmitStatus('success');

      // 성공 메시지 표시 후 목록으로 이동
      setTimeout(() => {
        navigate('/safety/risk');
      }, 1500);
    } catch (error) {
      console.error('평가 생성 실패:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('작성 중인 내용이 저장되지 않습니다. 취소하시겠습니까?')) {
      navigate('/safety/risk');
    }
  };

  // 지원하지 않는 타입
  if (!assessmentType) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} className="text-slate-600" />
          </button>
          <h1 className="text-xl font-black tracking-tight text-slate-800">
            위험성평가 만들기
          </h1>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <p className="text-slate-500 text-center">
            지원하지 않는 평가 유형입니다
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          disabled={isSubmitting}
        >
          <ChevronLeft size={20} className="text-slate-600" />
        </button>
        <h1 className="text-xl font-black tracking-tight text-slate-800">
          {typeLabel} 위험성평가 만들기
        </h1>
      </div>

      {/* 제출 상태 알림 */}
      {submitStatus === 'success' && (
        <div className="p-4 rounded-xl bg-green-50 border border-green-200 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-green-800 font-medium">평가가 성공적으로 생성되었습니다.</p>
        </div>
      )}

      {submitStatus === 'error' && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-800 font-medium">평가 생성 중 오류가 발생했습니다. 다시 시도해주세요.</p>
        </div>
      )}

      {/* 로딩 오버레이 */}
      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mb-4"></div>
            <p className="text-slate-700 font-bold">평가를 생성하는 중...</p>
          </div>
        </div>
      )}

      {/* 폼 렌더링 */}
      {assessmentType === 'INITIAL' && (
        <InitialAssessmentForm onSubmit={handleSubmit} onCancel={handleCancel} />
      )}

      {(assessmentType === 'ADHOC' || assessmentType === 'FREQUENCY_INTENSITY') && (
        <AdHocAssessmentForm onSubmit={handleSubmit} onCancel={handleCancel} />
      )}
    </div>
  );
}

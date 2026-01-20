import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAssessmentById } from '@/mocks/risk-assessment';

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  DRAFT: { label: '작성중', className: 'bg-yellow-100 text-yellow-700' },
  IN_PROGRESS: { label: '작업대기중', className: 'bg-orange-100 text-orange-700' },
  COMPLETED: { label: '작업종료', className: 'bg-gray-100 text-gray-600' },
  APPROVED: { label: '승인완료', className: 'bg-green-100 text-green-700' },
  REJECTED: { label: '반려', className: 'bg-red-100 text-red-700' },
  PENDING: { label: '결재대기', className: 'bg-blue-100 text-blue-700' },
};

const TYPE_LABELS: Record<string, string> = {
  INITIAL: '최초',
  ADHOC: '수시',
  FREQUENCY_INTENSITY: '정기',
};

export default function RiskAssessmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const assessment = useMemo(() => (id ? getAssessmentById(id) : undefined), [id]);

  if (!assessment) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-black tracking-tight text-slate-800">위험성평가 상세</h1>
          <button
            type="button"
            onClick={() => navigate('/safety/risk')}
            className="px-4 py-2 rounded-lg font-medium text-slate-600 bg-gray-100 hover:bg-gray-200"
          >
            목록으로
          </button>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-slate-500">
          문서를 찾을 수 없습니다.
        </div>
      </div>
    );
  }

  const statusInfo = STATUS_LABELS[assessment.status] || {
    label: assessment.status,
    className: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-800">위험성평가 상세</h1>
          <p className="text-sm text-slate-500 mt-1">문서 번호: {assessment.id}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/safety/risk')}
            className="px-4 py-2 rounded-lg font-medium text-slate-600 bg-gray-100 hover:bg-gray-200"
          >
            목록
          </button>
          <button
            type="button"
            onClick={() => navigate(`/safety/risk/${assessment.id}/edit`)}
            className="px-4 py-2 rounded-lg font-medium text-slate-600 bg-white border border-gray-200 hover:bg-gray-50"
          >
            수정
          </button>
          <button
            type="button"
            onClick={() => navigate(`/safety/risk/${assessment.id}/approval`)}
            className="px-4 py-2 rounded-lg font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
          >
            결재
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className={`px-2 py-1 text-xs font-medium rounded ${statusInfo.className}`}>
            {statusInfo.label}
          </span>
          <span className="text-sm text-slate-500">{TYPE_LABELS[assessment.type] || assessment.type} 위험성평가</span>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm text-slate-700">
          <div>
            <span className="text-slate-500">평가명</span>
            <div className="font-medium text-slate-800 mt-1">{assessment.title}</div>
          </div>
          <div>
            <span className="text-slate-500">작업기간</span>
            <div className="font-medium text-slate-800 mt-1">
              {assessment.work_start_date} ~ {assessment.work_end_date}
            </div>
          </div>
          <div>
            <span className="text-slate-500">현장</span>
            <div className="font-medium text-slate-800 mt-1">{assessment.site_name}</div>
          </div>
          <div>
            <span className="text-slate-500">작업공종</span>
            <div className="font-medium text-slate-800 mt-1">{assessment.category_name}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-slate-800">위험요인 목록</h2>
        <p className="text-sm text-slate-500 mt-2">선택된 위험요인 상세는 연동 후 표시됩니다.</p>
      </div>
    </div>
  );
}

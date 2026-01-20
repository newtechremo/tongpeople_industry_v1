import { useNavigate, useParams } from 'react-router-dom';

export default function RiskAssessmentApprovalPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black tracking-tight text-slate-800">위험성평가 결재</h1>
        <button
          type="button"
          onClick={() => navigate(id ? `/safety/risk/${id}` : '/safety/risk')}
          className="px-4 py-2 rounded-lg font-medium text-slate-600 bg-gray-100 hover:bg-gray-200"
        >
          상세로
        </button>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-slate-500">
        결재 화면은 준비 중입니다.
      </div>
    </div>
  );
}

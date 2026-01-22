/**
 * 수시평가 사유 Fieldset
 *
 * 수시 위험성평가의 실시 사유 입력
 */

interface Props {
  reason: string;
  onChange: (field: string, value: string) => void;
  error?: string;
}

export default function TriggerReasonFieldset({ reason, onChange, error }: Props) {
  return (
    <div className="p-8 rounded-2xl border border-gray-200 bg-white space-y-6">
      <h3 className="text-lg font-bold text-slate-800">
        수시평가 실시 사유 <span className="text-orange-500">*</span>
      </h3>

      <div>
        <textarea
          value={reason}
          onChange={(e) => onChange('trigger_reason', e.target.value)}
          placeholder="수시 위험성평가를 실시하게 된 구체적인 사유를 입력해주세요&#10;예: 신규 기계 도입, 작업방법 변경, 산업재해 발생 등"
          rows={5}
          className={`w-full px-4 py-3 rounded-xl border-2 ${
            error
              ? 'border-red-300 bg-red-50'
              : 'border-gray-200 bg-white'
          } focus:outline-none focus:border-orange-500 resize-none`}
        />
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </div>

      {/* 안내 메시지 */}
      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
        <p className="text-sm text-blue-800">
          <span className="font-bold">수시평가 실시 사유 예시:</span>
        </p>
        <ul className="mt-2 text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li>사업장 건설물의 설치·이전·변경 또는 해체</li>
          <li>기계·기구, 설비, 원재료 등의 신규 도입 또는 변경</li>
          <li>건설물, 기계·기구, 설비 등의 정비 또는 보수</li>
          <li>작업방법 또는 작업절차의 신규 도입 또는 변경</li>
          <li>중대산업사고 또는 산업재해 발생</li>
          <li>그 밖의 작업환경 변화</li>
        </ul>
      </div>
    </div>
  );
}

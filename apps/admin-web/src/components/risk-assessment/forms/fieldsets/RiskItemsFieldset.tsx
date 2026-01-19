/**
 * 선택된 위험요인 목록 Fieldset
 *
 * 선택된 위험요인들을 테이블 형태로 표시하고 제거 가능
 */

import { Trash2 } from 'lucide-react';
import RiskFactorSelector from '@/components/risk-assessment/inputs/RiskFactorSelector';
import type { MockRiskFactor } from '@/mocks/risk-assessment';

interface Props {
  selectedFactors: MockRiskFactor[];
  availableFactors: MockRiskFactor[];
  onAdd: (factorIds: string[]) => void;
  onRemove: (factorId: string) => void;
  disabled?: boolean;
  error?: string;
}

export default function RiskItemsFieldset({
  selectedFactors,
  availableFactors,
  onAdd,
  onRemove,
  disabled = false,
  error,
}: Props) {
  return (
    <div className="p-8 rounded-2xl border border-gray-200 bg-white space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-800">
          위험요인 목록 <span className="text-orange-500">*</span>
        </h3>
        <span className="text-sm text-slate-600">
          총 <span className="font-bold text-orange-600">{selectedFactors.length}</span>개
        </span>
      </div>

      {/* 위험요인 선택 버튼 */}
      <RiskFactorSelector
        availableFactors={availableFactors}
        selectedFactorIds={selectedFactors.map(f => f.id)}
        onAdd={onAdd}
        disabled={disabled}
      />

      {/* 선택된 위험요인 테이블 */}
      {selectedFactors.length > 0 && (
        <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider w-12">
                  번호
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  위험요인
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider w-32">
                  재해형태
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold text-slate-700 uppercase tracking-wider w-20">
                  삭제
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {selectedFactors.map((factor, index) => (
                <tr key={factor.id} className="hover:bg-orange-50 transition-colors">
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {index + 1}
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-medium text-slate-800">{factor.name}</div>
                    {factor.description && (
                      <div className="text-xs text-slate-500 mt-1">{factor.description}</div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                      {factor.accident_type}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button
                      type="button"
                      onClick={() => onRemove(factor.id)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* 빈 상태 */}
      {selectedFactors.length === 0 && !disabled && (
        <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
          <p className="text-slate-400">위험요인을 추가해주세요</p>
        </div>
      )}
    </div>
  );
}

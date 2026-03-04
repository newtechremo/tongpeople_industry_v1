/**
 * 위험성 산정 방식 선택 컴포넌트
 *
 * 수시 위험성평가에서 사용
 * - LEVEL: 상중하 방식
 * - FREQUENCY_INTENSITY: 빈도강도 방식
 */

import { useState } from 'react';
import type { RiskMethod } from '../../types/occasional';

interface Props {
  value: RiskMethod;
  onChange: (method: RiskMethod) => void;
  disabled?: boolean;
}

export default function RiskMethodSelector({ value, onChange, disabled = false }: Props) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingMethod, setPendingMethod] = useState<RiskMethod | null>(null);

  const handleMethodChange = (newMethod: RiskMethod) => {
    if (newMethod === value) return;

    // 방식 변경 시 확인 모달 표시
    setPendingMethod(newMethod);
    setShowConfirmModal(true);
  };

  const handleConfirm = () => {
    if (pendingMethod) {
      onChange(pendingMethod);
    }
    setShowConfirmModal(false);
    setPendingMethod(null);
  };

  const handleCancel = () => {
    setShowConfirmModal(false);
    setPendingMethod(null);
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-base font-bold text-slate-700 mb-4">위험성 산정 방식</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 상중하 방식 */}
          <label
            className={`
              flex items-start gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer
              ${
                value === 'LEVEL'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50/50'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input
              type="radio"
              name="riskMethod"
              value="LEVEL"
              checked={value === 'LEVEL'}
              onChange={() => handleMethodChange('LEVEL')}
              disabled={disabled}
              className="mt-0.5 w-4 h-4 text-orange-600 focus:ring-orange-500 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="font-bold text-slate-700 mb-1">상중하 방식</div>
              <div className="text-sm text-slate-500">
                위험성을 <span className="font-semibold text-red-600">상</span>,{' '}
                <span className="font-semibold text-orange-600">중</span>,{' '}
                <span className="font-semibold text-green-600">하</span> 3단계로 평가합니다.
                <br />
                <span className="text-xs text-slate-400">
                  간편하고 직관적인 평가에 적합합니다.
                </span>
              </div>
            </div>
          </label>

          {/* 빈도강도 방식 */}
          <label
            className={`
              flex items-start gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer
              ${
                value === 'FREQUENCY_INTENSITY'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50/50'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input
              type="radio"
              name="riskMethod"
              value="FREQUENCY_INTENSITY"
              checked={value === 'FREQUENCY_INTENSITY'}
              onChange={() => handleMethodChange('FREQUENCY_INTENSITY')}
              disabled={disabled}
              className="mt-0.5 w-4 h-4 text-orange-600 focus:ring-orange-500 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="font-bold text-slate-700 mb-1">빈도강도 방식</div>
              <div className="text-sm text-slate-500">
                <span className="font-semibold text-orange-600">빈도(1~4)</span> ×{' '}
                <span className="font-semibold text-orange-600">강도(1~5)</span>로 위험성을
                정량화합니다.
                <br />
                <span className="text-xs text-slate-400">
                  점수 기반 상세 관리에 적합합니다. (1~20점 → 상/중/하 자동 분류)
                </span>
              </div>
            </div>
          </label>
        </div>

        {/* 안내 메시지 */}
        <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
          <p className="text-sm text-blue-800">
            💡 <span className="font-semibold">방식 변경 시 주의:</span> 입력한 위험성 데이터가
            초기화됩니다. 공통 조치 필드(조치일/조치자/조치확인자)는 유지됩니다.
          </p>
        </div>
      </div>

      {/* 방식 변경 확인 모달 */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-slate-700 mb-4">
              위험성 산정 방식을 변경하시겠습니까?
            </h3>
            <p className="text-base text-slate-600 mb-6">
              {value === 'LEVEL' ? '상중하' : '빈도강도'} 방식에서{' '}
              {pendingMethod === 'LEVEL' ? '상중하' : '빈도강도'} 방식으로 변경하면{' '}
              <span className="font-bold text-red-600">
                기존에 입력한 위험성 데이터가 모두 초기화
              </span>
              됩니다.
              <br />
              <br />
              <span className="text-sm text-slate-500">
                (조치일, 조치자, 조치확인자는 유지됩니다)
              </span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all"
              >
                변경
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

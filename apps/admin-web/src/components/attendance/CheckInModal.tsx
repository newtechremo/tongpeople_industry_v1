/**
 * QR 스캔 출근 처리 모달
 *
 * 관리자가 근로자의 QR 코드를 스캔하여 출근 처리합니다.
 */
import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, CheckCircle, AlertCircle, UserCheck, Clock, Building2 } from 'lucide-react';
import { QRScanner, type QRPayload } from './QRScanner';
import { checkInWithQR, type CheckInResponse } from '../../api/attendance';

interface CheckInModalProps {
  /** 모달 열림 여부 */
  isOpen: boolean;
  /** 모달 닫기 콜백 */
  onClose: () => void;
  /** 현장 ID */
  siteId: number;
  /** 현장 이름 */
  siteName?: string;
}

type ModalState = 'scanning' | 'processing' | 'success' | 'error';

export function CheckInModal({ isOpen, onClose, siteId, siteName }: CheckInModalProps) {
  const [state, setState] = useState<ModalState>('scanning');
  const [result, setResult] = useState<CheckInResponse['data'] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const queryClient = useQueryClient();

  const checkInMutation = useMutation({
    mutationFn: (payload: QRPayload) => checkInWithQR(siteId, payload),
    onSuccess: (response) => {
      setResult(response.data || null);
      setState('success');

      // 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error: Error) => {
      setErrorMessage(error.message || '출근 처리에 실패했습니다.');
      setState('error');
    },
  });

  const handleScan = useCallback(
    (payload: QRPayload) => {
      setState('processing');
      checkInMutation.mutate(payload);
    },
    [checkInMutation]
  );

  const handleError = useCallback((message: string) => {
    setErrorMessage(message);
    setState('error');
  }, []);

  const handleReset = useCallback(() => {
    setState('scanning');
    setResult(null);
    setErrorMessage('');
  }, []);

  const handleClose = useCallback(() => {
    handleReset();
    onClose();
  }, [handleReset, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* 모달 콘텐츠 */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-orange-500 to-orange-600">
          <div className="flex items-center gap-3">
            <UserCheck className="w-6 h-6 text-white" />
            <h2 className="text-lg font-bold text-white">QR 출근 스캔</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* 현장 정보 */}
        {siteName && (
          <div className="flex items-center gap-2 px-6 py-3 bg-orange-50 border-b border-orange-100">
            <Building2 className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-700">{siteName}</span>
          </div>
        )}

        {/* 본문 */}
        <div className="p-6">
          {/* 스캐닝 상태 */}
          {state === 'scanning' && (
            <QRScanner onScan={handleScan} onError={handleError} enabled />
          )}

          {/* 처리 중 */}
          {state === 'processing' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full mb-4" />
              <p className="text-slate-600">출근 처리 중...</p>
            </div>
          )}

          {/* 성공 */}
          {state === 'success' && result && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>

              <h3 className="text-2xl font-bold text-slate-800 mb-2">
                {result.worker_name}
              </h3>

              {result.partner_name && (
                <p className="text-slate-500 mb-4">{result.partner_name}</p>
              )}

              <div className="flex items-center justify-center gap-2 text-green-600 mb-6">
                <Clock className="w-5 h-5" />
                <span className="font-medium">
                  출근 완료: {formatTime(result.check_in_time)}
                </span>
              </div>

              {/* 추가 정보 */}
              <div className="flex justify-center gap-4 mb-6">
                {result.is_senior && (
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                    고령자
                  </span>
                )}
                {result.is_auto_out && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    자동 퇴근 예정
                  </span>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                >
                  다음 스캔
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
                >
                  완료
                </button>
              </div>
            </div>
          )}

          {/* 에러 */}
          {state === 'error' && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>

              <h3 className="text-xl font-bold text-slate-800 mb-2">
                출근 처리 실패
              </h3>

              <p className="text-red-600 mb-6">{errorMessage}</p>

              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
                >
                  다시 시도
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * ISO 시간을 HH:MM 형식으로 변환
 */
function formatTime(isoString: string): string {
  const date = new Date(isoString);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

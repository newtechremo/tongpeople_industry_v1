/**
 * QR 코드 스캐너 컴포넌트
 *
 * html5-qrcode 라이브러리를 사용하여 웹캠으로 QR 코드를 스캔합니다.
 */
import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, CameraOff } from 'lucide-react';

export interface QRPayload {
  workerId: string;
  timestamp: number;
  expiresAt: number;
  signature: string;
}

interface QRScannerProps {
  /** QR 스캔 성공 시 콜백 */
  onScan: (payload: QRPayload) => void;
  /** 에러 발생 시 콜백 */
  onError: (message: string) => void;
  /** 스캐너 활성화 여부 */
  enabled?: boolean;
}

export function QRScanner({ onScan, onError, enabled = true }: QRScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // 스캐너 초기화
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1,
      supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
    };

    scannerRef.current = new Html5QrcodeScanner('qr-scanner', config, false);

    scannerRef.current.render(
      // 성공 콜백
      (decodedText) => {
        try {
          const payload = JSON.parse(decodedText) as QRPayload;

          // 필수 필드 검증
          if (!payload.workerId || !payload.timestamp || !payload.expiresAt) {
            onError('잘못된 QR 코드 형식입니다.');
            return;
          }

          // signature 필드 검증 (선택적)
          if (!payload.signature) {
            console.warn('[QRScanner] signature 필드 없음 - 개발 모드로 처리됩니다.');
          }

          // 만료 확인
          if (payload.expiresAt < Date.now()) {
            onError('QR 코드가 만료되었습니다. 근로자에게 새로고침을 요청하세요.');
            return;
          }

          onScan(payload);
        } catch (error) {
          console.error('[QRScanner] 파싱 오류:', error);
          onError('QR 코드를 파싱할 수 없습니다.');
        }
      },
      // 에러 콜백 (일반적인 스캔 실패 - 무시)
      (error) => {
        // 카메라 접근 오류만 처리
        if (error.includes('NotAllowedError') || error.includes('NotFoundError')) {
          setCameraError('카메라 접근이 차단되었거나 카메라를 찾을 수 없습니다.');
        }
      }
    );

    setIsReady(true);

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, [enabled, onScan, onError]);

  if (!enabled) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-100 rounded-xl">
        <CameraOff className="w-12 h-12 text-slate-400 mb-4" />
        <p className="text-slate-500">스캐너가 비활성화되었습니다.</p>
      </div>
    );
  }

  if (cameraError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-red-50 rounded-xl">
        <CameraOff className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-red-600 text-center">{cameraError}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          새로고침
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* 스캐너 안내 */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <Camera className="w-5 h-5 text-orange-500" />
        <span className="text-sm text-slate-600">
          근로자의 QR 코드를 카메라에 비춰주세요
        </span>
      </div>

      {/* QR 스캐너 영역 */}
      <div
        id="qr-scanner"
        className="overflow-hidden rounded-xl border-2 border-orange-300"
        style={{ minHeight: 300 }}
      />

      {/* 로딩 표시 */}
      {!isReady && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full" />
          <span className="ml-2 text-slate-500">카메라 초기화 중...</span>
        </div>
      )}
    </div>
  );
}

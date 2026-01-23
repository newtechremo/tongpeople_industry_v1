import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  X,
  Download,
  Link2,
  Copy,
  RefreshCw,
  Ban,
  AlertTriangle,
} from 'lucide-react';
import { useSites } from '@/context/SitesContext';
import { useAuth } from '@/context/AuthContext';
import { getCompanyCode, regenerateCompanyCode, deactivateCompanyCode } from '@/api/companies';

interface CompanyCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MOCK_SIGNUP_BASE_URL = 'https://tongpass.app/signup';

export function CompanyCodeModal({ isOpen, onClose }: CompanyCodeModalProps) {
  const { selectedSite } = useSites();
  const { user } = useAuth();
  const qrRef = useRef<HTMLDivElement>(null);

  // State
  const [companyCode, setCompanyCode] = useState('');
  const [isCodeActive, setIsCodeActive] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState<'regenerate' | 'deactivate' | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Derived values
  const signupUrl = `${MOCK_SIGNUP_BASE_URL}?code=${companyCode}`;
  const companyName = user?.companyName || '통하는사람들';

  // Load company code on modal open
  useEffect(() => {
    if (isOpen) {
      if (user?.companyId) {
        loadCompanyCode();
      } else {
        setLoading(false);
        showToast('회사 정보를 찾을 수 없습니다. 다시 로그인해주세요.');
      }
    }
  }, [isOpen, user?.companyId]);

  const loadCompanyCode = async () => {
    if (!user?.companyId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const result = await getCompanyCode(user.companyId);

    if (result.success && result.code) {
      setCompanyCode(result.code);
    } else {
      showToast(result.error || '회사코드 조회 중 오류가 발생했습니다.');
    }
    setLoading(false);
  };

  // Toast handler
  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 2000);
  }, []);

  // Copy to clipboard
  const copyToClipboard = useCallback(async (text: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(successMessage);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showToast(successMessage);
    }
  }, [showToast]);

  // Handle link copy
  const handleCopyLink = () => {
    copyToClipboard(signupUrl, '가입 링크가 복사되었습니다');
  };

  // Handle code copy
  const handleCopyCode = () => {
    copyToClipboard(companyCode, '회사 코드가 복사되었습니다');
  };

  // Handle QR download as PNG
  const handleDownloadQR = () => {
    const svgElement = qrRef.current?.querySelector('svg');
    if (!svgElement) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      // Set canvas size (with padding for better quality)
      const size = 512;
      const padding = 32;
      canvas.width = size + padding * 2;
      canvas.height = size + padding * 2;

      // Fill white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw QR code
      ctx.drawImage(img, padding, padding, size, size);

      // Download
      const downloadLink = document.createElement('a');
      downloadLink.download = `tongpass_qr_${companyCode}.png`;
      downloadLink.href = canvas.toDataURL('image/png');
      downloadLink.click();

      URL.revokeObjectURL(url);
      showToast('QR 코드가 다운로드되었습니다');
    };

    img.src = url;
  };

  // Handle code regeneration
  const handleRegenerateCode = async () => {
    if (!user?.companyId) return;

    setLoading(true);
    const result = await regenerateCompanyCode(user.companyId);

    if (result.success && result.code) {
      setCompanyCode(result.code);
      setIsCodeActive(true);
      setShowConfirmDialog(null);
      showToast('새 코드가 생성되었습니다');
    } else {
      showToast('재생성 중 오류가 발생했습니다.');
    }
    setLoading(false);
  };

  // Handle code deactivation
  const handleDeactivateCode = async () => {
    if (!user?.companyId) return;

    setLoading(true);
    const result = await deactivateCompanyCode(user.companyId);

    if (result.success) {
      setIsCodeActive(false);
      setShowConfirmDialog(null);
      showToast('코드가 비활성화되었습니다');
    } else {
      showToast('비활성화 중 오류가 발생했습니다.');
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
        role="dialog"
        aria-labelledby="modal-title"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 id="modal-title" className="text-lg font-black text-slate-800">
            QR/코드 공유
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="닫기"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-5">
          {/* Description */}
          <p className="text-sm text-slate-500 text-center">
            근로자들이 아래 코드로 직접 가입할 수 있습니다
          </p>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              <p className="mt-3 text-sm text-slate-500">로딩 중...</p>
            </div>
          ) : (
            <>
              {/* QR Code */}
              <div
                ref={qrRef}
                className={`flex justify-center p-6 bg-gray-50 rounded-xl ${
                  !isCodeActive ? 'opacity-40' : ''
                }`}
              >
                <QRCodeSVG
                  value={signupUrl}
                  size={256}
                  level="H"
                  includeMargin={false}
                  bgColor="#f9fafb"
                  fgColor={isCodeActive ? '#1e293b' : '#94a3b8'}
                />
              </div>

              {/* Company Code Display */}
              <div className="text-center space-y-2">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                  회사 코드
                </p>
                <div className={`flex justify-center gap-2 ${!isCodeActive ? 'opacity-40' : ''}`}>
                  {companyCode && companyCode.split('').map((char, index) => (
                    <div
                      key={index}
                      className="w-10 h-12 flex items-center justify-center bg-gray-100 border border-gray-200 rounded-lg text-xl font-black text-slate-800 tracking-wider"
                    >
                      {char}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-slate-500">{companyName}</p>
                {!isCodeActive && (
                  <p className="text-sm font-bold text-red-500">비활성화됨</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleDownloadQR}
                  disabled={!isCodeActive}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm text-slate-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Download size={16} />
                  QR 다운로드
                </button>
                <button
                  onClick={handleCopyLink}
                  disabled={!isCodeActive}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm text-slate-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Link2 size={16} />
                  링크 복사
                </button>
                <button
                  onClick={handleCopyCode}
                  disabled={!isCodeActive}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm text-slate-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Copy size={16} />
                  코드 복사
                </button>
              </div>

              {/* Code Management Section */}
              <div className="pt-4 border-t border-gray-200 space-y-3">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                  코드 관리
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirmDialog('deactivate')}
                    disabled={!isCodeActive}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm text-slate-600 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <Ban size={16} />
                    코드 비활성화
                  </button>
                  <button
                    onClick={() => setShowConfirmDialog('regenerate')}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw size={16} />
                    새 코드 생성
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowConfirmDialog(null)}
          />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-amber-500">
              <AlertTriangle size={24} />
              <h3 className="text-lg font-bold text-slate-800">
                {showConfirmDialog === 'regenerate' ? '새 코드 생성' : '코드 비활성화'}
              </h3>
            </div>
            <p className="text-sm text-slate-600">
              {showConfirmDialog === 'regenerate' ? (
                <>
                  새 코드를 생성하면 기존 코드는 더 이상 사용할 수 없습니다.
                  <br />
                  <span className="font-bold text-red-500">
                    기존 QR 코드나 링크로는 가입이 불가능해집니다.
                  </span>
                </>
              ) : (
                <>
                  코드를 비활성화하면 근로자들이 이 코드로 가입할 수 없습니다.
                  <br />
                  <span className="font-bold text-slate-700">
                    새 코드 생성 버튼으로 다시 활성화할 수 있습니다.
                  </span>
                </>
              )}
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowConfirmDialog(null)}
                className="flex-1 py-2.5 rounded-xl font-bold text-slate-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={showConfirmDialog === 'regenerate' ? handleRegenerateCode : handleDeactivateCode}
                className={`flex-1 py-2.5 rounded-xl font-bold text-white transition-all ${
                  showConfirmDialog === 'regenerate'
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
                    : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {showConfirmDialog === 'regenerate' ? '새 코드 생성' : '비활성화'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Message */}
      {toastMessage && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[70] px-5 py-3 bg-slate-800 text-white text-sm font-bold rounded-xl shadow-lg animate-fade-in">
          {toastMessage}
        </div>
      )}
    </div>
  );

  return createPortal(modalContent, document.body);
}

export default CompanyCodeModal;

/**
 * 완료 모달
 *
 * 위험성평가 저장 완료 알림
 */

import { CheckCircle } from 'lucide-react';

interface SuccessModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  title?: string;
  message?: string;
}

export default function SuccessModal({
  isOpen,
  onConfirm,
  title = '위험성 평가 작성 완료!',
  message = '위험성 평가가 성공적으로 등록되었습니다.',
}: SuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 오버레이 */}
      <div className="absolute inset-0 bg-black/50" />

      {/* 모달 콘텐츠 */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-8 text-center">
        {/* 성공 아이콘 */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle size={36} className="text-green-600" />
          </div>
        </div>

        {/* 제목 */}
        <h2 className="text-xl font-bold text-slate-800 mb-2">
          {title}
        </h2>

        {/* 메시지 */}
        <p className="text-sm text-slate-600 mb-6">
          {message}
        </p>

        {/* 확인 버튼 */}
        <button
          type="button"
          onClick={onConfirm}
          className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
        >
          확인
        </button>
      </div>
    </div>
  );
}

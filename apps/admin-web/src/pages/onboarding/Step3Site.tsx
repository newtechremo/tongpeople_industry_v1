import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Search, Building2, Clock, Hand, Check, X, MapPin, Sparkles } from 'lucide-react';
import type { CheckoutPolicy } from '@tong-pass/shared';
import { useOnboarding } from '@/hooks/useOnboarding';

// Types
type ModalStep = 'none' | 'policy' | 'complete';

// Step3Site Component
export function Step3Site() {
  const navigate = useNavigate();
  const { data, setStep3, nextStep } = useOnboarding();

  // Form state
  const [siteName, setSiteName] = useState(data.step3?.siteName || '');
  const [siteAddress, setSiteAddress] = useState(data.step3?.siteAddress || '');
  const [checkoutPolicy, setCheckoutPolicy] = useState<CheckoutPolicy>(
    data.step3?.checkoutPolicy || 'AUTO_8H'
  );

  // UI state
  const [modalStep, setModalStep] = useState<ModalStep>('none');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handlers
  const handleAddressSearch = () => {
    // Mock address search - would integrate with Daum/Kakao address API
    console.log('[DEV] 현장 주소 검색 API 호출');
    setSiteAddress('대전광역시 유성구 대학로 99');
  };

  const handleCreateClick = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!siteName.trim() || !siteAddress.trim()) return;
    setModalStep('policy');
  };

  const handlePolicySelect = (policy: CheckoutPolicy) => {
    setCheckoutPolicy(policy);
  };

  const handlePolicyConfirm = async () => {
    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Save step data
      setStep3({
        siteName: siteName.trim(),
        siteAddress: siteAddress.trim(),
        checkoutPolicy,
        autoHours: checkoutPolicy === 'AUTO_8H' ? 8 : undefined,
      });

      setModalStep('complete');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = () => {
    setModalStep('none');
    nextStep();
    navigate('/onboarding/step4');
  };

  const handleCloseModal = () => {
    setModalStep('none');
  };

  // Validation
  const isFormValid = siteName.trim() && siteAddress.trim();

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-100 mb-4">
          <Sparkles className="w-4 h-4 text-orange-500" />
          <span className="text-xs font-bold text-orange-600 uppercase tracking-wide">현장 등록</span>
        </div>
        <h2 className="text-3xl font-black tracking-tight text-slate-800">
          첫 번째 현장을 등록해주세요
        </h2>
        <p className="mt-3 text-slate-500">
          현장을 등록하면 바로 서비스를 시작할 수 있습니다
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleCreateClick} className="space-y-5">
        {/* Site Name */}
        <div className="space-y-2">
          <label htmlFor="siteName" className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <Building2 className="w-4 h-4 text-slate-400" />
            현장 이름 <span className="text-red-500">*</span>
          </label>
          <input
            id="siteName"
            type="text"
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            placeholder="예: 대전 공장"
            required
            className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 bg-white text-slate-800 placeholder-slate-400 transition-all duration-200 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 hover:border-gray-200"
          />
        </div>

        {/* Site Address */}
        <div className="space-y-2">
          <label htmlFor="siteAddress" className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <MapPin className="w-4 h-4 text-slate-400" />
            현장 주소 <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-3">
            <input
              id="siteAddress"
              type="text"
              value={siteAddress}
              onChange={(e) => setSiteAddress(e.target.value)}
              placeholder="주소를 검색해주세요"
              required
              readOnly
              className="flex-1 px-5 py-4 rounded-2xl border-2 border-gray-100 bg-gray-50 text-slate-800 placeholder-slate-400 cursor-pointer hover:border-gray-200 transition-all"
              onClick={handleAddressSearch}
            />
            <button
              type="button"
              onClick={handleAddressSearch}
              className="px-5 py-4 rounded-2xl font-bold text-slate-700 bg-white border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all"
              aria-label="주소 검색"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={!isFormValid}
            className="relative flex items-center justify-center gap-3 w-full px-6 py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 hover:-translate-y-0.5 active:translate-y-0"
          >
            <Building2 className="w-5 h-5" />
            <span className="text-lg">현장 생성하기</span>
          </button>
        </div>
      </form>

      {/* Policy Selection Modal */}
      {modalStep === 'policy' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCloseModal} />
          <div className="relative z-10 w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Close button */}
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Content */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 mb-4">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">
                "{siteName}" 퇴근 설정
              </h3>
              <p className="text-sm text-slate-500">
                현장 상황에 맞는 퇴근 방식을 선택해주세요
              </p>
            </div>

            {/* Policy Options */}
            <div className="space-y-3 mb-6">
              {/* AUTO_8H */}
              <button
                type="button"
                onClick={() => handlePolicySelect('AUTO_8H')}
                className={`w-full p-5 rounded-2xl border-2 text-left transition-all duration-200 ${
                  checkoutPolicy === 'AUTO_8H'
                    ? 'border-orange-500 bg-gradient-to-r from-orange-50 to-orange-100/50 shadow-lg shadow-orange-500/10'
                    : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-xl transition-all ${
                      checkoutPolicy === 'AUTO_8H'
                        ? 'bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/30'
                        : 'bg-gray-100'
                    }`}
                  >
                    <Clock
                      className={`w-6 h-6 ${
                        checkoutPolicy === 'AUTO_8H' ? 'text-white' : 'text-slate-500'
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p
                        className={`font-bold ${
                          checkoutPolicy === 'AUTO_8H' ? 'text-orange-600' : 'text-slate-800'
                        }`}
                      >
                        8시간 후 자동 퇴근
                      </p>
                      {checkoutPolicy === 'AUTO_8H' && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-500 text-white">
                          추천
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                      출근 시간 기준 8시간 경과 시 자동으로 퇴근 처리됩니다.
                    </p>
                  </div>
                  {checkoutPolicy === 'AUTO_8H' && (
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-500">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </button>

              {/* MANUAL */}
              <button
                type="button"
                onClick={() => handlePolicySelect('MANUAL')}
                className={`w-full p-5 rounded-2xl border-2 text-left transition-all duration-200 ${
                  checkoutPolicy === 'MANUAL'
                    ? 'border-orange-500 bg-gradient-to-r from-orange-50 to-orange-100/50 shadow-lg shadow-orange-500/10'
                    : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-xl transition-all ${
                      checkoutPolicy === 'MANUAL'
                        ? 'bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/30'
                        : 'bg-gray-100'
                    }`}
                  >
                    <Hand
                      className={`w-6 h-6 ${
                        checkoutPolicy === 'MANUAL' ? 'text-white' : 'text-slate-500'
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <p
                      className={`font-bold ${
                        checkoutPolicy === 'MANUAL' ? 'text-orange-600' : 'text-slate-800'
                      }`}
                    >
                      모바일 앱으로 직접 퇴근
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      근로자가 앱에서 직접 퇴근 버튼을 눌러야 퇴근 처리됩니다.
                    </p>
                  </div>
                  {checkoutPolicy === 'MANUAL' && (
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-500">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </button>
            </div>

            {/* Confirm Button */}
            <button
              onClick={handlePolicyConfirm}
              disabled={isSubmitting}
              className="relative flex items-center justify-center gap-2 w-full px-6 py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all duration-200 disabled:opacity-50 shadow-lg shadow-orange-500/25"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>생성 중...</span>
                </>
              ) : (
                <span className="text-lg">다음</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Complete Modal */}
      {modalStep === 'complete' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl text-center animate-in fade-in zoom-in-95 duration-200">
            {/* Success Icon */}
            <div className="relative inline-block mb-6">
              <div className="flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-green-400 to-green-500 shadow-xl shadow-green-500/30">
                <Check className="w-10 h-10 text-white" />
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-yellow-400 animate-bounce" />
              <div className="absolute -bottom-1 -left-3 w-4 h-4 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="absolute top-0 -left-4 w-3 h-3 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>

            {/* Content */}
            <h3 className="text-2xl font-black text-slate-800 mb-3">
              현장이 생성되었습니다!
            </h3>

            <div className="flex items-center justify-center gap-3 p-4 mb-4 rounded-2xl bg-gradient-to-r from-orange-50 to-orange-100/50 border border-orange-200">
              <Building2 className="w-6 h-6 text-orange-500" />
              <span className="text-lg font-black text-slate-800">{siteName}</span>
            </div>

            <p className="text-sm text-slate-500 mb-6">
              현장 관리자는 <strong className="text-slate-700">{data.step1?.name}</strong> 님입니다.
            </p>

            <div className="flex items-start gap-3 p-4 mb-6 rounded-2xl bg-blue-50 border border-blue-100 text-left">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-white">i</span>
              </div>
              <p className="text-sm text-blue-700">
                구성원을 추가하여 관리자를 변경할 수 있습니다.
              </p>
            </div>

            {/* Confirm Button */}
            <button
              onClick={handleComplete}
              className="relative flex items-center justify-center gap-2 w-full px-6 py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-lg shadow-orange-500/25"
            >
              <span className="text-lg">확인</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Step3Site;

import { useState, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Check, ChevronRight, AlertCircle, Phone, User, Sparkles, Shield, Zap } from 'lucide-react';
import { formatPhone, isValidPhone } from '@tong-pass/shared';
import { useOnboarding } from '@/hooks/useOnboarding';
import { sendSms, verifySms } from '@/api/auth';

// 개발 환경 체크
const IS_DEV = import.meta.env.DEV;

// Types
interface TermsState {
  all: boolean;
  terms: boolean;
  privacy: boolean;
  marketing: boolean;
}

// Step1Personal Component
export function Step1Personal() {
  const navigate = useNavigate();
  const { data, setStep1, nextStep, reset } = useOnboarding();

  // Form state
  const [name, setName] = useState(data.step1?.name || '');
  const [phone, setPhone] = useState(data.step1?.phone || '');
  const [verificationCode, setVerificationCode] = useState('');
  const [terms, setTerms] = useState<TermsState>({
    all: data.step1?.termsAgreed && data.step1?.privacyAgreed && data.step1?.marketingAgreed || false,
    terms: data.step1?.termsAgreed || false,
    privacy: data.step1?.privacyAgreed || false,
    marketing: data.step1?.marketingAgreed || false,
  });

  // Verification state
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isVerified, setIsVerified] = useState(data.step1?.phoneVerified || false);
  const [verificationToken, setVerificationToken] = useState(data.step1?.verificationToken || '');
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Timer state
  const [remainingTime, setRemainingTime] = useState(0);

  // Handlers
  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value.replace(/[^\d]/g, ''));
    setPhone(formatted);
    // Reset verification if phone changes
    if (isVerified) {
      setIsVerified(false);
      setIsCodeSent(false);
      setVerificationCode('');
      setVerificationToken('');
    }
    setCodeError(null);
  };

  const handleSendCode = async () => {
    if (!isValidPhone(phone)) {
      setCodeError('올바른 휴대폰 번호를 입력해주세요.');
      return;
    }

    setSendingCode(true);
    setCodeError(null);

    try {
      const result = await sendSms(phone, 'SIGNUP');

      if (!result.success) {
        const errorMsg = result.error || '인증번호 발송에 실패했습니다.';
        setCodeError(errorMsg);
        return;
      }

      // 개발 환경에서는 콘솔에 인증코드 출력
      if (result.code) {
        console.log(`[DEV] SMS 인증번호: ${result.code}`);
      }

      setIsCodeSent(true);
      setRemainingTime(result.expiresIn || 180); // 3 minutes

      // Start countdown timer
      const timer = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      setCodeError('인증번호 발송에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      setCodeError('인증번호 6자리를 입력해주세요.');
      return;
    }

    setVerifyingCode(true);
    setCodeError(null);

    try {
      const result = await verifySms(phone, verificationCode, 'SIGNUP');

      if (!result.success) {
        setCodeError(result.error || '인증번호가 올바르지 않습니다.');
        return;
      }

      setIsVerified(true);
      setVerificationToken(result.verificationToken || '');
      console.log('[DEV] 인증 성공');
    } catch {
      setCodeError('인증번호가 올바르지 않습니다.');
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleTermsChange = (key: keyof TermsState) => {
    if (key === 'all') {
      const newValue = !terms.all;
      setTerms({
        all: newValue,
        terms: newValue,
        privacy: newValue,
        marketing: newValue,
      });
    } else {
      const newTerms = { ...terms, [key]: !terms[key] };
      newTerms.all = newTerms.terms && newTerms.privacy && newTerms.marketing;
      setTerms(newTerms);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name.trim()) {
      return;
    }
    if (!isVerified) {
      setCodeError('휴대폰 인증을 완료해주세요.');
      return;
    }
    if (!terms.terms || !terms.privacy) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Save step data
      setStep1({
        name: name.trim(),
        phone,
        phoneVerified: true,
        verificationToken,
        termsAgreed: terms.terms,
        privacyAgreed: terms.privacy,
        marketingAgreed: terms.marketing,
      });

      nextStep();
      navigate('/onboarding/step2');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format remaining time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Validation
  const isFormValid = name.trim() && isVerified && terms.terms && terms.privacy;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-100 mb-4">
          <Sparkles className="w-4 h-4 text-orange-500" />
          <span className="text-xs font-bold text-orange-600 uppercase tracking-wide">시작하기</span>
        </div>
        <h2 className="text-3xl font-black tracking-tight text-slate-800">
          통패스 시작하기
        </h2>
        <p className="mt-3 text-slate-500">
          본인 인증을 진행해주세요
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Field */}
        <div className="space-y-2">
          <label htmlFor="name" className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <User className="w-4 h-4 text-slate-400" />
            이름 <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="홍길동"
            required
            className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 bg-white text-slate-800 placeholder-slate-400 transition-all duration-200 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 hover:border-gray-200"
          />
        </div>

        {/* Phone Field */}
        <div className="space-y-2">
          <label htmlFor="phone" className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <Phone className="w-4 h-4 text-slate-400" />
            휴대폰 번호 <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-3">
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="010-1234-5678"
              required
              disabled={isVerified}
              className="flex-1 px-5 py-4 rounded-2xl border-2 border-gray-100 bg-white text-slate-800 placeholder-slate-400 transition-all duration-200 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 hover:border-gray-200 disabled:bg-gray-50 disabled:text-slate-500 disabled:border-gray-100"
            />
            <button
              type="button"
              onClick={handleSendCode}
              disabled={!isValidPhone(phone) || sendingCode || isVerified}
              className="px-6 py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/25 whitespace-nowrap"
            >
              {sendingCode ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isVerified ? (
                <Check className="w-5 h-5" />
              ) : isCodeSent ? (
                '재발송'
              ) : (
                '인증'
              )}
            </button>
          </div>
          {isVerified && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-50 border border-green-100">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500">
                <Check className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-bold text-green-700">인증이 완료되었습니다</span>
            </div>
          )}
        </div>

        {/* Verification Code Field */}
        {isCodeSent && !isVerified && (
          <div className="space-y-2 p-5 rounded-2xl bg-orange-50/50 border border-orange-100">
            <label htmlFor="code" className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <Shield className="w-4 h-4 text-orange-500" />
              인증번호
            </label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="6자리 입력"
                  className="w-full px-5 py-4 rounded-2xl border-2 border-orange-200 bg-white text-slate-800 placeholder-slate-400 transition-all duration-200 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 text-center text-xl font-bold tracking-widest"
                />
                {remainingTime > 0 && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg bg-orange-100 text-sm font-bold text-orange-600">
                    {formatTime(remainingTime)}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleVerifyCode}
                disabled={verificationCode.length !== 6 || verifyingCode}
                className="px-6 py-4 rounded-2xl font-bold text-slate-700 bg-white border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {verifyingCode ? <Loader2 className="w-5 h-5 animate-spin" /> : '확인'}
              </button>
            </div>
          </div>
        )}

        {/* Error Messages */}
        {codeError && (
          <div className="flex items-center gap-2 text-sm font-medium text-red-600">
            <AlertCircle className="w-4 h-4" />
            {codeError}
          </div>
        )}

        {/* Terms Agreement */}
        <div className="space-y-3 pt-6 border-t border-gray-100">
          {/* All Agree */}
          <label className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-orange-50 to-orange-100/50 border border-orange-200 cursor-pointer hover:border-orange-300 transition-all group">
            <div className={`flex items-center justify-center w-6 h-6 rounded-lg border-2 transition-all ${
              terms.all ? 'bg-orange-500 border-orange-500' : 'border-gray-300 group-hover:border-orange-400'
            }`}>
              {terms.all && <Check className="w-4 h-4 text-white" />}
            </div>
            <input
              type="checkbox"
              checked={terms.all}
              onChange={() => handleTermsChange('all')}
              className="sr-only"
            />
            <span className="font-black text-slate-800">전체 동의</span>
          </label>

          {/* Individual Terms */}
          <div className="space-y-2 pl-2">
            {[
              { key: 'terms' as const, label: '이용약관 동의', required: true },
              { key: 'privacy' as const, label: '개인정보 처리방침 동의', required: true },
              { key: 'marketing' as const, label: '마케팅 정보 수신 동의', required: false },
            ].map((item) => (
              <label
                key={item.key}
                className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors group"
              >
                <div className={`flex items-center justify-center w-5 h-5 rounded-md border-2 transition-all ${
                  terms[item.key] ? 'bg-orange-500 border-orange-500' : 'border-gray-300 group-hover:border-orange-400'
                }`}>
                  {terms[item.key] && <Check className="w-3 h-3 text-white" />}
                </div>
                <input
                  type="checkbox"
                  checked={terms[item.key]}
                  onChange={() => handleTermsChange(item.key)}
                  className="sr-only"
                />
                <span className="flex-1 text-sm text-slate-600">
                  <span className={item.required ? 'text-red-500 font-bold' : 'text-slate-400'}>
                    [{item.required ? '필수' : '선택'}]
                  </span>{' '}
                  {item.label}
                </span>
                {item.required && (
                  <button
                    type="button"
                    className="text-xs text-slate-400 hover:text-orange-600 underline transition-colors"
                  >
                    보기
                  </button>
                )}
              </label>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isFormValid || isSubmitting}
          className="relative flex items-center justify-center gap-2 w-full px-6 py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 hover:-translate-y-0.5 active:translate-y-0"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>처리 중...</span>
            </>
          ) : (
            <>
              <span className="text-lg">다음</span>
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>

      {/* Footer links */}
      <div className="mt-8 text-center">
        <p className="text-sm text-slate-400">
          이미 계정이 있으신가요?{' '}
          <a
            href="/login"
            className="font-bold text-orange-600 hover:text-orange-700 transition-colors"
          >
            로그인
          </a>
        </p>
      </div>
    </div>
  );
}

export default Step1Personal;

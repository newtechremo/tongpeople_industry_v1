import { useState, FormEvent, ChangeEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, AlertCircle, Check, Eye, EyeOff, ChevronLeft, Lock } from 'lucide-react';
import { formatPhone, isValidPhone } from '@tong-pass/shared';

// Types
type ResetStep = 'phone' | 'verify' | 'password' | 'complete';

interface PasswordValidation {
  minLength: boolean;
  hasLetter: boolean;
  hasNumber: boolean;
}

// PasswordResetPage Component
export function PasswordResetPage() {
  const navigate = useNavigate();

  // Step state
  const [step, setStep] = useState<ResetStep>('phone');

  // Form state
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);

  // Validation
  const validation: PasswordValidation = {
    minLength: password.length >= 8,
    hasLetter: /[a-zA-Z]/.test(password),
    hasNumber: /\d/.test(password),
  };

  const isPasswordValid = validation.minLength && validation.hasLetter && validation.hasNumber;
  const passwordsMatch = password === passwordConfirm;

  // Handlers
  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value.replace(/[^\d]/g, ''));
    setPhone(formatted);
  };

  const handleSendCode = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!isValidPhone(phone)) {
      setError('올바른 휴대폰 번호를 입력해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Mock SMS sending
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const mockCode = Math.floor(100000 + Math.random() * 900000).toString();
      console.log(`[DEV] 비밀번호 재설정 인증번호: ${mockCode}`);

      setStep('verify');
      setRemainingTime(180);

      // Start countdown
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
      setError('인증번호 발송에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyCode = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (verificationCode.length !== 6) {
      setError('인증번호 6자리를 입력해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Mock verification
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log('[DEV] 인증번호 확인 성공');
      setStep('password');
    } catch {
      setError('인증번호가 올바르지 않습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!isPasswordValid) {
      setError('비밀번호 조건을 확인해주세요.');
      return;
    }

    if (!passwordsMatch) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Mock password reset
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log('[DEV] 비밀번호 재설정 완료');
      setStep('complete');
    } catch {
      setError('비밀번호 재설정에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Render step content
  const renderStepContent = () => {
    switch (step) {
      case 'phone':
        return (
          <>
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-2xl font-black tracking-tight text-slate-800">
                비밀번호 재설정
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                가입 시 등록한 휴대폰 번호로 인증해주세요
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-3 p-4 mb-6 rounded-xl bg-red-50 border border-red-200">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm font-medium text-red-700">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSendCode} className="space-y-5">
              <div>
                <label htmlFor="phone" className="block mb-2 text-sm font-bold text-slate-700">
                  휴대폰 번호
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="010-1234-5678"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-slate-800 placeholder-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={!isValidPhone(phone) || isSubmitting}
                className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>발송 중...</span>
                  </>
                ) : (
                  <span>인증번호 발송</span>
                )}
              </button>
            </form>
          </>
        );

      case 'verify':
        return (
          <>
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-2xl font-black tracking-tight text-slate-800">
                인증번호 입력
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                {formatPhone(phone)}로 발송된 인증번호를 입력해주세요
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-3 p-4 mb-6 rounded-xl bg-red-50 border border-red-200">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm font-medium text-red-700">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleVerifyCode} className="space-y-5">
              <div>
                <label htmlFor="code" className="block mb-2 text-sm font-bold text-slate-700">
                  인증번호
                </label>
                <div className="relative">
                  <input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="6자리 입력"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-slate-800 placeholder-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  {remainingTime > 0 && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-orange-600">
                      {formatTime(remainingTime)}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={verificationCode.length !== 6 || isSubmitting}
                className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>확인 중...</span>
                  </>
                ) : (
                  <span>확인</span>
                )}
              </button>
            </form>

            {/* Resend link */}
            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  setStep('phone');
                  setVerificationCode('');
                }}
                className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
              >
                인증번호 다시 받기
              </button>
            </div>
          </>
        );

      case 'password':
        return (
          <>
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <Lock className="w-6 h-6 text-orange-500" />
                <h2 className="text-2xl font-black tracking-tight text-slate-800">
                  새 비밀번호 설정
                </h2>
              </div>
              <p className="mt-2 text-sm text-slate-500">
                새로 사용할 비밀번호를 입력해주세요
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-3 p-4 mb-6 rounded-xl bg-red-50 border border-red-200">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm font-medium text-red-700">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleResetPassword} className="space-y-5">
              {/* Password */}
              <div>
                <label htmlFor="password" className="block mb-2 text-sm font-bold text-slate-700">
                  새 비밀번호
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="새 비밀번호 입력"
                    required
                    autoComplete="new-password"
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 bg-white text-slate-800 placeholder-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Password Requirements */}
                <div className="mt-3 space-y-1">
                  <div
                    className={`flex items-center gap-2 text-sm ${
                      validation.minLength ? 'text-green-600' : 'text-slate-400'
                    }`}
                  >
                    {validation.minLength ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-current" />
                    )}
                    <span>8자 이상</span>
                  </div>
                  <div
                    className={`flex items-center gap-2 text-sm ${
                      validation.hasLetter ? 'text-green-600' : 'text-slate-400'
                    }`}
                  >
                    {validation.hasLetter ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-current" />
                    )}
                    <span>영문 포함</span>
                  </div>
                  <div
                    className={`flex items-center gap-2 text-sm ${
                      validation.hasNumber ? 'text-green-600' : 'text-slate-400'
                    }`}
                  >
                    {validation.hasNumber ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-current" />
                    )}
                    <span>숫자 포함</span>
                  </div>
                </div>
              </div>

              {/* Password Confirm */}
              <div>
                <label
                  htmlFor="passwordConfirm"
                  className="block mb-2 text-sm font-bold text-slate-700"
                >
                  새 비밀번호 확인
                </label>
                <div className="relative">
                  <input
                    id="passwordConfirm"
                    type={showPasswordConfirm ? 'text' : 'password'}
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    placeholder="비밀번호 다시 입력"
                    required
                    autoComplete="new-password"
                    className={`w-full px-4 py-3 pr-12 rounded-xl border bg-white text-slate-800 placeholder-slate-400 transition-all focus:outline-none focus:ring-2 focus:border-transparent ${
                      passwordConfirm && !passwordsMatch
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-200 focus:ring-orange-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showPasswordConfirm ? '비밀번호 숨기기' : '비밀번호 보기'}
                  >
                    {showPasswordConfirm ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {passwordConfirm && !passwordsMatch && (
                  <p className="mt-2 text-sm font-medium text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    비밀번호가 일치하지 않습니다
                  </p>
                )}
                {passwordConfirm && passwordsMatch && (
                  <p className="mt-2 text-sm font-medium text-green-600 flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    비밀번호가 일치합니다
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={!isPasswordValid || !passwordsMatch || isSubmitting}
                className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>처리 중...</span>
                  </>
                ) : (
                  <span>비밀번호 변경</span>
                )}
              </button>
            </form>
          </>
        );

      case 'complete':
        return (
          <div className="text-center py-8">
            {/* Success Icon */}
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-green-100">
              <Check className="w-8 h-8 text-green-600" />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-black tracking-tight text-slate-800 mb-2">
              비밀번호가 변경되었습니다
            </h2>
            <p className="text-sm text-slate-500 mb-8">
              새 비밀번호로 로그인해주세요
            </p>

            {/* Login Button */}
            <button
              onClick={handleGoToLogin}
              className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all"
            >
              <span>로그인하기</span>
            </button>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-orange-50 to-white">
      {/* Left side - Branding (desktop) */}
      <div className="hidden lg:flex lg:w-2/5 flex-col justify-center items-center p-12 bg-gradient-to-br from-orange-500 to-orange-600">
        <div className="max-w-md text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm">
              <span className="text-4xl font-black text-white">T</span>
            </div>
          </div>
          <h1 className="mb-4 text-4xl font-black tracking-tight text-white">통패스</h1>
          <p className="mb-2 text-xl font-bold text-white/90">산업현장통 2.0</p>
          <p className="text-lg text-white/80">QR 코드 기반 산업현장 출퇴근 관리 서비스</p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex flex-1 flex-col justify-center items-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Back to login */}
          {step !== 'complete' && (
            <Link
              to="/login"
              className="inline-flex items-center gap-1 mb-6 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>로그인으로 돌아가기</span>
            </Link>
          )}

          {/* Mobile Logo */}
          <div className="mb-8 text-center lg:hidden">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600">
              <span className="text-3xl font-black text-white">T</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800">통패스</h1>
            <p className="text-sm text-slate-500">산업현장통 2.0</p>
          </div>

          {/* Step content */}
          {renderStepContent()}

          {/* Copyright */}
          <div className="mt-12 text-center">
            <p className="text-xs text-slate-400">
              &copy; {new Date().getFullYear()} 통하는사람들. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PasswordResetPage;

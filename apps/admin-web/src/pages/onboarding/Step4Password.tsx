import { useState, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Eye, EyeOff, Check, AlertCircle, Lock, Mail, Shield, Sparkles } from 'lucide-react';
import { formatPhone } from '@tong-pass/shared';
import { useOnboarding } from '@/hooks/useOnboarding';

// Types
interface PasswordValidation {
  minLength: boolean;
  hasLetter: boolean;
  hasNumber: boolean;
}

// Step4Password Component
export function Step4Password() {
  const navigate = useNavigate();
  const { data, setStep4, nextStep } = useOnboarding();

  // Form state
  const [password, setPassword] = useState(data.step4?.password || '');
  const [passwordConfirm, setPasswordConfirm] = useState(data.step4?.passwordConfirm || '');
  const [email, setEmail] = useState(data.step4?.email || '');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState({
    password: false,
    passwordConfirm: false,
    email: false,
  });

  // Validation
  const validation: PasswordValidation = {
    minLength: password.length >= 8,
    hasLetter: /[a-zA-Z]/.test(password),
    hasNumber: /\d/.test(password),
  };

  const isPasswordValid = validation.minLength && validation.hasLetter && validation.hasNumber;
  const passwordsMatch = password === passwordConfirm;
  const isEmailValid = !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Handlers
  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handlePasswordConfirmChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPasswordConfirm(e.target.value);
  };

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleBlur = (field: keyof typeof touched) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isPasswordValid || !passwordsMatch) {
      return;
    }

    if (email && !isEmailValid) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Save step data
      setStep4({
        password,
        passwordConfirm,
        email: email || undefined,
      });

      nextStep();
      navigate('/onboarding/step5');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Form validation
  const isFormValid = isPasswordValid && passwordsMatch && (email ? isEmailValid : true);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-100 mb-4">
          <Sparkles className="w-4 h-4 text-orange-500" />
          <span className="text-xs font-bold text-orange-600 uppercase tracking-wide">마지막 단계</span>
        </div>
        <h2 className="text-3xl font-black tracking-tight text-slate-800">
          비밀번호를 설정해주세요
        </h2>
        <p className="mt-3 text-slate-500">
          안전한 서비스 이용을 위해 비밀번호를 설정합니다
        </p>
      </div>

      {/* Phone verification status */}
      <div className="flex items-center gap-4 p-5 mb-8 rounded-2xl bg-gradient-to-r from-green-50 to-green-100/50 border border-green-200">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-green-500 shadow-lg shadow-green-500/30">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="font-bold text-green-700">휴대폰 인증 완료</p>
          <p className="text-sm text-green-600">{formatPhone(data.step1?.phone || '')}</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Password */}
        <div className="space-y-2">
          <label htmlFor="password" className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <Lock className="w-4 h-4 text-slate-400" />
            비밀번호 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={handlePasswordChange}
              onBlur={() => handleBlur('password')}
              placeholder="비밀번호를 입력하세요"
              required
              autoComplete="new-password"
              className={`w-full px-5 py-4 pr-14 rounded-2xl border-2 bg-white text-slate-800 placeholder-slate-400 transition-all duration-200 focus:outline-none focus:ring-4 ${
                touched.password && !isPasswordValid
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                  : 'border-gray-100 focus:border-orange-500 focus:ring-orange-500/10 hover:border-gray-200'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
              aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {/* Password Requirements */}
          <div className="flex flex-wrap gap-2 mt-3">
            {[
              { key: 'minLength', label: '8자 이상', valid: validation.minLength },
              { key: 'hasLetter', label: '영문 포함', valid: validation.hasLetter },
              { key: 'hasNumber', label: '숫자 포함', valid: validation.hasNumber },
            ].map((req) => (
              <div
                key={req.key}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  req.valid
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-slate-400'
                }`}
              >
                {req.valid ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-current" />
                )}
                <span>{req.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Password Confirm */}
        <div className="space-y-2">
          <label htmlFor="passwordConfirm" className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <Lock className="w-4 h-4 text-slate-400" />
            비밀번호 확인 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              id="passwordConfirm"
              type={showPasswordConfirm ? 'text' : 'password'}
              value={passwordConfirm}
              onChange={handlePasswordConfirmChange}
              onBlur={() => handleBlur('passwordConfirm')}
              placeholder="비밀번호를 다시 입력하세요"
              required
              autoComplete="new-password"
              className={`w-full px-5 py-4 pr-14 rounded-2xl border-2 bg-white text-slate-800 placeholder-slate-400 transition-all duration-200 focus:outline-none focus:ring-4 ${
                touched.passwordConfirm && passwordConfirm && !passwordsMatch
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                  : 'border-gray-100 focus:border-orange-500 focus:ring-orange-500/10 hover:border-gray-200'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
              aria-label={showPasswordConfirm ? '비밀번호 숨기기' : '비밀번호 보기'}
            >
              {showPasswordConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {touched.passwordConfirm && passwordConfirm && !passwordsMatch && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium text-red-700">비밀번호가 일치하지 않습니다</span>
            </div>
          )}
          {passwordConfirm && passwordsMatch && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-50 border border-green-100">
              <Check className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-green-700">비밀번호가 일치합니다</span>
            </div>
          )}
        </div>

        {/* Optional Section Divider */}
        <div className="pt-6 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-400 mb-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span>선택 입력</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
        </div>

        {/* Email (Optional) */}
        <div className="space-y-2">
          <label htmlFor="email" className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <Mail className="w-4 h-4 text-slate-400" />
            이메일
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={handleEmailChange}
            onBlur={() => handleBlur('email')}
            placeholder="admin@company.com"
            autoComplete="email"
            className={`w-full px-5 py-4 rounded-2xl border-2 bg-white text-slate-800 placeholder-slate-400 transition-all duration-200 focus:outline-none focus:ring-4 ${
              touched.email && email && !isEmailValid
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                : 'border-gray-100 focus:border-orange-500 focus:ring-orange-500/10 hover:border-gray-200'
            }`}
          />
          <p className="flex items-center gap-2 text-xs text-slate-400">
            <span className="flex items-center justify-center w-4 h-4 rounded-full bg-slate-200 text-slate-500 text-[10px] font-bold">i</span>
            알림 및 비밀번호 재설정에 사용됩니다
          </p>
          {touched.email && email && !isEmailValid && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium text-red-700">올바른 이메일 형식을 입력해주세요</span>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-4">
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
              <span className="text-lg">가입 완료</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default Step4Password;

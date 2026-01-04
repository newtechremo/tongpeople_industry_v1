import { useState, FormEvent, ChangeEvent } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Loader2, AlertCircle, Eye, EyeOff, QrCode, Users, Shield, Sparkles } from 'lucide-react';
import { formatPhone, isValidPhone } from '@tong-pass/shared';
import { useAuth } from '@/context/AuthContext';

// Types
interface LocationState {
  from?: {
    pathname: string;
  };
}

// Floating decoration component
function FloatingDot({ className, delay = 0 }: { className: string; delay?: number }) {
  return (
    <div
      className={`absolute rounded-full animate-float ${className}`}
      style={{ animationDelay: `${delay}s` }}
    />
  );
}

// Feature card component
function FeatureCard({ icon: Icon, title, description }: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="group flex items-start gap-4 p-5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 group-hover:bg-white/30 transition-colors">
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <h3 className="font-bold text-white mb-1">{title}</h3>
        <p className="text-sm text-white/70">{description}</p>
      </div>
    </div>
  );
}

// LoginPage Component
export function LoginPage() {
  // Hooks
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading } = useAuth();

  // State
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get redirect path
  const from = (location.state as LocationState)?.from?.pathname || '/';

  // Handlers
  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value.replace(/[^\d]/g, ''));
    setPhone(formatted);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!isValidPhone(phone)) {
      setError('올바른 휴대폰 번호를 입력해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      await login(phone, password);
      navigate(from, { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : '로그인에 실패했습니다.';

      // User-friendly error messages
      if (message.includes('Invalid login credentials')) {
        setError('휴대폰 번호 또는 비밀번호가 올바르지 않습니다.');
      } else if (message.includes('not found')) {
        setError('등록되지 않은 휴대폰 번호입니다.');
      } else {
        setError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  // Render
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-white">
      {/* Custom animation styles */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
      `}</style>

      {/* Left side - Branding (fixed, 50% width on lg+) */}
      <div className="hidden lg:flex fixed left-0 top-0 w-1/2 h-screen flex-col justify-center items-center p-12 bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        {/* Floating decorative elements */}
        <FloatingDot className="w-4 h-4 bg-white/30 top-20 left-20" delay={0} />
        <FloatingDot className="w-6 h-6 bg-yellow-300/40 top-32 right-24" delay={1} />
        <FloatingDot className="w-3 h-3 bg-white/40 bottom-40 left-32" delay={2} />
        <FloatingDot className="w-5 h-5 bg-orange-300/50 bottom-28 right-20" delay={0.5} />
        <FloatingDot className="w-8 h-8 bg-white/20 top-1/2 left-16" delay={1.5} />

        {/* Glowing orbs */}
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-orange-400/30 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-yellow-400/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />

        <div className="relative z-10 max-w-md text-center">
          {/* Logo */}
          <div className="mb-10">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white shadow-2xl shadow-orange-900/30">
              <span className="text-5xl font-black bg-gradient-to-br from-orange-500 to-orange-600 bg-clip-text text-transparent">T</span>
            </div>
          </div>

          {/* Title */}
          <div className="mb-4 flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-300" />
            <span className="text-sm font-bold text-white/80 uppercase tracking-widest">Industrial Safety Solution</span>
            <Sparkles className="w-5 h-5 text-yellow-300" />
          </div>
          <h1 className="mb-3 text-5xl font-black tracking-tight text-white">
            통패스
          </h1>
          <p className="mb-2 text-xl font-bold text-white/90">
            산업현장통 2.0
          </p>
          <p className="text-lg text-white/70">
            QR 코드 기반 산업현장 출퇴근 관리 서비스
          </p>

          {/* Feature cards */}
          <div className="mt-12 space-y-4">
            <FeatureCard
              icon={QrCode}
              title="동적 QR 출퇴근"
              description="캡처 방지 기술로 안전한 출퇴근 인증"
            />
            <FeatureCard
              icon={Users}
              title="실시간 인원 현황"
              description="현장별 출근/퇴근 현황을 한눈에 파악"
            />
            <FeatureCard
              icon={Shield}
              title="고령 근로자 관리"
              description="65세 이상 근로자 안전 모니터링"
            />
          </div>
        </div>
      </div>

      {/* Right side - Login Form (50% width on lg+, centered content) */}
      <div className="min-h-screen flex flex-col justify-center items-center p-6 lg:p-12 lg:ml-[50%] lg:w-1/2">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="mb-10 text-center lg:hidden">
            <div className="inline-flex items-center justify-center w-20 h-20 mb-5 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-xl shadow-orange-500/30">
              <span className="text-4xl font-black text-white">T</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-800">통패스</h1>
            <p className="text-sm text-slate-500 mt-1">산업현장통 2.0</p>
          </div>

          {/* Form Header */}
          <div className="mb-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-100 mb-4">
              <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-xs font-bold text-orange-600 uppercase tracking-wide">Admin Portal</span>
            </div>
            <h2 className="text-3xl font-black tracking-tight text-slate-800">
              관리자 로그인
            </h2>
            <p className="mt-3 text-slate-500">
              계정에 로그인하여 대시보드에 접속하세요
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-3 p-4 mb-6 rounded-2xl bg-red-50 border border-red-100 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-100">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-sm font-medium text-red-700">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Phone Field */}
            <div className="group">
              <label
                htmlFor="phone"
                className="block mb-2.5 text-sm font-bold text-slate-700"
              >
                휴대폰 번호
              </label>
              <div className="relative">
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="010-1234-5678"
                  required
                  autoComplete="tel"
                  className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 bg-white text-slate-800 placeholder-slate-400 transition-all duration-200 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 hover:border-gray-200"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="group">
              <label
                htmlFor="password"
                className="block mb-2.5 text-sm font-bold text-slate-700"
              >
                비밀번호
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  required
                  autoComplete="current-password"
                  className="w-full px-5 py-4 pr-14 rounded-2xl border-2 border-gray-100 bg-white text-slate-800 placeholder-slate-400 transition-all duration-200 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 hover:border-gray-200"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                  aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <Link
                to="/password-reset"
                className="text-sm font-bold text-orange-600 hover:text-orange-700 transition-colors"
              >
                비밀번호를 잊으셨나요?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="relative flex items-center justify-center gap-2 w-full px-6 py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 hover:-translate-y-0.5 active:translate-y-0"
            >
              {isSubmitting || loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>로그인 중...</span>
                </>
              ) : (
                <span className="text-lg">로그인</span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">또는</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
          </div>

          {/* Sign up link */}
          <div className="text-center">
            <Link
              to="/onboarding/step1"
              className="inline-flex items-center justify-center gap-2 w-full px-6 py-4 rounded-2xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all duration-200"
            >
              <span>신규 회원가입</span>
            </Link>
          </div>

          {/* Support link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-400">
              로그인에 문제가 있으신가요?{' '}
              <a
                href="mailto:support@tongpass.com"
                className="font-bold text-orange-600 hover:text-orange-700 transition-colors"
              >
                관리자에게 문의
              </a>
            </p>
          </div>

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

export default LoginPage;

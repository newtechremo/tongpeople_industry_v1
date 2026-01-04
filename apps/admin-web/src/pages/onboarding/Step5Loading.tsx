import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Loader2, Building2, Users, Shield, LayoutDashboard, AlertCircle } from 'lucide-react';
import { useOnboarding } from '@/hooks/useOnboarding';
import { signup } from '@/api/auth';

// Types
interface LoadingStep {
  id: string;
  label: string;
  activeLabel: string;
  status: 'pending' | 'loading' | 'completed' | 'error';
  icon: React.ElementType;
}

// Step5Loading Component
export function Step5Loading() {
  const navigate = useNavigate();
  const { data, nextStep, reset } = useOnboarding();
  const hasStarted = useRef(false);

  // State
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<LoadingStep[]>([
    { id: 'company', label: '회사 정보 저장 완료', activeLabel: '회사 정보 저장 중...', status: 'pending', icon: Building2 },
    { id: 'site', label: '현장 생성 완료', activeLabel: '현장 생성 중...', status: 'pending', icon: Building2 },
    { id: 'admin', label: '관리자 권한 설정 완료', activeLabel: '관리자 권한 설정 중...', status: 'pending', icon: Users },
    { id: 'dashboard', label: '대시보드 준비 완료', activeLabel: '대시보드 준비 중...', status: 'pending', icon: LayoutDashboard },
  ]);

  // Call signup API
  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const processSignup = async () => {
      // Validate data
      if (!data.step1 || !data.step2 || !data.step3 || !data.step4) {
        setError('회원가입 정보가 누락되었습니다. 처음부터 다시 진행해주세요.');
        return;
      }

      // Update step 1: company
      setSteps(prev => prev.map((step, i) => ({ ...step, status: i === 0 ? 'loading' : step.status })));
      setProgress(10);

      try {
        // Simulate progress animation while API call is in progress
        const progressInterval = setInterval(() => {
          setProgress(prev => Math.min(prev + 5, 80));
        }, 200);

        // Call signup API
        const result = await signup({
          verificationToken: data.step1.verificationToken || '',
          name: data.step1.name,
          phone: data.step1.phone,
          termsAgreed: data.step1.termsAgreed,
          privacyAgreed: data.step1.privacyAgreed,
          marketingAgreed: data.step1.marketingAgreed,
          companyName: data.step2.companyName,
          businessNumber: data.step2.businessNumber,
          ceoName: data.step2.ceoName,
          companyAddress: data.step2.address,
          employeeCountRange: data.step2.employeeCountRange,
          siteName: data.step3.siteName,
          siteAddress: data.step3.siteAddress,
          password: data.step4.password,
        });

        clearInterval(progressInterval);

        if (!result.success) {
          setError(result.error || '회원가입에 실패했습니다.');
          setSteps(prev => prev.map((step, i) => ({ ...step, status: i === 0 ? 'error' : step.status })));
          return;
        }

        // Success! Animate the rest
        const stepDurations = [300, 300, 300, 300];

        for (let i = 0; i < steps.length; i++) {
          // Complete current step
          setSteps(prev => prev.map((step, idx) => ({
            ...step,
            status: idx <= i ? 'completed' : idx === i + 1 ? 'loading' : step.status,
          })));
          setProgress(((i + 1) / steps.length) * 100);
          await new Promise(resolve => setTimeout(resolve, stepDurations[i]));
        }

        // Clear onboarding data and navigate to completion
        setTimeout(() => {
          nextStep();
          navigate('/onboarding/step6');
        }, 500);

      } catch (err) {
        console.error('Signup error:', err);
        setError('서버 오류가 발생했습니다. 다시 시도해주세요.');
        setSteps(prev => prev.map(step => ({ ...step, status: step.status === 'loading' ? 'error' : step.status })));
      }
    };

    // Start process after a short delay
    const timer = setTimeout(processSignup, 300);
    return () => clearTimeout(timer);
  }, [data, navigate, nextStep, steps.length]);

  // Handle retry
  const handleRetry = () => {
    reset();
    navigate('/onboarding/step1');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px]">
      {/* Site name animation */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-orange-50 to-orange-100/50 border border-orange-200 shadow-lg shadow-orange-500/10">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-orange-600">현장 설정 중</p>
            <p className="text-xl font-black text-slate-800">
              {data.step3?.siteName || '현장'}
            </p>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="w-full max-w-sm mb-6 p-4 rounded-2xl bg-red-50 border border-red-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-red-700">오류가 발생했습니다</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={handleRetry}
            className="mt-4 w-full px-4 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors"
          >
            처음부터 다시 시작
          </button>
        </div>
      )}

      {/* Progress Bar */}
      {!error && (
        <div className="w-full max-w-sm mb-10">
          <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
            {/* Shimmer effect */}
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              style={{
                transform: 'translateX(-100%)',
                animation: 'shimmer 2s infinite',
              }}
            />
          </div>
          <p className="mt-3 text-center text-lg font-black text-orange-600">
            {Math.round(progress)}%
          </p>
        </div>
      )}

      {/* Step Status */}
      <div className="w-full max-w-sm space-y-3">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.id}
              className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 ${
                step.status === 'completed'
                  ? 'bg-gradient-to-r from-green-50 to-green-100/50 border border-green-200'
                  : step.status === 'loading'
                  ? 'bg-gradient-to-r from-orange-50 to-orange-100/50 border border-orange-200 shadow-lg shadow-orange-500/10'
                  : step.status === 'error'
                  ? 'bg-gradient-to-r from-red-50 to-red-100/50 border border-red-200'
                  : 'bg-gray-50 border border-gray-100'
              }`}
            >
              {/* Status Icon */}
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all ${
                  step.status === 'completed'
                    ? 'bg-gradient-to-br from-green-400 to-green-500 shadow-lg shadow-green-500/30'
                    : step.status === 'loading'
                    ? 'bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/30'
                    : step.status === 'error'
                    ? 'bg-gradient-to-br from-red-400 to-red-500 shadow-lg shadow-red-500/30'
                    : 'bg-gray-200'
                }`}
              >
                {step.status === 'completed' ? (
                  <Check className="w-5 h-5 text-white" />
                ) : step.status === 'loading' ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : step.status === 'error' ? (
                  <AlertCircle className="w-5 h-5 text-white" />
                ) : (
                  <Icon className="w-5 h-5 text-slate-400" />
                )}
              </div>

              {/* Label */}
              <span
                className={`flex-1 font-bold ${
                  step.status === 'completed'
                    ? 'text-green-700'
                    : step.status === 'loading'
                    ? 'text-orange-700'
                    : step.status === 'error'
                    ? 'text-red-700'
                    : 'text-slate-400'
                }`}
              >
                {step.status === 'loading' ? step.activeLabel : step.status === 'error' ? '오류 발생' : step.label}
              </span>

              {/* Shield icon for security */}
              {step.id === 'admin' && step.status === 'completed' && (
                <Shield className="w-5 h-5 text-green-500" />
              )}
            </div>
          );
        })}
      </div>

      {/* Custom animation styles */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}

export default Step5Loading;

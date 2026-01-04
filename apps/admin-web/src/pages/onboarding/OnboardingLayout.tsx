import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Check, ChevronLeft, User, Building2, MapPin, Lock, Sparkles } from 'lucide-react';

// Types
interface StepInfo {
  number: number;
  label: string;
  path: string;
  icon: React.ElementType;
  description: string;
}

// Step definitions
const STEPS: StepInfo[] = [
  { number: 1, label: '본인 인증', path: '/onboarding/step1', icon: User, description: '휴대폰 인증으로 본인 확인' },
  { number: 2, label: '회사 정보', path: '/onboarding/step2', icon: Building2, description: '회사 및 사업자 정보 입력' },
  { number: 3, label: '현장 생성', path: '/onboarding/step3', icon: MapPin, description: '첫 번째 현장 등록하기' },
  { number: 4, label: '비밀번호', path: '/onboarding/step4', icon: Lock, description: '로그인 비밀번호 설정' },
];

// Floating decoration component
function FloatingDot({ className, delay = 0 }: { className: string; delay?: number }) {
  return (
    <div
      className={`absolute rounded-full animate-float ${className}`}
      style={{ animationDelay: `${delay}s` }}
    />
  );
}

// Step Indicator Component
function StepIndicator({ step, currentStep }: { step: StepInfo; currentStep: number }) {
  const isCompleted = currentStep > step.number;
  const isCurrent = currentStep === step.number;
  const isPending = currentStep < step.number;
  const Icon = step.icon;

  return (
    <div className="flex flex-col items-center">
      {/* Circle */}
      <div
        className={`
          relative flex items-center justify-center w-12 h-12 rounded-2xl font-bold text-sm transition-all duration-500
          ${isCompleted ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30' : ''}
          ${isCurrent ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white ring-4 ring-orange-100 shadow-lg shadow-orange-500/30 scale-110' : ''}
          ${isPending ? 'bg-gray-100 text-slate-400' : ''}
        `}
      >
        {isCompleted ? (
          <Check className="w-5 h-5" />
        ) : (
          <Icon className="w-5 h-5" />
        )}
      </div>
      {/* Label */}
      <span
        className={`
          mt-3 text-xs font-bold transition-all duration-300
          ${isCurrent ? 'text-orange-600' : ''}
          ${isCompleted ? 'text-slate-600' : ''}
          ${isPending ? 'text-slate-400' : ''}
        `}
      >
        {step.label}
      </span>
    </div>
  );
}

// Line between steps
function StepLine({ isCompleted }: { isCompleted: boolean }) {
  return (
    <div className="flex-1 mx-3 mt-6 h-1 rounded-full overflow-hidden bg-gray-100">
      <div
        className={`h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-700 ${
          isCompleted ? 'w-full' : 'w-0'
        }`}
      />
    </div>
  );
}

// Left panel content based on current step
function LeftPanelContent({ currentStep }: { currentStep: number }) {
  const stepInfo = STEPS[currentStep - 1] || STEPS[0];
  const Icon = stepInfo?.icon || User;

  const benefits = [
    { step: 1, items: ['SMS 인증으로 간편하게', '30초만에 본인 확인', '안전한 휴대폰 인증'] },
    { step: 2, items: ['사업자 정보 자동 검증', '업종별 맞춤 설정', '고령자 관리 기준 설정'] },
    { step: 3, items: ['현장별 출퇴근 정책 설정', '자동/수동 퇴근 모드', 'GPS 연동 (예정)'] },
    { step: 4, items: ['안전한 비밀번호 설정', '영문+숫자 조합', '로그인 준비 완료'] },
  ];

  const currentBenefits = benefits[currentStep - 1]?.items || benefits[0].items;

  return (
    <div className="relative z-10 max-w-md text-center">
      {/* Step icon */}
      <div className="mb-8">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white shadow-2xl shadow-orange-900/30">
          <Icon className="w-12 h-12 text-orange-500" />
        </div>
      </div>

      {/* Title */}
      <div className="mb-4 flex items-center justify-center gap-2">
        <Sparkles className="w-5 h-5 text-yellow-300" />
        <span className="text-sm font-bold text-white/80 uppercase tracking-widest">
          STEP {currentStep} OF 4
        </span>
        <Sparkles className="w-5 h-5 text-yellow-300" />
      </div>
      <h1 className="mb-3 text-4xl font-black tracking-tight text-white">
        {stepInfo?.label || '시작하기'}
      </h1>
      <p className="text-lg text-white/70">
        {stepInfo?.description || '통패스 시작을 위한 간단한 설정'}
      </p>

      {/* Benefits */}
      <div className="mt-12 space-y-4">
        {currentBenefits.map((benefit, index) => (
          <div
            key={index}
            className="flex items-center gap-3 p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/20">
              <Check className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-medium text-white">{benefit}</span>
          </div>
        ))}
      </div>

      {/* Progress indicator */}
      <div className="mt-12 flex items-center justify-center gap-2">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`h-2 rounded-full transition-all duration-500 ${
              step === currentStep
                ? 'w-8 bg-white'
                : step < currentStep
                ? 'w-2 bg-white/60'
                : 'w-2 bg-white/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// OnboardingLayout Component
export function OnboardingLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine current step from URL
  const getCurrentStep = (): number => {
    const path = location.pathname;
    if (path.includes('step1')) return 1;
    if (path.includes('step2')) return 2;
    if (path.includes('step3')) return 3;
    if (path.includes('step4')) return 4;
    if (path.includes('step5')) return 5;
    if (path.includes('step6')) return 6;
    return 1;
  };

  const currentStep = getCurrentStep();
  const showBackButton = currentStep > 1 && currentStep <= 4;
  const showStepIndicator = currentStep >= 1 && currentStep <= 4;
  const showLeftPanel = currentStep >= 1 && currentStep <= 4;

  const handleBack = () => {
    if (currentStep > 1 && currentStep <= 4) {
      navigate(`/onboarding/step${currentStep - 1}`);
    }
  };

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

      {/* Left side - Branding (desktop only, fixed 50% width) */}
      {showLeftPanel && (
        <div className="hidden lg:flex fixed left-0 top-0 w-1/2 h-screen flex-col justify-center items-center p-12 bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>

          {/* Floating decorative elements */}
          <FloatingDot className="w-4 h-4 bg-white/30 top-20 left-20" delay={0} />
          <FloatingDot className="w-6 h-6 bg-yellow-300/40 top-32 right-16" delay={1} />
          <FloatingDot className="w-3 h-3 bg-white/40 bottom-40 left-24" delay={2} />
          <FloatingDot className="w-5 h-5 bg-orange-300/50 bottom-28 right-12" delay={0.5} />

          {/* Glowing orbs */}
          <div className="absolute top-1/4 right-1/4 w-48 h-48 bg-orange-400/30 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-1/4 left-1/4 w-36 h-36 bg-yellow-400/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />

          <LeftPanelContent currentStep={currentStep} />
        </div>
      )}

      {/* Right side - Form content (50% width on lg+, centered) */}
      <div className={`min-h-screen flex flex-col ${showLeftPanel ? 'lg:ml-[50%] lg:w-1/2' : ''}`}>
        {/* Header with step indicator */}
        <header className="p-6 lg:p-8">
          {/* Mobile Logo + Back */}
          <div className="flex items-center justify-between mb-8 lg:hidden">
            {showBackButton ? (
              <button
                onClick={handleBack}
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all"
                aria-label="이전 단계로"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>이전</span>
              </button>
            ) : (
              <div />
            )}
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/30">
                <span className="text-xl font-black text-white">T</span>
              </div>
              <span className="text-xl font-black text-slate-800">통패스</span>
            </div>
            <div className="w-20" /> {/* Spacer for centering */}
          </div>

          {/* Step Indicator */}
          {showStepIndicator && (
            <div className="flex items-start justify-center max-w-lg mx-auto">
              {STEPS.map((step, index) => (
                <div key={step.number} className="flex items-start flex-1">
                  <StepIndicator step={step} currentStep={currentStep} />
                  {index < STEPS.length - 1 && (
                    <StepLine isCompleted={currentStep > step.number} />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Desktop back button */}
          {showBackButton && (
            <div className="hidden lg:block mt-8">
              <button
                onClick={handleBack}
                className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all"
                aria-label="이전 단계로"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>이전 단계</span>
              </button>
            </div>
          )}
        </header>

        {/* Main content area */}
        <main className="flex-1 flex items-start justify-center px-6 pb-12 lg:px-12">
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </main>

        {/* Footer */}
        <footer className="p-6 text-center">
          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} 통하는사람들. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}

export default OnboardingLayout;

import { useNavigate } from 'react-router-dom';
import { UserPlus, Users, LayoutDashboard, PartyPopper, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { useOnboarding } from '@/hooks/useOnboarding';

// Action card component
function ActionCard({
  icon: Icon,
  title,
  description,
  onClick,
  primary = false,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`group flex items-center gap-4 w-full p-5 rounded-2xl text-left transition-all duration-200 ${
        primary
          ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-xl shadow-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/40 hover:-translate-y-1'
          : 'bg-white border-2 border-gray-100 hover:border-orange-200 hover:bg-orange-50/50 hover:-translate-y-0.5'
      }`}
    >
      <div
        className={`flex items-center justify-center w-12 h-12 rounded-xl transition-all ${
          primary
            ? 'bg-white/20 group-hover:bg-white/30'
            : 'bg-gray-100 group-hover:bg-orange-100'
        }`}
      >
        <Icon
          className={`w-6 h-6 ${
            primary ? 'text-white' : 'text-slate-600 group-hover:text-orange-600'
          }`}
        />
      </div>
      <div className="flex-1">
        <p className={`font-bold ${primary ? 'text-white' : 'text-slate-800'}`}>
          {title}
        </p>
        <p
          className={`text-sm ${
            primary ? 'text-white/70' : 'text-slate-500'
          }`}
        >
          {description}
        </p>
      </div>
      <ArrowRight
        className={`w-5 h-5 transition-transform group-hover:translate-x-1 ${
          primary ? 'text-white/70' : 'text-slate-400 group-hover:text-orange-500'
        }`}
      />
    </button>
  );
}

// Step6Complete Component
export function Step6Complete() {
  const navigate = useNavigate();
  const { reset } = useOnboarding();

  // Handlers
  const handleInviteWorkers = () => {
    // Clear onboarding data and navigate to workers page with invite modal
    reset();
    navigate('/workers', { state: { openModal: 'add' } });
  };

  const handleAddAdmin = () => {
    // Clear onboarding data and navigate to settings with admin section
    reset();
    navigate('/settings', { state: { tab: 'admins', openModal: 'add' } });
  };

  const handleGoToDashboard = () => {
    // Clear onboarding data and navigate to dashboard
    reset();
    navigate('/');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[550px] text-center">
      {/* Success Icon with confetti effect */}
      <div className="relative mb-8">
        {/* Main icon */}
        <div className="relative">
          <div className="flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-2xl shadow-orange-500/40">
            <PartyPopper className="w-12 h-12 text-white" />
          </div>

          {/* Decorative floating elements */}
          <div className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-yellow-400 animate-bounce shadow-lg" />
          <div
            className="absolute -bottom-2 -left-4 w-5 h-5 rounded-full bg-green-400 animate-bounce shadow-lg"
            style={{ animationDelay: '0.1s' }}
          />
          <div
            className="absolute top-1 -left-5 w-4 h-4 rounded-full bg-blue-400 animate-bounce shadow-lg"
            style={{ animationDelay: '0.2s' }}
          />
          <div
            className="absolute -top-1 left-1/2 w-3 h-3 rounded-full bg-pink-400 animate-bounce shadow-lg"
            style={{ animationDelay: '0.3s' }}
          />
          <div
            className="absolute bottom-0 -right-3 w-4 h-4 rounded-full bg-purple-400 animate-bounce shadow-lg"
            style={{ animationDelay: '0.15s' }}
          />
        </div>

        {/* Sparkle effects */}
        <Sparkles className="absolute -top-6 right-4 w-6 h-6 text-yellow-400 animate-pulse" />
        <Sparkles className="absolute -bottom-4 -left-6 w-5 h-5 text-orange-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      {/* Title */}
      <div className="mb-2 flex items-center justify-center gap-2">
        <CheckCircle2 className="w-6 h-6 text-green-500" />
        <span className="text-sm font-bold text-green-600 uppercase tracking-wide">가입 완료</span>
      </div>
      <h1 className="text-3xl font-black tracking-tight text-slate-800 mb-3">
        통패스 시작 준비 완료!
      </h1>
      <p className="text-slate-500 mb-10 max-w-xs mx-auto">
        이제 현장 근로자를 초대하고 출퇴근 관리를 시작하세요
      </p>

      {/* Action Buttons */}
      <div className="w-full max-w-sm space-y-3">
        <ActionCard
          icon={UserPlus}
          title="근로자 초대하기"
          description="SMS로 앱 설치 링크 발송"
          onClick={handleInviteWorkers}
          primary
        />
        <ActionCard
          icon={Users}
          title="관리자 추가하기"
          description="현장 관리자 권한 부여"
          onClick={handleAddAdmin}
        />
        <ActionCard
          icon={LayoutDashboard}
          title="대시보드 둘러보기"
          description="출퇴근 현황 확인하기"
          onClick={handleGoToDashboard}
        />
      </div>

      {/* Help text */}
      <div className="mt-10 p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-blue-100/50 border border-blue-200 max-w-sm text-left">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500 flex-shrink-0">
            <span className="text-sm font-bold text-white">Tip</span>
          </div>
          <p className="text-sm text-blue-700">
            근로자를 초대하면 SMS로 앱 설치 링크가 발송됩니다.
            근로자는 앱 설치 후 바로 출퇴근 QR을 사용할 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Step6Complete;

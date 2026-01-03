import { useState } from 'react';
import { User, Building2, UserPlus, UsersRound, Receipt } from 'lucide-react';
import AccountSettings from '@/components/settings/AccountSettings';
import SiteManagement from '@/components/settings/SiteManagement';
import AdminManagement from '@/components/settings/AdminManagement';
import TeamManagement from '@/components/settings/TeamManagement';

const tabs = [
  { id: 'account', label: '계정 설정', icon: User, disabled: false },
  { id: 'sites', label: '현장 관리', icon: Building2, disabled: false },
  { id: 'admins', label: '관리자 관리', icon: UserPlus, disabled: false },
  { id: 'teams', label: '팀(업체) 관리', icon: UsersRound, disabled: false },
  { id: 'billing', label: '결제라인 추가', icon: Receipt, disabled: true },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('account');

  const handleTabClick = (tabId: string, disabled: boolean) => {
    if (disabled) {
      alert('해당 기능은 준비중입니다.');
      return;
    }
    setActiveTab(tabId);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'account':
        return <AccountSettings />;
      case 'sites':
        return <SiteManagement />;
      case 'admins':
        return <AdminManagement />;
      case 'teams':
        return <TeamManagement />;
      case 'billing':
        return <ComingSoon title="결제라인 추가" description="결제 담당자와 청구 정보를 관리할 수 있습니다." />;
      default:
        return <AccountSettings />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-xl font-black tracking-tight text-slate-800">설정</h1>
        <p className="text-sm text-slate-500 mt-1">
          계정, 현장, 관리자, 팀, 결제 정보를 관리합니다
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-gray-100 rounded-xl border border-gray-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id, tab.disabled)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold transition-all rounded-lg ${
                isActive
                  ? 'bg-white text-orange-600 shadow-sm border border-gray-200'
                  : tab.disabled
                    ? 'text-gray-400 hover:text-gray-500 cursor-pointer'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon size={16} />
              {tab.label}
              {tab.disabled && (
                <span className="text-xs bg-gray-200 text-gray-400 px-1.5 py-0.5 rounded ml-1">
                  준비중
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        {renderTabContent()}
      </div>
    </div>
  );
}

// 준비중 컴포넌트
function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="py-16 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <span className="text-3xl">🚧</span>
      </div>
      <h2 className="text-lg font-bold text-slate-800 mb-2">{title}</h2>
      <p className="text-sm text-slate-500 mb-4">{description}</p>
      <p className="text-xs text-slate-400">곧 서비스될 예정입니다.</p>
    </div>
  );
}

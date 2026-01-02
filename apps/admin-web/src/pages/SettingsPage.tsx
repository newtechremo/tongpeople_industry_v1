import { useState } from 'react';
import { User, Building2 } from 'lucide-react';
import AccountSettings from '@/components/settings/AccountSettings';
import SiteManagement from '@/components/settings/SiteManagement';

const tabs = [
  { id: 'account', label: '계정 설정', icon: User },
  { id: 'sites', label: '현장 관리', icon: Building2 },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('account');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'account':
        return <AccountSettings />;
      case 'sites':
        return <SiteManagement />;
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
          계정, 현장, 협력업체 설정을 관리합니다
        </p>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-gray-100 rounded-lg border border-gray-200 shadow-inner w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-bold transition-all rounded-md ${
                isActive
                  ? 'bg-white text-orange-600 shadow-sm border border-gray-200'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={16} />
              {tab.label}
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

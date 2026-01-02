import { Activity, ClipboardList, FileSearch, Settings, Users } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';

const menuItems = [
  { id: 'dashboard', label: '대시보드', icon: Activity, path: '/', disabled: false },
  { id: 'attendance', label: '출퇴근 관리', icon: Users, path: '/attendance', disabled: false },
  { id: 'risk', label: '위험성평가', icon: ClipboardList, path: '/risk', disabled: true },
  { id: 'tbm', label: 'TBM', icon: FileSearch, path: '/tbm', disabled: true },
  { id: 'settings', label: '설정', icon: Settings, path: '/settings', disabled: false },
];

export default function Sidebar() {
  const location = useLocation();

  const handleDisabledClick = (e: React.MouseEvent, label: string) => {
    e.preventDefault();
    alert(`${label} 기능은 준비중입니다.`);
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0 z-[60]">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
            <span className="text-white font-black text-sm">통</span>
          </div>
          <span className="text-xl font-black tracking-tight text-slate-800">
            산업현장통
          </span>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto pt-6 px-4 pb-6 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          if (item.disabled) {
            return (
              <button
                key={item.id}
                onClick={(e) => handleDisabledClick(e, item.label)}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold
                           rounded-xl transition-all duration-200
                           text-slate-400 hover:bg-gray-50 cursor-pointer"
              >
                <Icon size={20} className="text-slate-300" />
                <span className="flex-1 text-left">{item.label}</span>
                <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded">준비중</span>
              </button>
            );
          }

          return (
            <Link
              key={item.id}
              to={item.path}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold
                          rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-orange-50 text-orange-600 shadow-sm'
                  : 'text-slate-500 hover:bg-gray-50 hover:text-slate-900'
              }`}
            >
              <Icon
                size={20}
                className={isActive ? 'text-orange-600' : 'text-slate-400'}
              />
              <span className="flex-1 text-left">{item.label}</span>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-orange-600" />
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

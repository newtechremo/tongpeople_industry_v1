import { useState } from 'react';
import {
  Activity,
  Users,
  Clock,
  ShieldAlert,
  ClipboardList,
  FileSearch,
  GraduationCap,
  Siren,
  Megaphone,
  CreditCard,
  Settings,
  ChevronDown,
} from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path?: string;
  disabled?: boolean;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  { id: 'dashboard', label: '대시보드', icon: Activity, path: '/' },
  { id: 'workers', label: '근로자 관리', icon: Users, path: '/workers' },
  { id: 'attendance', label: '출퇴근 관리', icon: Clock, path: '/attendance' },
  {
    id: 'safety',
    label: '중대재해 점검사항',
    icon: ShieldAlert,
    children: [
      { id: 'risk', label: '위험성 평가', icon: ClipboardList, path: '/safety/risk', disabled: true },
      { id: 'tbm', label: 'TBM', icon: FileSearch, path: '/safety/tbm', disabled: true },
      { id: 'education', label: '안전교육', icon: GraduationCap, path: '/safety/education', disabled: true },
      { id: 'siren', label: '위급사이렌', icon: Siren, path: '/safety/siren', disabled: true },
    ],
  },
  { id: 'notice', label: '공지사항', icon: Megaphone, path: '/notice', disabled: true },
  { id: 'subscription', label: '구독관리', icon: CreditCard, path: '/subscription', disabled: true },
  { id: 'settings', label: '설정', icon: Settings, path: '/settings' },
];

export default function Sidebar() {
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['safety']);

  const toggleExpand = (menuId: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuId)
        ? prev.filter((id) => id !== menuId)
        : [...prev, menuId]
    );
  };

  const isPathActive = (path?: string) => {
    if (!path) return false;
    if (path.includes('?')) {
      const basePath = path.split('?')[0];
      return location.pathname === basePath || location.pathname.startsWith(basePath);
    }
    return location.pathname === path;
  };

  const handleDisabledClick = (e: React.MouseEvent, label: string) => {
    e.preventDefault();
    alert(`${label} 기능은 준비중입니다.`);
  };

  const renderMenuItem = (item: MenuItem, isChild = false) => {
    const Icon = item.icon;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus.includes(item.id);
    const isActive = isPathActive(item.path);

    // 하위 메뉴가 있는 경우 (카드 형태 섹션)
    if (hasChildren) {
      return (
        <div key={item.id} className="my-2 bg-orange-50/50 rounded-lg p-2 border border-orange-200/50">
          <button
            onClick={() => toggleExpand(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold
                        rounded-lg transition-all duration-200
                        text-slate-600 hover:bg-orange-100/50 hover:text-slate-900`}
          >
            <Icon size={20} className="text-orange-500" />
            <span className="flex-1 text-left">{item.label}</span>
            <ChevronDown
              size={16}
              className={`text-orange-400 transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>
          {isExpanded && (
            <div className="mt-1 space-y-0.5 pl-2">
              {item.children!.map((child) => renderMenuItem(child, true))}
            </div>
          )}
        </div>
      );
    }

    // 비활성화된 메뉴
    if (item.disabled) {
      return (
        <button
          key={item.id}
          onClick={(e) => handleDisabledClick(e, item.label)}
          className={`w-full flex items-center gap-3 ${isChild ? 'px-3 py-2' : 'px-4 py-3'} text-sm font-bold
                      rounded-xl transition-all duration-200
                      text-slate-400 hover:bg-gray-50 cursor-pointer`}
        >
          <Icon size={isChild ? 16 : 20} className="text-slate-300" />
          <span className="flex-1 text-left">{item.label}</span>
          <span className="text-xs bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">준비중</span>
        </button>
      );
    }

    // 일반 메뉴
    return (
      <Link
        key={item.id}
        to={item.path!}
        className={`w-full flex items-center gap-3 ${isChild ? 'px-3 py-2' : 'px-4 py-3'} text-sm font-bold
                    rounded-xl transition-all duration-200 ${
          isActive
            ? 'bg-orange-50 text-orange-600 shadow-sm'
            : 'text-slate-500 hover:bg-gray-50 hover:text-slate-900'
        }`}
      >
        <Icon
          size={isChild ? 16 : 20}
          className={isActive ? 'text-orange-600' : 'text-slate-400'}
        />
        <span className="flex-1 text-left">{item.label}</span>
        {isActive && (
          <div className="w-1.5 h-1.5 rounded-full bg-orange-600" />
        )}
      </Link>
    );
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
      <nav className="flex-1 overflow-y-auto pt-4 px-3 pb-6 space-y-1">
        {menuItems.map((item) => renderMenuItem(item))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100">
        <div className="px-3 py-2 bg-orange-50 rounded-lg">
          <p className="text-xs font-bold text-orange-600">무료 체험 중</p>
          <p className="text-xs text-orange-500 mt-0.5">14일 남음</p>
        </div>
      </div>
    </aside>
  );
}

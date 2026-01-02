import { Bell, ChevronDown, Building2 } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-white h-16 shrink-0 z-[50] px-6 flex items-center justify-between shadow-sm border-b border-gray-200">
      {/* Left: Company & Site Selector */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 rounded-lg border border-orange-200">
          <span className="text-sm font-bold text-orange-600">(주)통하는사람들</span>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 hover:border-orange-400 transition-all">
          <Building2 size={18} className="text-slate-500" />
          <span className="text-sm font-bold text-slate-700">경희대학교 학생회관</span>
          <ChevronDown size={16} className="text-slate-400" />
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell size={20} className="text-slate-500" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full" />
        </button>

        {/* User */}
        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">관</span>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-bold text-slate-700">관리자</p>
            <p className="text-xs text-slate-400">admin@tongpass.com</p>
          </div>
        </div>
      </div>
    </header>
  );
}

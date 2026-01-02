import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { Monitor, Smartphone } from 'lucide-react';

export default function MainLayout() {
  return (
    <>
      {/* 모바일 접속 시 PC 안내 메시지 */}
      <div className="md:hidden fixed inset-0 bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center p-6 z-[100]">
        <div className="bg-white rounded-2xl p-8 max-w-sm text-center shadow-2xl">
          <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Monitor size={32} className="text-orange-600" />
          </div>
          <h1 className="text-xl font-black text-slate-800 mb-3">
            PC에서 접속해주세요
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            관리자 대시보드는 태블릿 또는 PC 환경에 최적화되어 있습니다.
            더 나은 사용 경험을 위해 PC로 접속해주세요.
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <Smartphone size={14} />
              <span>모바일</span>
              <span className="text-red-500 font-bold">X</span>
            </div>
            <div className="w-px h-4 bg-gray-200" />
            <div className="flex items-center gap-1.5">
              <Monitor size={14} />
              <span>태블릿/PC</span>
              <span className="text-green-500 font-bold">O</span>
            </div>
          </div>
        </div>
      </div>

      {/* 태블릿/PC 레이아웃 */}
      <div className="hidden md:flex h-screen overflow-hidden bg-gray-50 text-slate-900 font-sans">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Area */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          {/* Header */}
          <Header />

          {/* Scrollable Content */}
          <main className="flex-1 overflow-y-auto bg-gray-50">
            <div className="max-w-[1600px] w-full mx-auto px-6 py-8">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

import { useState } from 'react';
import { Crown, Search, MoreVertical, UserPlus, Building2, Trash2, Edit2 } from 'lucide-react';
import AdminAddModal from './AdminAddModal';

// Mock 관리자 데이터
interface Admin {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: 'SUPER_ADMIN' | 'SITE_ADMIN';
  sites?: string[]; // 담당 현장
  status: 'ACTIVE' | 'PENDING';
  registeredAt: string;
}

const mockAdmins: Admin[] = [
  {
    id: 'a1',
    name: '김대표',
    phone: '010-1111-2222',
    email: 'ceo@tongpass.com',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    registeredAt: '2023-01-01',
  },
  {
    id: 'a2',
    name: '박소장',
    phone: '010-3333-4444',
    email: 'park@tongpass.com',
    role: 'SITE_ADMIN',
    sites: ['서울본사'],
    status: 'ACTIVE',
    registeredAt: '2023-06-15',
  },
  {
    id: 'a3',
    name: '이현장',
    phone: '010-5555-6666',
    role: 'SITE_ADMIN',
    sites: ['부산공장', '대구물류센터'],
    status: 'ACTIVE',
    registeredAt: '2024-02-01',
  },
  {
    id: 'a4',
    name: '최관리',
    phone: '010-7777-8888',
    role: 'SITE_ADMIN',
    sites: ['인천항만'],
    status: 'PENDING',
    registeredAt: '2025-01-02',
  },
];

export default function AdminManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // 필터링
  const filteredAdmins = mockAdmins.filter(admin => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        admin.name.toLowerCase().includes(query) ||
        admin.phone.includes(query) ||
        admin.email?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const handleDeleteAdmin = (admin: Admin) => {
    if (admin.role === 'SUPER_ADMIN') {
      alert('최고 관리자는 삭제할 수 없습니다.');
      return;
    }
    if (confirm(`${admin.name} 관리자를 삭제하시겠습니까?`)) {
      alert('관리자가 삭제되었습니다.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">관리자 관리</h2>
          <p className="text-sm text-slate-500">
            웹 대시보드에 접속할 수 있는 관리자를 관리합니다 (최고 관리자, 현장 관리자)
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-white
                     bg-gradient-to-r from-orange-500 to-orange-600
                     hover:from-orange-600 hover:to-orange-700 transition-all"
        >
          <UserPlus size={18} />
          관리자 추가
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="이름, 연락처, 이메일로 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200
                     focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {/* Admin List */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-left border-b border-gray-200">
              <th className="px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-500">이름</th>
              <th className="px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-500">연락처</th>
              <th className="px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-500">권한</th>
              <th className="px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-500">담당 현장</th>
              <th className="px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-500">상태</th>
              <th className="px-4 py-3 w-16"></th>
            </tr>
          </thead>
          <tbody>
            {filteredAdmins.map((admin) => (
              <tr
                key={admin.id}
                className="border-t border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">{admin.name}</span>
                    {admin.role === 'SUPER_ADMIN' && (
                      <Crown size={16} className="text-yellow-500" title="최고 관리자" />
                    )}
                  </div>
                  {admin.email && (
                    <p className="text-xs text-slate-400 mt-0.5">{admin.email}</p>
                  )}
                </td>
                <td className="px-4 py-4 text-sm text-slate-600">{admin.phone}</td>
                <td className="px-4 py-4">
                  {admin.role === 'SUPER_ADMIN' ? (
                    <span className="px-2 py-1 text-xs font-bold text-yellow-700 bg-yellow-100 rounded-full">
                      최고 관리자
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-bold text-blue-700 bg-blue-100 rounded-full">
                      현장 관리자
                    </span>
                  )}
                </td>
                <td className="px-4 py-4">
                  {admin.role === 'SUPER_ADMIN' ? (
                    <span className="text-sm text-slate-500">전체 현장</span>
                  ) : admin.sites?.length ? (
                    <div className="flex flex-wrap gap-1">
                      {admin.sites.map((site) => (
                        <span
                          key={site}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-slate-600 bg-gray-100 rounded"
                        >
                          <Building2 size={10} />
                          {site}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-slate-400">-</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  {admin.status === 'ACTIVE' ? (
                    <span className="px-2 py-0.5 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                      활성
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-xs font-medium text-yellow-700 bg-yellow-100 rounded-full">
                      대기
                    </span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => alert('수정 기능 준비중')}
                      className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                      title="수정"
                    >
                      <Edit2 size={14} />
                    </button>
                    {admin.role !== 'SUPER_ADMIN' && (
                      <button
                        onClick={() => handleDeleteAdmin(admin)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="삭제"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredAdmins.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-slate-400">검색 결과가 없습니다</p>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
        <h4 className="font-bold text-blue-800 mb-2">권한 안내</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>최고 관리자 (본사)</strong>: 모든 현장과 결제 정보 관리, 관리자 추가/삭제</li>
          <li>• <strong>현장 관리자 (소장)</strong>: 담당 현장의 데이터 조회 및 관리</li>
          <li>• 팀 관리자(팀장)와 근로자는 <a href="/workers" className="underline font-bold">[근로자 관리]</a>에서 관리합니다.</li>
        </ul>
      </div>

      {/* Add Modal */}
      <AdminAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}

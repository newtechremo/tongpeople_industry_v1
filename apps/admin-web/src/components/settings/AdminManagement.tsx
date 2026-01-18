import { useState, useEffect } from 'react';
import { Crown, Search, UserPlus, Building2, Trash2, Edit2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getAdminUsers, deleteAdminUser, updateUserExcludeFromList } from '@/api/users';
import type { AdminUser } from '@/api/users';
import AdminAddModal from './AdminAddModal';

// Props 타입 정의
interface AdminManagementProps {
  autoOpenModal?: boolean;
  onModalAutoOpened?: () => void;
}

export default function AdminManagement({
  autoOpenModal = false,
  onModalAutoOpened,
}: AdminManagementProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 관리자 목록 로드
  useEffect(() => {
    async function loadAdmins() {
      if (!user?.companyId) return;

      try {
        setLoading(true);
        setError(null);
        const data = await getAdminUsers(user.companyId);
        setAdmins(data);
      } catch (err) {
        console.error('Failed to load admins:', err);
        setError('관리자 목록을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    }

    loadAdmins();
  }, [user?.companyId]);

  // autoOpenModal prop이 true이면 모달 자동 열기
  useEffect(() => {
    if (autoOpenModal) {
      setIsAddModalOpen(true);
      onModalAutoOpened?.();
    }
  }, [autoOpenModal, onModalAutoOpened]);

  // 필터링
  const filteredAdmins = admins.filter(admin => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        admin.name.toLowerCase().includes(query) ||
        admin.phone.includes(query)
      );
    }
    return true;
  });

  const handleDeleteAdmin = async (admin: AdminUser) => {
    if (admin.role === 'SUPER_ADMIN') {
      alert('최고 관리자는 삭제할 수 없습니다.');
      return;
    }
    if (confirm(`${admin.name} 관리자를 삭제하시겠습니까?`)) {
      try {
        await deleteAdminUser(admin.id);
        setAdmins(prev => prev.filter(a => a.id !== admin.id));
        alert('관리자가 삭제되었습니다.');
      } catch (err) {
        console.error('Failed to delete admin:', err);
        alert('관리자 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const handleToggleExcludeFromList = async (admin: AdminUser) => {
    const newValue = !admin.exclude_from_list;
    try {
      const result = await updateUserExcludeFromList(admin.id, newValue);
      if (result.success) {
        setAdmins(prev => prev.map(a =>
          a.id === admin.id ? { ...a, exclude_from_list: newValue } : a
        ));
      } else {
        alert('설정 변경에 실패했습니다: ' + result.error);
      }
    } catch (err) {
      console.error('Failed to toggle exclude_from_list:', err);
      alert('설정 변경 중 오류가 발생했습니다.');
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
          placeholder="이름, 연락처로 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200
                     focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {/* 로딩 상태 */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-slate-500">관리자 목록을 불러오는 중...</p>
          </div>
        </div>
      )}

      {/* 에러 상태 */}
      {error && !loading && (
        <div className="p-4 bg-red-50 rounded-xl border border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Admin List */}
      {!loading && !error && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-left border-b border-gray-200">
              <th className="px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-500">이름</th>
              <th className="px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-500">연락처</th>
              <th className="px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-500">권한</th>
              <th className="px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-500">담당 현장</th>
              <th className="px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-500">상태</th>
              <th className="px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-500">근로자 목록</th>
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
                      <Crown size={16} className="text-yellow-500" />
                    )}
                  </div>
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
                  ) : admin.site ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-slate-600 bg-gray-100 rounded">
                      <Building2 size={10} />
                      {admin.site.name}
                    </span>
                  ) : (
                    <span className="text-sm text-slate-400">-</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  {admin.is_active ? (
                    <span className="px-2 py-0.5 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                      활성
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-xs font-medium text-slate-400 bg-slate-100 rounded-full">
                      비활성
                    </span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <button
                    onClick={() => handleToggleExcludeFromList(admin)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      admin.exclude_from_list
                        ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                    title={admin.exclude_from_list ? '근로자 목록에서 숨김' : '근로자 목록에 표시'}
                  >
                    {admin.exclude_from_list ? (
                      <>
                        <EyeOff size={12} />
                        숨김
                      </>
                    ) : (
                      <>
                        <Eye size={12} />
                        표시
                      </>
                    )}
                  </button>
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
      )}

      {/* Info Box */}
      {!loading && !error && (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
            <h4 className="font-bold text-blue-800 mb-2">권한 안내</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>최고 관리자 (본사)</strong>: 모든 현장과 결제 정보 관리, 관리자 추가/삭제</li>
              <li>• <strong>현장 관리자 (소장)</strong>: 담당 현장의 데이터 조회 및 관리</li>
              <li>• 팀 관리자(팀장)와 근로자는 <a href="/workers" className="underline font-bold">[근로자 관리]</a>에서 관리합니다.</li>
            </ul>
          </div>
          <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
            <h4 className="font-bold text-orange-800 mb-2">근로자 목록 표시 설정</h4>
            <p className="text-sm text-orange-700">
              <strong>"표시"</strong>로 설정하면 해당 관리자가 <a href="/workers" className="underline font-bold">[근로자 관리]</a> 화면에 표시됩니다.
              출퇴근 관리가 필요 없는 대표나 관리자는 <strong>"숨김"</strong>으로 설정하세요.
            </p>
          </div>
        </div>
      )}

      {/* Add Modal */}
      <AdminAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}

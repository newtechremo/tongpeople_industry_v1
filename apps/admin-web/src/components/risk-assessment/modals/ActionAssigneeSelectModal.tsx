/**
 * 조치자/조치확인자 선택 모달
 *
 * Mock 사용자 목록에서 다중 선택
 * - 이름/부서/직책 검색
 * - 역할별 필터링
 */

import { useState, useMemo } from 'react';
import { Search, X, Check } from 'lucide-react';
import { searchUsers, getUsersByIds, type MockUser } from '@/mocks/users';

const ROLE_LABELS: Record<MockUser['role'], string> = {
  SUPER_ADMIN: '최고관리자',
  SITE_ADMIN: '현장관리자',
  TEAM_ADMIN: '팀관리자',
  WORKER: '근로자',
};

interface Props {
  isOpen: boolean;
  title: string;
  selectedIds: string[];
  onConfirm: (selectedIds: string[]) => void;
  onClose: () => void;
}

export default function ActionAssigneeSelectModal({
  isOpen,
  title,
  selectedIds,
  onConfirm,
  onClose,
}: Props) {
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | MockUser['role']>('ALL');
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>(selectedIds);

  // 역할별 필터링
  const roleOptions: Array<MockUser['role']> = ['SUPER_ADMIN', 'SITE_ADMIN', 'TEAM_ADMIN', 'WORKER'];

  // 필터링된 사용자 목록
  const filtered = useMemo(() => {
    let users = searchUsers(query);

    if (roleFilter !== 'ALL') {
      users = users.filter((u) => u.role === roleFilter);
    }

    return users;
  }, [query, roleFilter]);

  // 선택된 사용자 목록
  const selectedUsers = useMemo(
    () => getUsersByIds(tempSelectedIds),
    [tempSelectedIds]
  );

  // 체크박스 토글
  const handleToggle = (userId: string) => {
    setTempSelectedIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  // 확인
  const handleConfirm = () => {
    onConfirm(tempSelectedIds);
    onClose();
  };

  // 취소
  const handleCancel = () => {
    setTempSelectedIds(selectedIds); // 원래 선택으로 복원
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={handleCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl mx-4 overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* 검색 및 필터 */}
        <div className="px-6 py-4 border-b border-gray-100 space-y-3">
          {/* 검색 */}
          <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg">
            <Search size={16} className="text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="이름, 부서, 직책 검색"
              className="flex-1 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          {/* 역할 필터 */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setRoleFilter('ALL')}
              className={`px-3 py-1.5 text-xs font-bold rounded-full border ${
                roleFilter === 'ALL'
                  ? 'bg-orange-100 text-orange-700 border-orange-200'
                  : 'bg-white text-slate-600 border-gray-200 hover:border-orange-200'
              }`}
            >
              전체
            </button>
            {roleOptions.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setRoleFilter(role)}
                className={`px-3 py-1.5 text-xs font-bold rounded-full border ${
                  roleFilter === role
                    ? 'bg-orange-100 text-orange-700 border-orange-200'
                    : 'bg-white text-slate-600 border-gray-200 hover:border-orange-200'
                }`}
              >
                {ROLE_LABELS[role]}
              </button>
            ))}
          </div>

          {/* 선택된 사용자 미리보기 */}
          {selectedUsers.length > 0 && (
            <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
              <div className="text-xs font-bold text-orange-700 mb-2">
                선택된 사용자 ({selectedUsers.length}명)
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map((user) => (
                  <span
                    key={user.id}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-white text-slate-700 border border-orange-300"
                  >
                    {user.name}
                    <button
                      onClick={() => handleToggle(user.id)}
                      className="hover:bg-orange-100 rounded-full p-0.5 transition-colors"
                    >
                      <X size={12} className="text-slate-500" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 사용자 목록 */}
        <div className="max-h-[50vh] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-400">
              검색 결과가 없습니다
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filtered.map((user) => {
                const isSelected = tempSelectedIds.includes(user.id);

                return (
                  <label
                    key={user.id}
                    className={`flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-orange-50 transition-colors ${
                      isSelected ? 'bg-orange-50' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggle(user.id)}
                      className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-800">
                          {user.name}
                        </span>
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-600">
                          {ROLE_LABELS[user.role]}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {user.department} · {user.position}
                      </div>
                    </div>
                    {isSelected && <Check size={18} className="text-orange-500" />}
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 bg-white border border-gray-200 hover:bg-gray-50"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            disabled={tempSelectedIds.length === 0}
            className={`px-4 py-2 rounded-lg text-sm font-bold text-white transition-all ${
              tempSelectedIds.length === 0
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
            }`}
          >
            확인 ({tempSelectedIds.length}명)
          </button>
        </div>
      </div>
    </div>
  );
}

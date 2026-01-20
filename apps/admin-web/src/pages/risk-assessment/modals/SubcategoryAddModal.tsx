/**
 * 소분류 직접 추가 모달
 *
 * 커스텀 소분류 이름 입력 → 추가
 */

import { useState } from 'react';
import { X } from 'lucide-react';

interface SubcategoryAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string) => void;
}

export default function SubcategoryAddModal({
  isOpen,
  onClose,
  onAdd,
}: SubcategoryAddModalProps) {
  const [name, setName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAdd(name.trim());
      setName('');
      onClose();
    }
  };

  const handleClose = () => {
    setName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 오버레이 */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* 모달 콘텐츠 */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        {/* 닫기 버튼 */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-lg"
        >
          <X size={20} className="text-slate-400" />
        </button>

        {/* 제목 */}
        <h2 className="text-lg font-bold text-slate-800 mb-4">
          소분류 직접 추가하기
        </h2>

        {/* 폼 */}
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-600 mb-2">
              소분류 이름
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="소분류 이름을 입력하세요..."
              autoFocus
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>

          {/* 버튼 */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-3 rounded-xl font-medium text-slate-600 bg-gray-100 hover:bg-gray-200"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              추가하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

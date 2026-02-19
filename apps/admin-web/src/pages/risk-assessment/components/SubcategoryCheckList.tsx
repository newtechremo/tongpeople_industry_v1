/**
 * 소분류 체크리스트
 *
 * 대분류 선택 시 관련 소분류를 체크박스로 표시
 * 복수 선택 가능, 커스텀 소분류 추가 가능
 */

import { useState } from 'react';
import { CheckCircle, PlusCircle, Search } from 'lucide-react';

interface Subcategory {
  id: number;
  name: string;
  isCustom?: boolean;
}

interface SubcategoryCheckListProps {
  categoryId: number;
  selectedIds: number[];
  customItems: Subcategory[];
  onChange: (selectedIds: number[]) => void;
  onAddCustom: () => void;
}

export default function SubcategoryCheckList({
  categoryId,
  selectedIds,
  customItems,
  onChange,
  onAddCustom,
}: SubcategoryCheckListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Mock 데이터 (실제로는 API에서 categoryId로 조회)
  const mockSubcategories: Subcategory[] = [
    { id: 101, name: '가설전선 설치작업' },
    { id: 102, name: '가설전선 점검작업' },
    { id: 103, name: '꽂음 접속기작업' },
    { id: 104, name: '이동형 릴 전선작업' },
    { id: 105, name: '전동공구 사용/정리정돈작업' },
  ];

  const allSubcategories = [...mockSubcategories, ...customItems];

  // 검색 필터링
  const filteredSubcategories = allSubcategories.filter((sub) =>
    sub.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggle = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3">
      <p className="text-sm text-slate-600 mb-3">
        소분류 선택 <span className="text-slate-400">(한 개 이상 선택하세요)</span>
      </p>

      {/* 검색창 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="소분류 검색..."
          className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none text-sm"
        />
      </div>

      {/* 체크박스 리스트 */}
      <div className="space-y-2">
        {filteredSubcategories.length > 0 ? (
          filteredSubcategories.map((sub) => {
            const isSelected = selectedIds.includes(sub.id);

            return (
              <label
                key={sub.id}
                className="flex items-center gap-3 py-2 px-2 cursor-pointer hover:bg-gray-50 rounded transition-colors"
              >
                {isSelected ? (
                  <CheckCircle size={20} className="text-red-500 flex-shrink-0" />
                ) : (
                  <input
                    type="checkbox"
                    checked={false}
                    onChange={() => handleToggle(sub.id)}
                    className="w-5 h-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500 focus:ring-offset-0"
                  />
                )}
                <span className="text-sm text-slate-700 flex-1">
                  {sub.name}
                  {sub.isCustom && (
                    <span className="ml-2 text-xs text-orange-600">(직접 추가)</span>
                  )}
                </span>
              </label>
            );
          })
        ) : (
          <div className="py-8 text-center text-slate-400 text-sm">
            검색 결과가 없습니다
          </div>
        )}
      </div>

      {/* 소분류 직접 추가 버튼 */}
      <button
        type="button"
        onClick={onAddCustom}
        className="flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 font-medium transition-colors"
      >
        <PlusCircle size={18} />
        소분류 직접 추가
      </button>
    </div>
  );
}

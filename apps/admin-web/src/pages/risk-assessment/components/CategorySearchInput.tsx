/**
 * 대분류 검색 Input (자동완성)
 *
 * 검색어 입력 → API 조회 → 드롭다운 → 선택
 */

import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface Category {
  id: number;
  name: string;
}

interface CategorySearchInputProps {
  value: string;
  categoryId: number | null;
  onChange: (categoryId: number, categoryName: string) => void;
  onClear: () => void;
  placeholder?: string;
}

export default function CategorySearchInput({
  value,
  categoryId,
  onChange,
  onClear,
  placeholder = '대분류를 입력하세요...',
}: CategorySearchInputProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Mock 데이터 (실제로는 API에서 가져옴)
  const mockCategories: Category[] = [
    { id: 1, name: '가설전선 설치' },
    { id: 2, name: '흙막이 Earth Anchor' },
    { id: 3, name: '흙막이 CIP' },
    { id: 4, name: '흙막이 S.C.W' },
    { id: 5, name: '흙막이 SLURRY WALL' },
    { id: 6, name: '철근 가공 및 조립' },
    { id: 7, name: '콘크리트 타설' },
    { id: 8, name: '거푸집 설치 및 해체' },
    { id: 9, name: '비계 설치 및 해체' },
    { id: 10, name: '용접 작업' },
  ];

  // 외부 클릭 감지
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 검색어 변경 시 필터링
  useEffect(() => {
    if (searchQuery) {
      const filtered = mockCategories.filter(cat =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setCategories(filtered);
    } else {
      setCategories(mockCategories);
    }
  }, [searchQuery]);

  const handleSelect = (category: Category) => {
    onChange(category.id, category.name);
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsOpen(true);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div
        className={`flex items-center border rounded-lg px-3 py-2 ${
          isOpen
            ? 'border-orange-500 ring-1 ring-orange-500'
            : 'border-gray-300 focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500'
        }`}
      >
        <Search size={18} className="text-slate-400 mr-2" />

        {value ? (
          <div className="flex-1 flex items-center justify-between">
            <span className="text-sm text-slate-800">{value}</span>
            <button
              type="button"
              onClick={onClear}
              className="ml-2 p-1 hover:bg-gray-100 rounded"
            >
              <X size={16} className="text-slate-400 hover:text-slate-600" />
            </button>
          </div>
        ) : (
          <input
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className="flex-1 text-sm bg-transparent focus:outline-none"
          />
        )}
      </div>

      {/* 드롭다운 */}
      {isOpen && !value && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
          {categories.length > 0 ? (
            categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => handleSelect(category)}
                className="w-full px-4 py-3 text-left text-sm hover:bg-orange-50 transition-colors"
              >
                {category.name}
              </button>
            ))
          ) : (
            <div className="px-4 py-8 text-center text-sm text-slate-400">
              검색 결과가 없습니다
            </div>
          )}
        </div>
      )}
    </div>
  );
}

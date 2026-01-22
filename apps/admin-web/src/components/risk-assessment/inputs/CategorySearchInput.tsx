/**
 * 작업 공종 검색 Input
 */

import { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import type { MockRiskCategory } from '@/mocks/risk-assessment';

interface Props {
  categories: MockRiskCategory[];
  value: string;
  onChange: (categoryId: string) => void;
  error?: string;
}

export default function CategorySearchInput({
  categories,
  value,
  onChange,
  error,
}: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedCategory = categories.find(cat => cat.id === value);
  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (categoryId: string) => {
    onChange(categoryId);
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setSearchQuery('');
    setIsOpen(true);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-sm font-bold text-slate-700 mb-2">
        작업 공종 <span className="text-orange-500">*</span>
      </label>

      <div className="relative">
        <div className={`flex items-center px-4 py-3 rounded-xl border-2 ${
          error
            ? 'border-red-300 bg-red-50'
            : isOpen
            ? 'border-orange-500 bg-white'
            : 'border-gray-200 bg-white'
        }`}>
          <Search className="w-5 h-5 text-slate-400 mr-2" />

          {selectedCategory ? (
            <div className="flex-1 flex items-center justify-between">
              <span className="text-slate-800 font-medium">{selectedCategory.name}</span>
              <button
                type="button"
                onClick={handleClear}
                className="ml-2 text-slate-400 hover:text-slate-600"
              >
                삭제
              </button>
            </div>
          ) : (
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder="작업 공종을 검색하세요..."
              className="flex-1 bg-transparent focus:outline-none"
            />
          )}
        </div>

        {isOpen && (
          <div className="absolute z-10 w-full mt-2 bg-white rounded-xl border-2 border-gray-200 shadow-lg max-h-60 overflow-y-auto">
            {filteredCategories.length > 0 ? (
              filteredCategories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => handleSelect(category.id)}
                  className={`w-full px-4 py-3 text-left hover:bg-orange-50 transition-colors ${
                    category.id === value ? 'bg-orange-50 text-orange-600 font-bold' : 'text-slate-700'
                  }`}
                >
                  {category.name}
                  {category.description && (
                    <span className="block text-xs text-slate-500 mt-1">{category.description}</span>
                  )}
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-slate-400">
                검색 결과가 없습니다
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

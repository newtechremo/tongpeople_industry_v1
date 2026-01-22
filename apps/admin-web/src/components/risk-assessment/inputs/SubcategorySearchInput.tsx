/**
 * 세부 공종 검색 Input
 */

import { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import type { MockRiskSubcategory } from '@/mocks/risk-assessment';

interface Props {
  subcategories: MockRiskSubcategory[];
  value: string;
  onChange: (subcategoryId: string) => void;
  disabled?: boolean;
  error?: string;
}

export default function SubcategorySearchInput({
  subcategories,
  value,
  onChange,
  disabled = false,
  error,
}: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedSubcategory = subcategories.find(sub => sub.id === value);
  const filteredSubcategories = subcategories.filter(sub =>
    sub.name.toLowerCase().includes(searchQuery.toLowerCase())
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

  const handleSelect = (subcategoryId: string) => {
    onChange(subcategoryId);
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
        세부 공종 <span className="text-slate-400 text-xs">(선택사항)</span>
      </label>

      <div className="relative">
        <div className={`flex items-center px-4 py-3 rounded-xl border-2 ${
          disabled
            ? 'bg-slate-100 border-slate-200 cursor-not-allowed'
            : error
            ? 'border-red-300 bg-red-50'
            : isOpen
            ? 'border-orange-500 bg-white'
            : 'border-gray-200 bg-white'
        }`}>
          <Search className="w-5 h-5 text-slate-400 mr-2" />

          {selectedSubcategory ? (
            <div className="flex-1 flex items-center justify-between">
              <span className="text-slate-800 font-medium">{selectedSubcategory.name}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="ml-2 text-slate-400 hover:text-slate-600"
                >
                  삭제
                </button>
              )}
            </div>
          ) : (
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => !disabled && setIsOpen(true)}
              disabled={disabled}
              placeholder={disabled ? '먼저 작업 공종을 선택하세요' : '세부 공종을 검색하세요...'}
              className="flex-1 bg-transparent focus:outline-none disabled:cursor-not-allowed"
            />
          )}
        </div>

        {isOpen && !disabled && (
          <div className="absolute z-10 w-full mt-2 bg-white rounded-xl border-2 border-gray-200 shadow-lg max-h-60 overflow-y-auto">
            {filteredSubcategories.length > 0 ? (
              filteredSubcategories.map((subcategory) => (
                <button
                  key={subcategory.id}
                  type="button"
                  onClick={() => handleSelect(subcategory.id)}
                  className={`w-full px-4 py-3 text-left hover:bg-orange-50 transition-colors ${
                    subcategory.id === value ? 'bg-orange-50 text-orange-600 font-bold' : 'text-slate-700'
                  }`}
                >
                  {subcategory.name}
                  {subcategory.description && (
                    <span className="block text-xs text-slate-500 mt-1">{subcategory.description}</span>
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

      {disabled && (
        <p className="mt-1 text-xs text-slate-500">작업 공종을 먼저 선택해주세요</p>
      )}
    </div>
  );
}

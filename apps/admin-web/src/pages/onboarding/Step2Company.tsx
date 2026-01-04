import { useState, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ChevronRight, ChevronDown, Search, Building2, User, MapPin, FileText, Users, Sparkles, Check, AlertCircle } from 'lucide-react';
import {
  formatBusinessNumber,
  isValidBusinessNumber,
  INDUSTRY_CODES,
  EMPLOYEE_COUNT_LABELS,
} from '@tong-pass/shared';
import type { EmployeeCountRange, IndustryCode } from '@tong-pass/shared';
import { useOnboarding } from '@/hooks/useOnboarding';
import { checkBusinessNumber } from '@/api/auth';

// Step2Company Component
export function Step2Company() {
  const navigate = useNavigate();
  const { data, setStep2, nextStep } = useOnboarding();

  // Form state
  const [companyName, setCompanyName] = useState(data.step2?.companyName || '');
  const [ceoName, setCeoName] = useState(data.step2?.ceoName || '');
  const [address, setAddress] = useState(data.step2?.address || '');
  const [addressDetail, setAddressDetail] = useState(data.step2?.addressDetail || '');
  const [businessNumber, setBusinessNumber] = useState(data.step2?.businessNumber || '');
  const [industryCode, setIndustryCode] = useState<IndustryCode | ''>(
    (data.step2?.industryCode as IndustryCode) || ''
  );
  const [employeeCount, setEmployeeCount] = useState<EmployeeCountRange | ''>(
    data.step2?.employeeCountRange || ''
  );

  // UI state
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false);
  const [industrySearch, setIndustrySearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bizNumError, setBizNumError] = useState<string | null>(null);
  const [bizNumChecking, setBizNumChecking] = useState(false);
  const [bizNumValid, setBizNumValid] = useState(false);

  // Handlers
  const handleBusinessNumberChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, '');
    const formatted = formatBusinessNumber(value);
    setBusinessNumber(formatted);
    setBizNumError(null);
    setBizNumValid(false);
  };

  const handleBusinessNumberBlur = async () => {
    if (!isValidBusinessNumber(businessNumber)) {
      if (businessNumber.replace(/[^0-9]/g, '').length === 10) {
        setBizNumError('올바른 사업자등록번호를 입력해주세요.');
      }
      return;
    }

    setBizNumChecking(true);
    setBizNumError(null);

    const result = await checkBusinessNumber(businessNumber);

    if (result.error) {
      setBizNumError(result.error);
    } else if (result.exists) {
      setBizNumError('이미 등록된 사업자등록번호입니다.');
    } else {
      setBizNumValid(true);
    }

    setBizNumChecking(false);
  };

  const handleAddressSearch = () => {
    // Mock address search - would integrate with Daum/Kakao address API
    console.log('[DEV] 주소 검색 API 호출');
    // For now, just set a sample address
    setAddress('서울특별시 강남구 테헤란로 123');
  };

  const handleIndustrySelect = (code: IndustryCode) => {
    setIndustryCode(code);
    setShowIndustryDropdown(false);
    setIndustrySearch('');
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate business number
    if (!isValidBusinessNumber(businessNumber)) {
      setBizNumError('올바른 사업자등록번호를 입력해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Save step data
      setStep2({
        companyName: companyName.trim(),
        ceoName: ceoName.trim(),
        address: address.trim(),
        addressDetail: addressDetail.trim(),
        businessNumber,
        industryCode: industryCode || undefined,
        employeeCountRange: employeeCount || undefined,
      });

      nextStep();
      navigate('/onboarding/step3');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter industry codes by search
  const filteredIndustries = Object.entries(INDUSTRY_CODES).filter(
    ([, label]) => label.toLowerCase().includes(industrySearch.toLowerCase())
  );

  // Employee count options
  const employeeCountOptions: EmployeeCountRange[] = [
    '5_UNDER',
    '5_49',
    '50_299',
    '300_OVER',
    'OTHER',
  ];

  // Validation
  const isFormValid =
    companyName.trim() &&
    ceoName.trim() &&
    address.trim() &&
    isValidBusinessNumber(businessNumber) &&
    bizNumValid &&
    !bizNumError;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-100 mb-4">
          <Sparkles className="w-4 h-4 text-orange-500" />
          <span className="text-xs font-bold text-orange-600 uppercase tracking-wide">회사 정보</span>
        </div>
        <h2 className="text-3xl font-black tracking-tight text-slate-800">
          회사 정보를 입력해주세요
        </h2>
        <p className="mt-3 text-slate-500">
          서비스 이용을 위한 기본 정보를 입력해주세요
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Company Name */}
        <div className="space-y-2">
          <label htmlFor="companyName" className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <Building2 className="w-4 h-4 text-slate-400" />
            회사명 <span className="text-red-500">*</span>
          </label>
          <input
            id="companyName"
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="(주)통하는사람들"
            required
            className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 bg-white text-slate-800 placeholder-slate-400 transition-all duration-200 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 hover:border-gray-200"
          />
        </div>

        {/* CEO Name */}
        <div className="space-y-2">
          <label htmlFor="ceoName" className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <User className="w-4 h-4 text-slate-400" />
            대표자명 <span className="text-red-500">*</span>
          </label>
          <input
            id="ceoName"
            type="text"
            value={ceoName}
            onChange={(e) => setCeoName(e.target.value)}
            placeholder="홍길동"
            required
            className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 bg-white text-slate-800 placeholder-slate-400 transition-all duration-200 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 hover:border-gray-200"
          />
        </div>

        {/* Address */}
        <div className="space-y-2">
          <label htmlFor="address" className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <MapPin className="w-4 h-4 text-slate-400" />
            본사 주소 <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-3">
            <input
              id="address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="주소를 검색해주세요"
              required
              readOnly
              className="flex-1 px-5 py-4 rounded-2xl border-2 border-gray-100 bg-gray-50 text-slate-800 placeholder-slate-400 cursor-pointer hover:border-gray-200 transition-all"
              onClick={handleAddressSearch}
            />
            <button
              type="button"
              onClick={handleAddressSearch}
              className="px-5 py-4 rounded-2xl font-bold text-slate-700 bg-white border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all"
              aria-label="주소 검색"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
          {address && (
            <input
              type="text"
              value={addressDetail}
              onChange={(e) => setAddressDetail(e.target.value)}
              placeholder="상세주소 입력 (선택)"
              className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 bg-white text-slate-800 placeholder-slate-400 transition-all duration-200 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 hover:border-gray-200"
            />
          )}
        </div>

        {/* Business Number */}
        <div className="space-y-2">
          <label htmlFor="businessNumber" className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <FileText className="w-4 h-4 text-slate-400" />
            사업자등록번호 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              id="businessNumber"
              type="text"
              inputMode="numeric"
              value={businessNumber}
              onChange={handleBusinessNumberChange}
              onBlur={handleBusinessNumberBlur}
              placeholder="000-00-00000"
              maxLength={12}
              required
              className={`w-full px-5 py-4 pr-14 rounded-2xl border-2 bg-white text-slate-800 placeholder-slate-400 transition-all duration-200 focus:outline-none focus:ring-4 ${
                bizNumError
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                  : bizNumValid
                  ? 'border-green-300 focus:border-green-500 focus:ring-green-500/10'
                  : 'border-gray-100 focus:border-orange-500 focus:ring-orange-500/10 hover:border-gray-200'
              }`}
            />
            {/* Status indicator */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              {bizNumChecking && (
                <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
              )}
              {!bizNumChecking && bizNumValid && (
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
              {!bizNumChecking && bizNumError && (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
            </div>
          </div>
          {bizNumError && (
            <p className="text-sm font-medium text-red-600">{bizNumError}</p>
          )}
          {bizNumValid && (
            <p className="text-sm font-medium text-green-600">사용 가능한 사업자등록번호입니다.</p>
          )}
        </div>

        {/* Optional Section Divider */}
        <div className="pt-6 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-400 mb-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span>선택 입력</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <p className="text-xs text-slate-400 text-center mb-4">
            나중에 설정에서 입력 가능합니다
          </p>
        </div>

        {/* Industry Code */}
        <div className="relative space-y-2">
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <FileText className="w-4 h-4 text-slate-400" />
            대표 업종
          </label>
          <button
            type="button"
            onClick={() => setShowIndustryDropdown(!showIndustryDropdown)}
            className="flex items-center justify-between w-full px-5 py-4 rounded-2xl border-2 border-gray-100 bg-white text-left transition-all duration-200 hover:border-gray-200 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
          >
            <span className={industryCode ? 'text-slate-800' : 'text-slate-400'}>
              {industryCode
                ? `[${industryCode}] ${INDUSTRY_CODES[industryCode]}`
                : '업종을 선택해주세요'}
            </span>
            <ChevronDown
              className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                showIndustryDropdown ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Dropdown */}
          {showIndustryDropdown && (
            <div className="absolute z-20 w-full mt-2 py-2 bg-white rounded-2xl border-2 border-gray-100 shadow-xl max-h-64 overflow-auto">
              {/* Search */}
              <div className="px-3 pb-2 border-b border-gray-100">
                <input
                  type="text"
                  value={industrySearch}
                  onChange={(e) => setIndustrySearch(e.target.value)}
                  placeholder="업종 검색..."
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 text-sm focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                />
              </div>
              {/* Options */}
              {filteredIndustries.map(([code, label]) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => handleIndustrySelect(code as IndustryCode)}
                  className={`w-full px-5 py-3 text-left text-sm hover:bg-orange-50 transition-colors ${
                    industryCode === code ? 'bg-orange-50 text-orange-600 font-bold' : 'text-slate-700'
                  }`}
                >
                  <span className="font-bold text-slate-400">[{code}]</span> {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Employee Count */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <Users className="w-4 h-4 text-slate-400" />
            직원 수
          </label>
          <div className="grid grid-cols-2 gap-2">
            {employeeCountOptions.map((option) => (
              <label
                key={option}
                className={`flex items-center justify-center gap-2 p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                  employeeCount === option
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25'
                    : 'bg-gray-50 border-2 border-transparent text-slate-600 hover:bg-gray-100 hover:border-gray-200'
                }`}
              >
                <input
                  type="radio"
                  name="employeeCount"
                  value={option}
                  checked={employeeCount === option}
                  onChange={() => setEmployeeCount(option)}
                  className="sr-only"
                />
                <span className="text-sm font-bold">
                  {EMPLOYEE_COUNT_LABELS[option]}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className="relative flex items-center justify-center gap-2 w-full px-6 py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 hover:-translate-y-0.5 active:translate-y-0"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>처리 중...</span>
              </>
            ) : (
              <>
                <span className="text-lg">다음</span>
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default Step2Company;

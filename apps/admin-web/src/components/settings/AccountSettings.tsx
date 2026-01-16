import { useState, useRef, useEffect } from 'react';
import { Save, Building2, User, MapPin, FileText, Upload, Clock, Lock, Search, Phone, Mail, Headphones, CreditCard, Pencil, X, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getCompanyById, updateCompany, updateClientProfile } from '@/api/companies';
import type { CompanyWithProfile } from '@/api/companies';
import { useDaumPostcode } from '@/hooks/useDaumPostcode';

// 직원 수 옵션
const EMPLOYEE_COUNT_OPTIONS = [
  { value: 'under_5', label: '5인 미만' },
  { value: '5_to_49', label: '5인 ~ 49인' },
  { value: '50_to_299', label: '50인 ~ 299인' },
  { value: '300_plus', label: '300인 이상' },
  { value: 'other', label: '기타' },
];

// 대표 업종코드 (10차 대분류 기준 예시)
const BUSINESS_CATEGORY_CODES = [
  { code: 'A', name: '농업, 임업 및 어업' },
  { code: 'B', name: '광업' },
  { code: 'C', name: '제조업' },
  { code: 'D', name: '전기, 가스, 증기 및 공기 조절 공급업' },
  { code: 'E', name: '수도, 하수 및 폐기물 처리, 원료 재생업' },
  { code: 'F', name: '건설업' },
  { code: 'G', name: '도매 및 소매업' },
  { code: 'H', name: '운수 및 창고업' },
  { code: 'I', name: '숙박 및 음식점업' },
  { code: 'J', name: '정보통신업' },
  { code: 'K', name: '금융 및 보험업' },
  { code: 'L', name: '부동산업' },
  { code: 'M', name: '전문, 과학 및 기술 서비스업' },
  { code: 'N', name: '사업시설 관리, 사업 지원 및 임대 서비스업' },
  { code: 'O', name: '공공 행정, 국방 및 사회보장 행정' },
  { code: 'P', name: '교육 서비스업' },
  { code: 'Q', name: '보건업 및 사회복지 서비스업' },
  { code: 'R', name: '예술, 스포츠 및 여가관련 서비스업' },
  { code: 'S', name: '협회 및 단체, 수리 및 기타 개인 서비스업' },
  { code: 'T', name: '가구 내 고용활동 및 달리 분류되지 않은 자가 소비 생산활동' },
  { code: 'U', name: '국제 및 외국기관' },
];

// 정보 표시용 컴포넌트
const InfoRow = ({ icon: Icon, label, value, badge }: {
  icon: React.ElementType;
  label: string;
  value: string | null | undefined;
  badge?: string;
}) => (
  <div className="flex items-start gap-4 py-4 border-b border-gray-100 last:border-0">
    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
      <Icon size={16} className="text-slate-500" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {badge && (
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{badge}</span>
        )}
      </div>
      <p className="text-base font-bold text-slate-800 mt-0.5">
        {value || <span className="text-slate-300">-</span>}
      </p>
    </div>
  </div>
);

// 담당자 정보 카드 (보기 모드)
const ContactCard = ({
  icon: Icon,
  title,
  subtitle,
  name,
  phone,
  email,
  colorClass,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  name?: string;
  phone?: string;
  email?: string;
  colorClass: 'blue' | 'purple';
}) => {
  const colors = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-600',
      title: 'text-blue-800',
      subtitle: 'text-blue-600',
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      icon: 'text-purple-600',
      title: 'text-purple-800',
      subtitle: 'text-purple-600',
    },
  };
  const c = colors[colorClass];

  const hasInfo = name || phone || email;

  return (
    <div className={`p-5 ${c.bg} ${c.border} border rounded-xl`}>
      <div className="flex items-center gap-2 mb-4">
        <Icon size={18} className={c.icon} />
        <h3 className={`font-bold ${c.title}`}>{title}</h3>
        <span className={`text-xs ${c.subtitle}`}>{subtitle}</span>
      </div>
      {hasInfo ? (
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">이름</p>
            <p className="text-sm font-bold text-slate-800">{name || '-'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">연락처</p>
            <p className="text-sm font-bold text-slate-800">{phone || '-'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">이메일</p>
            <p className="text-sm font-bold text-slate-800">{email || '-'}</p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-400">등록된 담당자 정보가 없습니다</p>
      )}
    </div>
  );
};

export default function AccountSettings() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCodeDropdownOpen, setIsCodeDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<CompanyWithProfile | null>(null);

  // Daum 주소 검색
  const { openPostcode } = useDaumPostcode({
    onComplete: (data) => {
      setFormData((prev) => ({ ...prev, address: data.address }));
    },
  });

  // 저장된 데이터
  const [savedData, setSavedData] = useState({
    companyName: '',
    representativeName: '',
    address: '',
    businessNumber: '',
    businessCategoryCode: '',
    businessCategoryName: '',
    employeeCount: '',
    timezone: 'Asia/Seoul',
    techAdminName: '',
    techAdminPhone: '',
    techAdminEmail: '',
    billingAdminName: '',
    billingAdminPhone: '',
    billingAdminEmail: '',
  });

  // 수정 중인 폼 데이터
  const [formData, setFormData] = useState({ ...savedData });

  // 회사 데이터 로드
  useEffect(() => {
    async function loadCompanyData() {
      if (!user?.companyId) return;

      try {
        setLoading(true);
        const companyData = await getCompanyById(user.companyId);
        if (companyData) {
          setCompany(companyData);
          const profile = companyData.client_profile;
          const data = {
            companyName: companyData.name || '',
            representativeName: companyData.ceo_name || '',
            address: companyData.address || '',
            businessNumber: profile?.biz_num || '',
            businessCategoryCode: companyData.business_category_code || '',
            businessCategoryName: companyData.business_category_name || '',
            employeeCount: companyData.employee_count_range || '',
            timezone: 'Asia/Seoul',
            techAdminName: profile?.admin_name || '',
            techAdminPhone: profile?.admin_phone || '',
            techAdminEmail: profile?.admin_email || '',
            billingAdminName: profile?.billing_name || '',
            billingAdminPhone: profile?.billing_phone || '',
            billingAdminEmail: profile?.billing_email || '',
          };
          setSavedData(data);
          setFormData(data);
        }
      } catch (error) {
        console.error('Failed to load company data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadCompanyData();
  }, [user?.companyId]);

  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    url: string;
    uploadedAt: string;
  } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        alert('PDF, JPG, PNG 파일만 업로드 가능합니다.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('파일 크기는 5MB 이하여야 합니다.');
        return;
      }
      setUploadedFile({
        name: file.name,
        url: URL.createObjectURL(file),
        uploadedAt: new Date().toLocaleString('ko-KR'),
      });
    }
  };

  const handleCategorySelect = (code: string, name: string) => {
    setFormData((prev) => ({
      ...prev,
      businessCategoryCode: code,
      businessCategoryName: name,
    }));
    setIsCodeDropdownOpen(false);
    setSearchQuery('');
  };

  const filteredCategories = BUSINESS_CATEGORY_CODES.filter(
    (cat) =>
      cat.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.name.includes(searchQuery)
  );

  const handleEdit = () => {
    setFormData({ ...savedData });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setFormData({ ...savedData });
    setIsEditing(false);
    setIsCodeDropdownOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.companyId) {
      alert('회사 정보를 찾을 수 없습니다.');
      return;
    }

    try {
      // 1. 회사 기본 정보 업데이트
      await updateCompany(user.companyId, {
        name: formData.companyName,
        ceo_name: formData.representativeName,
        address: formData.address,
        employee_count_range: formData.employeeCount,
        business_category_code: formData.businessCategoryCode,
        business_category_name: formData.businessCategoryName,
      });

      // 2. 담당자 정보 업데이트 (client_profiles)
      await updateClientProfile(user.companyId, {
        admin_name: formData.techAdminName,
        admin_phone: formData.techAdminPhone,
        admin_email: formData.techAdminEmail,
        billing_name: formData.billingAdminName,
        billing_phone: formData.billingAdminPhone,
        billing_email: formData.billingAdminEmail,
      });

      setSavedData({ ...formData });
      setIsEditing(false);
      alert('회사 정보가 저장되었습니다.');
    } catch (error) {
      console.error('Failed to update company:', error);
      alert('회사 정보 저장 중 오류가 발생했습니다.');
    }
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-slate-500">회사 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 보기 모드
  if (!isEditing) {
    return (
      <div className="space-y-8 w-full">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">기본 회사 정보</h2>
            <p className="text-sm text-slate-500 mt-1">회사 및 사업자 정보를 관리합니다</p>
          </div>
          <button
            onClick={handleEdit}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-white
                       bg-gradient-to-r from-orange-500 to-orange-600
                       hover:from-orange-600 hover:to-orange-700
                       shadow-sm transition-all"
          >
            <Pencil size={16} />
            수정하기
          </button>
        </div>

        {/* 회사 정보 카드 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <InfoRow icon={Building2} label="회사명" value={savedData.companyName} />
          <InfoRow icon={User} label="대표자명" value={savedData.representativeName} />
          <InfoRow icon={MapPin} label="본사 주소" value={savedData.address} />
          <InfoRow icon={Lock} label="사업자등록번호" value={savedData.businessNumber} badge="수정 불가" />
          <InfoRow
            icon={FileText}
            label="대표 업종코드"
            value={savedData.businessCategoryCode ? `[${savedData.businessCategoryCode}] ${savedData.businessCategoryName}` : null}
          />
          <InfoRow
            icon={Users}
            label="직원 수"
            value={EMPLOYEE_COUNT_OPTIONS.find(opt => opt.value === savedData.employeeCount)?.label}
          />
          <InfoRow icon={Clock} label="기본 시간대" value="한국 표준시 (UTC+9)" />
        </div>

        {/* 사업자 등록증 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="text-base font-bold text-slate-800 mb-4">사업자 등록증</h3>
          {uploadedFile ? (
            <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FileText size={20} className="text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700">{uploadedFile.name}</p>
                <p className="text-xs text-slate-400">업로드: {uploadedFile.uploadedAt}</p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-center">
              <p className="text-sm text-slate-400">등록된 파일이 없습니다</p>
            </div>
          )}
        </div>

        {/* 담당자 정보 */}
        <div>
          <h3 className="text-base font-bold text-slate-800 mb-4">담당자 정보</h3>
          <div className="space-y-4">
            <ContactCard
              icon={Headphones}
              title="전산 관리자"
              subtitle="시스템 장애 및 기술 지원용"
              name={savedData.techAdminName}
              phone={savedData.techAdminPhone}
              email={savedData.techAdminEmail}
              colorClass="blue"
            />
            <ContactCard
              icon={CreditCard}
              title="결제 담당자"
              subtitle="청구서 발행 및 미납 안내용"
              name={savedData.billingAdminName}
              phone={savedData.billingAdminPhone}
              email={savedData.billingAdminEmail}
              colorClass="purple"
            />
          </div>
        </div>
      </div>
    );
  }

  // 수정 모드
  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">기본 회사 정보 수정</h2>
          <p className="text-sm text-slate-500 mt-1">회사 및 사업자 정보를 수정합니다</p>
        </div>
        <button
          onClick={handleCancel}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-slate-600
                     bg-gray-100 hover:bg-gray-200 transition-all"
        >
          <X size={16} />
          취소
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 w-full">
        {/* 회사명 */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <Building2 size={16} className="text-slate-400" />
            회사명 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg
                       text-sm font-medium text-slate-700
                       hover:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100
                       transition-all"
          />
        </div>

        {/* 대표자명 */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <User size={16} className="text-slate-400" />
            대표자명 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="representativeName"
            value={formData.representativeName}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg
                       text-sm font-medium text-slate-700
                       hover:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100
                       transition-all"
          />
        </div>

        {/* 본사 주소 */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <MapPin size={16} className="text-slate-400" />
            본사 주소 <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              placeholder="주소를 검색해주세요"
              className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-lg
                         text-sm font-medium text-slate-700
                         hover:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100
                         transition-all"
            />
            <button
              type="button"
              onClick={openPostcode}
              className="px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg
                         text-sm font-bold text-slate-600 hover:bg-gray-200 transition-all"
            >
              <Search size={18} />
            </button>
          </div>
        </div>

        {/* 사업자등록번호 (수정 불가) */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <Lock size={16} className="text-slate-400" />
            사업자등록번호
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">수정 불가</span>
          </label>
          <input
            type="text"
            name="businessNumber"
            value={formData.businessNumber}
            disabled
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg
                       text-sm font-medium text-slate-500 cursor-not-allowed"
          />
          <p className="text-xs text-slate-400">
            사업자등록번호는 가입 시 인증된 정보로, 변경이 필요한 경우 고객센터로 문의해주세요.
          </p>
        </div>

        {/* 사업자 등록증 업로드 */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <FileText size={16} className="text-slate-400" />
            사업자 등록증
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 bg-gray-50
                          hover:border-orange-400 hover:bg-orange-50 transition-all">
            {uploadedFile ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <FileText size={20} className="text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">{uploadedFile.name}</p>
                    <p className="text-xs text-slate-400">업로드: {uploadedFile.uploadedAt}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 text-sm font-bold text-orange-600 hover:bg-orange-100 rounded-lg transition-all"
                >
                  변경
                </button>
              </div>
            ) : (
              <div
                className="flex flex-col items-center cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={32} className="text-gray-400 mb-2" />
                <p className="text-sm font-bold text-slate-600">파일을 선택하거나 드래그하세요</p>
                <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG (최대 5MB)</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* 대표 업종코드 */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <FileText size={16} className="text-slate-400" />
            대표 업종코드
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsCodeDropdownOpen(!isCodeDropdownOpen)}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg
                         text-sm font-medium text-slate-700 text-left
                         hover:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100
                         transition-all flex items-center justify-between"
            >
              <span>
                {formData.businessCategoryCode
                  ? `[${formData.businessCategoryCode}] ${formData.businessCategoryName}`
                  : '업종코드를 선택해주세요'}
              </span>
              <Search size={16} className="text-slate-400" />
            </button>

            {isCodeDropdownOpen && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                <div className="p-2 border-b border-gray-100">
                  <input
                    type="text"
                    placeholder="업종코드 또는 업종명 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
                               focus:outline-none focus:ring-2 focus:ring-orange-100"
                    autoFocus
                  />
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {filteredCategories.map((cat) => (
                    <button
                      key={cat.code}
                      type="button"
                      onClick={() => handleCategorySelect(cat.code, cat.name)}
                      className={`w-full px-4 py-3 text-left text-sm hover:bg-orange-50 transition-colors
                                  ${formData.businessCategoryCode === cat.code ? 'bg-orange-50 text-orange-600 font-bold' : 'text-slate-700'}`}
                    >
                      <span className="font-bold text-slate-500">[{cat.code}]</span> {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 직원 수 */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <Users size={16} className="text-slate-400" />
            직원 수 <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {EMPLOYEE_COUNT_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`flex items-center justify-center px-4 py-3 border rounded-lg cursor-pointer transition-all text-sm font-medium
                  ${formData.employeeCount === option.value
                    ? 'border-orange-500 bg-orange-50 text-orange-600'
                    : 'border-gray-300 bg-white text-slate-600 hover:border-orange-300'
                  }`}
              >
                <input
                  type="radio"
                  name="employeeCount"
                  value={option.value}
                  checked={formData.employeeCount === option.value}
                  onChange={handleChange}
                  className="sr-only"
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>

        {/* 기본 시간대 (고정) */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <Clock size={16} className="text-slate-400" />
            기본 시간대
          </label>
          <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg
                          text-sm font-medium text-slate-500 flex items-center gap-2">
            <span className="text-lg">🇰🇷</span>
            <span>한국 표준시 (UTC+9)</span>
          </div>
        </div>

        {/* 구분선 */}
        <div className="border-t border-gray-200 pt-8 mt-8">
          <h2 className="text-lg font-bold text-slate-800 mb-1">담당자 정보</h2>
          <p className="text-sm text-slate-500">시스템 및 결제 관련 담당자 정보를 입력합니다</p>
        </div>

        {/* 전산 관리자 */}
        <div className="p-5 bg-blue-50 border border-blue-200 rounded-xl space-y-4">
          <div className="flex items-center gap-2">
            <Headphones size={18} className="text-blue-600" />
            <h3 className="font-bold text-blue-800">전산 관리자</h3>
            <span className="text-xs text-blue-600">시스템 장애 및 기술 지원용</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">이름</label>
              <input
                type="text"
                name="techAdminName"
                value={formData.techAdminName}
                onChange={handleChange}
                placeholder="담당자명"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">연락처</label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  name="techAdminPhone"
                  value={formData.techAdminPhone}
                  onChange={handleChange}
                  placeholder="010-0000-0000"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">이메일</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  name="techAdminEmail"
                  value={formData.techAdminEmail}
                  onChange={handleChange}
                  placeholder="tech@company.com"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 결제 담당자 */}
        <div className="p-5 bg-purple-50 border border-purple-200 rounded-xl space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard size={18} className="text-purple-600" />
            <h3 className="font-bold text-purple-800">결제 담당자</h3>
            <span className="text-xs text-purple-600">청구서 발행 및 미납 안내용</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">이름</label>
              <input
                type="text"
                name="billingAdminName"
                value={formData.billingAdminName}
                onChange={handleChange}
                placeholder="담당자명"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-purple-100"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">연락처</label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  name="billingAdminPhone"
                  value={formData.billingAdminPhone}
                  onChange={handleChange}
                  placeholder="010-0000-0000"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-sm
                             focus:outline-none focus:ring-2 focus:ring-purple-100"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">이메일</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  name="billingAdminEmail"
                  value={formData.billingAdminEmail}
                  onChange={handleChange}
                  placeholder="billing@company.com"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-sm
                             focus:outline-none focus:ring-2 focus:ring-purple-100"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 저장/취소 버튼 */}
        <div className="pt-6 border-t border-gray-200 flex items-center gap-3">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white
                       bg-gradient-to-r from-orange-500 to-orange-600
                       hover:from-orange-600 hover:to-orange-700
                       shadow-sm transition-all"
          >
            <Save size={18} />
            저장하기
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-slate-600
                       bg-gray-100 hover:bg-gray-200 transition-all"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
}

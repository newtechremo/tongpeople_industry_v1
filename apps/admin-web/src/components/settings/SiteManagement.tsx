import { useState } from 'react';
import { Plus, Edit2, Trash2, Building2, MapPin, User, Phone, Clock, Save, X, ChevronRight } from 'lucide-react';
import type { Site, CheckoutPolicy } from '@tong-pass/shared';
import { useSites } from '@/context/SitesContext';

export default function SiteManagement() {
  const { sites, addSite, updateSite, deleteSite } = useSites();
  const [isAdding, setIsAdding] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [formData, setFormData] = useState<Partial<Site>>({
    name: '',
    address: '',
    managerName: '',
    managerPhone: '',
    checkoutPolicy: 'AUTO_8H',
    autoHours: 8,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      managerName: '',
      managerPhone: '',
      checkoutPolicy: 'AUTO_8H',
      autoHours: 8,
    });
  };

  const handleAddSite = () => {
    if (!formData.name?.trim()) {
      alert('현장명을 입력해주세요.');
      return;
    }
    const site: Site = {
      id: Date.now(),
      name: formData.name!,
      address: formData.address,
      managerName: formData.managerName,
      managerPhone: formData.managerPhone,
      checkoutPolicy: formData.checkoutPolicy as CheckoutPolicy,
      autoHours: formData.autoHours || 8,
    };
    addSite(site);
    resetForm();
    setIsAdding(false);
  };

  const handleEditSite = (site: Site) => {
    setEditingSite(site);
    setFormData({ ...site });
  };

  const handleUpdateSite = () => {
    if (!formData.name?.trim()) {
      alert('현장명을 입력해주세요.');
      return;
    }
    if (editingSite) {
      updateSite(editingSite.id, formData);
    }
    setEditingSite(null);
    resetForm();
  };

  const handleDeleteSite = (id: number) => {
    if (confirm('정말 삭제하시겠습니까?\n해당 현장의 모든 출퇴근 기록도 함께 삭제됩니다.')) {
      deleteSite(id);
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingSite(null);
    resetForm();
  };

  // 수정/추가 폼 (모달 형태)
  if (isAdding || editingSite) {
    return (
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {editingSite ? '현장 정보 수정' : '새 현장 추가'}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {editingSite ? '현장 정보 및 출퇴근 설정을 수정합니다' : '새로운 현장을 등록합니다'}
            </p>
          </div>
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-slate-600
                       bg-gray-100 hover:bg-gray-200 transition-all"
          >
            <X size={18} />
            취소
          </button>
        </div>

        {/* 폼 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
          {/* 기본 정보 섹션 */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Building2 size={16} />
              기본 정보
            </h3>

            {/* 현장명 */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">
                현장명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="예: 서울 본사, 연구소, 대전1공장, 물류센터"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-orange-100 hover:border-orange-400"
              />
            </div>

            {/* 현장 주소 */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <MapPin size={14} className="text-slate-400" />
                현장 주소
                <span className="text-xs text-slate-400 font-normal">(추후 GPS 연동 예정)</span>
              </label>
              <input
                type="text"
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="예: 서울특별시 강남구 테헤란로 123"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-orange-100 hover:border-orange-400"
              />
            </div>

            {/* 현장 책임자 & 대표번호 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <User size={14} className="text-slate-400" />
                  현장 책임자
                </label>
                <input
                  type="text"
                  value={formData.managerName || ''}
                  onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                  placeholder="예: 홍길동"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm
                             focus:outline-none focus:ring-2 focus:ring-orange-100 hover:border-orange-400"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Phone size={14} className="text-slate-400" />
                  현장 대표번호
                </label>
                <input
                  type="tel"
                  value={formData.managerPhone || ''}
                  onChange={(e) => setFormData({ ...formData, managerPhone: e.target.value })}
                  placeholder="예: 02-1234-5678"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm
                             focus:outline-none focus:ring-2 focus:ring-orange-100 hover:border-orange-400"
                />
              </div>
            </div>
          </div>

          {/* 구분선 */}
          <div className="border-t border-gray-200" />

          {/* 출퇴근 설정 섹션 */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Clock size={16} />
              출퇴근 설정
            </h3>

            {/* 퇴근 모드 */}
            <div className="space-y-3">
              <label className="block text-sm font-bold text-slate-700">퇴근 모드</label>
              <div className="space-y-3">
                <label className="flex items-start gap-4 p-4 border border-gray-200 rounded-xl cursor-pointer hover:border-orange-300 transition-all">
                  <input
                    type="radio"
                    name="checkoutPolicy"
                    value="AUTO_8H"
                    checked={formData.checkoutPolicy === 'AUTO_8H'}
                    onChange={(e) => setFormData({ ...formData, checkoutPolicy: e.target.value as CheckoutPolicy })}
                    className="mt-1 accent-orange-500"
                  />
                  <div className="flex-1">
                    <p className="font-bold text-slate-700">자동 퇴근 모드</p>
                    <p className="text-sm text-slate-500 mt-1">
                      출근 스캔 시 자동으로 설정 시간 후 퇴근 처리됩니다.
                      별도의 퇴근 체크가 어려운 현장에 적합합니다.
                    </p>
                  </div>
                </label>
                <label className="flex items-start gap-4 p-4 border border-gray-200 rounded-xl cursor-pointer hover:border-orange-300 transition-all">
                  <input
                    type="radio"
                    name="checkoutPolicy"
                    value="MANUAL"
                    checked={formData.checkoutPolicy === 'MANUAL'}
                    onChange={(e) => setFormData({ ...formData, checkoutPolicy: e.target.value as CheckoutPolicy })}
                    className="mt-1 accent-orange-500"
                  />
                  <div className="flex-1">
                    <p className="font-bold text-slate-700">수동 인증 모드</p>
                    <p className="text-sm text-slate-500 mt-1">
                      근로자가 직접 퇴근 버튼을 누르거나 관리자가 QR을 스캔해야 퇴근 처리됩니다.
                      정확한 공수 산정이 필요한 현장에 적합합니다.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* 자동 퇴근 시간 설정 */}
            {formData.checkoutPolicy === 'AUTO_8H' && (
              <div className="space-y-2 pl-4 border-l-4 border-orange-200">
                <label className="block text-sm font-bold text-slate-700">
                  자동 퇴근 기준 시간
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={formData.autoHours || 8}
                    onChange={(e) => setFormData({ ...formData, autoHours: Number(e.target.value) })}
                    min={1}
                    max={24}
                    className="w-24 px-4 py-3 border border-gray-300 rounded-lg text-center font-bold
                               focus:outline-none focus:ring-2 focus:ring-orange-100"
                  />
                  <span className="text-slate-600 font-medium">시간</span>
                </div>
                <p className="text-xs text-slate-500">출근 시간 기준으로 설정한 시간 후 자동 퇴근 처리됩니다.</p>
              </div>
            )}
          </div>
        </div>

        {/* 저장 버튼 */}
        <div className="flex items-center gap-3">
          <button
            onClick={editingSite ? handleUpdateSite : handleAddSite}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white
                       bg-gradient-to-r from-orange-500 to-orange-600
                       hover:from-orange-600 hover:to-orange-700
                       shadow-sm transition-all"
          >
            <Save size={18} />
            {editingSite ? '수정 완료' : '현장 추가'}
          </button>
          <button
            onClick={handleCancel}
            className="px-6 py-3 rounded-xl font-bold text-slate-600
                       bg-gray-100 hover:bg-gray-200 transition-all"
          >
            취소
          </button>
        </div>
      </div>
    );
  }

  // 현장 목록
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">현장 관리</h2>
          <p className="text-sm text-slate-500 mt-1">
            등록된 현장: {sites.length}개
          </p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-white
                     bg-gradient-to-r from-orange-500 to-orange-600
                     hover:from-orange-600 hover:to-orange-700
                     shadow-sm transition-all"
        >
          <Plus size={18} />
          현장 추가
        </button>
      </div>

      {/* 현장 목록 */}
      <div className="space-y-4">
        {sites.map((site) => (
          <div
            key={site.id}
            className="bg-white border border-gray-200 rounded-xl p-5 hover:border-orange-300 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-orange-50 rounded-xl">
                  <Building2 size={24} className="text-orange-500" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-slate-800">{site.name}</h3>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      site.checkoutPolicy === 'AUTO_8H'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {site.checkoutPolicy === 'AUTO_8H' ? `자동 ${site.autoHours}시간` : '수동 인증'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                    {site.address && (
                      <span className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-slate-400" />
                        {site.address}
                      </span>
                    )}
                    {site.managerName && (
                      <span className="flex items-center gap-1.5">
                        <User size={14} className="text-slate-400" />
                        {site.managerName}
                      </span>
                    )}
                    {site.managerPhone && (
                      <span className="flex items-center gap-1.5">
                        <Phone size={14} className="text-slate-400" />
                        {site.managerPhone}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEditSite(site)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-slate-600
                             bg-gray-100 hover:bg-gray-200 transition-all"
                >
                  <Edit2 size={16} />
                  수정
                  <ChevronRight size={16} className="text-slate-400" />
                </button>
                <button
                  onClick={() => handleDeleteSite(site.id)}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={18} className="text-red-500" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {sites.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Building2 size={48} className="mx-auto mb-4 opacity-50" />
            <p className="font-medium">등록된 현장이 없습니다</p>
            <p className="text-sm mt-1">새 현장을 추가해주세요</p>
          </div>
        )}
      </div>
    </div>
  );
}

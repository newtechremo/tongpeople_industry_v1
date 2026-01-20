import { useState } from 'react';
import { X, Send, User, Phone, Calendar, Briefcase, Shield, Flag, Users2 } from 'lucide-react';
import type { Team, UserRole } from '@tong-pass/shared';
import { inviteWorker } from '@/api/workers';

interface WorkerAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: Team[];
  onSuccess?: () => void;
}

// 직책/직종 옵션
const POSITION_OPTIONS = [
  '공사기사',
  '전기기사',
  '미장기사',
  '설비기사',
  '안전관리자',
  '일반근로자',
  '기타',
];

// 국적 옵션
const NATIONALITY_OPTIONS = [
  '대한민국',
  '중국',
  '베트남',
  '네팔',
  '미얀마',
  '캄보디아',
  '태국',
  '인도네시아',
  '우즈베키스탄',
  '기타',
];

interface FormData {
  teamId: string;
  name: string;
  phone: string;
  birthDate: string;
  position: string;
  role: UserRole;
  nationality: string;
  gender: 'M' | 'F';
}

export default function WorkerAddModal({ isOpen, onClose, teams, onSuccess }: WorkerAddModalProps) {
  const [formData, setFormData] = useState<FormData>({
    teamId: '',
    name: '',
    phone: '',
    birthDate: '',
    position: '',
    role: 'WORKER',
    nationality: '대한민국',
    gender: 'M',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.teamId) newErrors.teamId = '소속 팀을 선택해주세요';
    if (!formData.name.trim()) newErrors.name = '이름을 입력해주세요';
    if (!formData.phone.trim()) newErrors.phone = '휴대폰 번호를 입력해주세요';
    if (!/^[0-9]{8}$/.test(formData.birthDate.replace(/-/g, ''))) {
      newErrors.birthDate = '생년월일 8자리를 입력해주세요';
    }
    if (!formData.position) newErrors.position = '직책/직종을 선택해주세요';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const result = await inviteWorker({
        teamId: parseInt(formData.teamId),
        name: formData.name,
        phone: formData.phone,
        birthDate: formData.birthDate,
        position: formData.position,
        role: formData.role as 'WORKER' | 'TEAM_ADMIN',
        nationality: formData.nationality || 'KR',
        gender: formData.gender as 'M' | 'F' | undefined,
      });

      if (result.success) {
        alert('근로자 초대가 완료되었습니다.\n동의 링크가 문자로 발송되었습니다.');

        // Reset form
        setFormData({
          teamId: '',
          name: '',
          phone: '',
          birthDate: '',
          position: '',
          role: 'WORKER',
          nationality: '대한민국',
          gender: 'M',
        });

        onClose();
        onSuccess?.();
      } else {
        alert(result.error || '초대 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Error inviting worker:', error);
      alert('서버 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-800">신규 근로자 등록</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} className="text-slate-400" />
            </button>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            등록 후 휴대폰으로 동의 링크가 발송됩니다
          </p>
        </div>

        {/* Form */}
        <div className="p-6 space-y-5">
          {/* 소속 팀 */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
              <Users2 size={16} className="text-slate-400" />
              소속 팀 (업체) <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.teamId}
              onChange={(e) => handleChange('teamId', e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border ${
                errors.teamId ? 'border-red-500' : 'border-gray-200'
              } focus:outline-none focus:ring-2 focus:ring-orange-500`}
            >
              <option value="">팀을 선택하세요</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
            {errors.teamId && (
              <p className="text-sm text-red-500 mt-1">{errors.teamId}</p>
            )}
          </div>

          {/* 이름 */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
              <User size={16} className="text-slate-400" />
              이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="실명을 입력하세요"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border ${
                errors.name ? 'border-red-500' : 'border-gray-200'
              } focus:outline-none focus:ring-2 focus:ring-orange-500`}
            />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name}</p>
            )}
          </div>

          {/* 휴대폰 번호 */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
              <Phone size={16} className="text-slate-400" />
              휴대폰 번호 <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              placeholder="010-0000-0000"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border ${
                errors.phone ? 'border-red-500' : 'border-gray-200'
              } focus:outline-none focus:ring-2 focus:ring-orange-500`}
            />
            {errors.phone && (
              <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
            )}
            <p className="text-xs text-slate-400 mt-1">동의 링크가 발송됩니다</p>
          </div>

          {/* 생년월일 */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
              <Calendar size={16} className="text-slate-400" />
              생년월일 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="19800101 (8자리)"
              maxLength={8}
              value={formData.birthDate}
              onChange={(e) => handleChange('birthDate', e.target.value.replace(/\D/g, ''))}
              className={`w-full px-4 py-3 rounded-xl border ${
                errors.birthDate ? 'border-red-500' : 'border-gray-200'
              } focus:outline-none focus:ring-2 focus:ring-orange-500`}
            />
            {errors.birthDate && (
              <p className="text-sm text-red-500 mt-1">{errors.birthDate}</p>
            )}
            <p className="text-xs text-slate-400 mt-1">만 65세 이상 자동 판별</p>
          </div>

          {/* 직책/직종 - 선택 또는 직접 입력 */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
              <Briefcase size={16} className="text-slate-400" />
              직책/직종 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                list="position-options"
                placeholder="선택하거나 직접 입력"
                value={formData.position}
                onChange={(e) => handleChange('position', e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border ${
                  errors.position ? 'border-red-500' : 'border-gray-200'
                } focus:outline-none focus:ring-2 focus:ring-orange-500`}
              />
              <datalist id="position-options">
                {POSITION_OPTIONS.map(pos => (
                  <option key={pos} value={pos} />
                ))}
              </datalist>
            </div>
            {errors.position && (
              <p className="text-sm text-red-500 mt-1">{errors.position}</p>
            )}
            <p className="text-xs text-slate-400 mt-1">목록에서 선택하거나 직접 입력하세요</p>
          </div>

          {/* 시스템 권한 */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
              <Shield size={16} className="text-slate-400" />
              시스템 권한
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="WORKER"
                  checked={formData.role === 'WORKER'}
                  onChange={() => handleChange('role', 'WORKER')}
                  className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                />
                <span className="text-sm text-slate-700">일반 근로자</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="TEAM_ADMIN"
                  checked={formData.role === 'TEAM_ADMIN'}
                  onChange={() => handleChange('role', 'TEAM_ADMIN')}
                  className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                />
                <span className="text-sm text-slate-700">팀 관리자 (QR 리더)</span>
              </label>
            </div>
          </div>

          {/* 국적 & 성별 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                <Flag size={16} className="text-slate-400" />
                국적
              </label>
              <select
                value={formData.nationality}
                onChange={(e) => handleChange('nationality', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200
                           focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {NATIONALITY_OPTIONS.map(nat => (
                  <option key={nat} value={nat}>{nat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700 mb-2 block">성별</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleChange('gender', 'M')}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-colors ${
                    formData.gender === 'M'
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                  }`}
                >
                  남성
                </button>
                <button
                  type="button"
                  onClick={() => handleChange('gender', 'F')}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-colors ${
                    formData.gender === 'F'
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                  }`}
                >
                  여성
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-2xl">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-white border border-gray-200
                         hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white
                         bg-gradient-to-r from-orange-500 to-orange-600
                         hover:from-orange-600 hover:to-orange-700 transition-all
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={16} />
              {loading ? '초대 중...' : '동의링크 발송'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

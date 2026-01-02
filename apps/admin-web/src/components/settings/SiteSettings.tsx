import { useState } from 'react';
import { Save, Clock, Calendar, AlertCircle } from 'lucide-react';
import { WORK_DAY_START_HOUR, DEFAULT_AUTO_CHECKOUT_HOURS, SENIOR_AGE_THRESHOLD } from '@tong-pass/shared';

export default function SiteSettings() {
  const [settings, setSettings] = useState({
    checkoutPolicy: 'AUTO_8H',
    autoCheckoutHours: DEFAULT_AUTO_CHECKOUT_HOURS,
    workDayStartHour: WORK_DAY_START_HOUR,
    seniorAgeThreshold: SENIOR_AGE_THRESHOLD,
    autoCloseTime: '18:00', // 수동 모드 시 미퇴근자 강제 퇴근 시간
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: name.includes('Hour') || name.includes('Threshold') ? Number(value) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('현장 설정이 저장되었습니다.');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-800">현장 설정</h2>
        <p className="text-sm text-slate-500 mt-1">
          선택된 현장의 출퇴근 정책을 설정합니다
        </p>
      </div>

      {/* 현장 선택 안내 */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
        <AlertCircle size={20} className="text-blue-500 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-blue-800">현재 선택된 현장: 경희대학교 학생회관</p>
          <p className="text-sm text-blue-600 mt-1">
            상단 헤더에서 다른 현장을 선택하면 해당 현장의 설정을 변경할 수 있습니다.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 max-w-xl">
        {/* 퇴근 모드 */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <Clock size={16} />
            퇴근 모드
          </h3>
          <div className="space-y-3">
            <label className="flex items-start gap-4 p-4 border border-gray-200 rounded-xl cursor-pointer hover:border-orange-300 transition-all">
              <input
                type="radio"
                name="checkoutPolicy"
                value="AUTO_8H"
                checked={settings.checkoutPolicy === 'AUTO_8H'}
                onChange={handleChange}
                className="mt-1 accent-orange-500"
              />
              <div>
                <p className="font-bold text-slate-700">자동 8시간 모드</p>
                <p className="text-sm text-slate-500 mt-1">
                  출근 스캔 시 자동으로 출근시간 + 설정시간 후 퇴근 처리됩니다.
                  별도의 퇴근 체크가 어려운 현장에 적합합니다.
                </p>
              </div>
            </label>
            <label className="flex items-start gap-4 p-4 border border-gray-200 rounded-xl cursor-pointer hover:border-orange-300 transition-all">
              <input
                type="radio"
                name="checkoutPolicy"
                value="MANUAL"
                checked={settings.checkoutPolicy === 'MANUAL'}
                onChange={handleChange}
                className="mt-1 accent-orange-500"
              />
              <div>
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
        {settings.checkoutPolicy === 'AUTO_8H' && (
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">
              자동 퇴근 기준 시간
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                name="autoCheckoutHours"
                value={settings.autoCheckoutHours}
                onChange={handleChange}
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

        {/* 수동 모드 - 미퇴근자 자동처리 시간 */}
        {settings.checkoutPolicy === 'MANUAL' && (
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">
              미퇴근자 자동처리 시간
            </label>
            <input
              type="time"
              name="autoCloseTime"
              value={settings.autoCloseTime}
              onChange={handleChange}
              className="px-4 py-3 border border-gray-300 rounded-lg font-bold
                         focus:outline-none focus:ring-2 focus:ring-orange-100"
            />
            <p className="text-xs text-slate-500">해당 시간까지 퇴근 기록이 없으면 강제 퇴근 처리됩니다.</p>
          </div>
        )}

        {/* 근무일 기준 */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <Calendar size={16} />
            근무일 기준
          </h3>
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">
              근무일 시작 시간
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                name="workDayStartHour"
                value={settings.workDayStartHour}
                onChange={handleChange}
                min={0}
                max={23}
                className="w-24 px-4 py-3 border border-gray-300 rounded-lg text-center font-bold
                           focus:outline-none focus:ring-2 focus:ring-orange-100"
              />
              <span className="text-slate-600 font-medium">시</span>
            </div>
            <p className="text-xs text-slate-500">
              설정된 시간부터 다음날 설정시간 전까지를 하나의 근무일로 계산합니다.
              (예: 4시 설정 시 04:00 ~ 익일 03:59)
            </p>
          </div>
        </div>

        {/* 고령자 기준 */}
        <div className="space-y-2">
          <label className="block text-sm font-bold text-slate-700">
            고령자 기준 나이
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              name="seniorAgeThreshold"
              value={settings.seniorAgeThreshold}
              onChange={handleChange}
              min={50}
              max={80}
              className="w-24 px-4 py-3 border border-gray-300 rounded-lg text-center font-bold
                         focus:outline-none focus:ring-2 focus:ring-orange-100"
            />
            <span className="text-slate-600 font-medium">세 이상</span>
          </div>
          <p className="text-xs text-slate-500">대시보드 고령자 현황에 표시되는 기준 나이입니다.</p>
        </div>

        {/* 저장 버튼 */}
        <div className="pt-4">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white
                       bg-gradient-to-r from-orange-500 to-orange-600
                       hover:from-orange-600 hover:to-orange-700
                       shadow-sm transition-all"
          >
            <Save size={18} />
            설정 저장
          </button>
        </div>
      </form>
    </div>
  );
}

/**
 * 작업기간 Fieldset
 *
 * 작업 시작일, 종료일 선택
 */

import { format } from 'date-fns';

interface Props {
  startDate: Date;
  endDate: Date;
  errors: Record<string, string>;
  onChange: (field: string, value: Date) => void;
}

export default function WorkPeriodFieldset({
  startDate,
  endDate,
  errors,
  onChange,
}: Props) {
  const formatDateForInput = (date: Date): string => {
    return format(date, 'yyyy-MM-dd');
  };

  const parseInputDate = (dateString: string): Date => {
    return new Date(dateString);
  };

  return (
    <div className="p-8 rounded-2xl border border-gray-200 bg-white space-y-6">
      <h3 className="text-lg font-bold text-slate-800">작업 기간</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="workStartDate" className="block text-sm font-bold text-slate-700 mb-2">
            작업 시작일 <span className="text-orange-500">*</span>
          </label>
          <input
            type="date"
            id="workStartDate"
            value={formatDateForInput(startDate)}
            onChange={(e) => onChange('work_start_date', parseInputDate(e.target.value))}
            className={`w-full px-4 py-3 rounded-xl border-2 ${
              errors.work_start_date
                ? 'border-red-300 bg-red-50'
                : 'border-gray-200 bg-white'
            } focus:outline-none focus:border-orange-500`}
          />
          {errors.work_start_date && (
            <p className="mt-1 text-sm text-red-600">{errors.work_start_date}</p>
          )}
        </div>

        <div>
          <label htmlFor="workEndDate" className="block text-sm font-bold text-slate-700 mb-2">
            작업 종료일 <span className="text-orange-500">*</span>
          </label>
          <input
            type="date"
            id="workEndDate"
            value={formatDateForInput(endDate)}
            onChange={(e) => onChange('work_end_date', parseInputDate(e.target.value))}
            className={`w-full px-4 py-3 rounded-xl border-2 ${
              errors.work_end_date
                ? 'border-red-300 bg-red-50'
                : 'border-gray-200 bg-white'
            } focus:outline-none focus:border-orange-500`}
          />
          {errors.work_end_date && (
            <p className="mt-1 text-sm text-red-600">{errors.work_end_date}</p>
          )}
        </div>
      </div>

      {startDate && endDate && (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <p className="text-sm text-slate-600">
            작업 기간:{' '}
            <span className="font-bold text-slate-800">
              {format(startDate, 'yyyy년 MM월 dd일')} ~ {format(endDate, 'yyyy년 MM월 dd일')}
            </span>
            {' '}
            ({Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))}일)
          </p>
        </div>
      )}
    </div>
  );
}

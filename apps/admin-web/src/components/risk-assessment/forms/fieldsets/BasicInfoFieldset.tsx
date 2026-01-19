/**
 * 기본정보 Fieldset
 *
 * 제목, 현장, 팀 선택
 */

interface Props {
  title: string;
  siteId: string;
  teamId?: string;
  errors: Record<string, string>;
  onChange: (field: string, value: string) => void;
}

export default function BasicInfoFieldset({
  title,
  siteId,
  teamId,
  errors,
  onChange,
}: Props) {
  // TODO: 실제 현장/팀 목록은 API에서 가져와야 함 (현재는 Mock)
  const mockSites = [
    { id: 'site-1', name: '대전공장' },
    { id: 'site-2', name: '서울본사' },
    { id: 'site-3', name: '부산지사' },
  ];

  const mockTeams = [
    { id: 'team-1', name: '(주)정이앤지' },
    { id: 'team-2', name: '협력업체A' },
    { id: 'team-3', name: '(주)건설엔지니어링' },
  ];

  return (
    <div className="p-8 rounded-2xl border border-gray-200 bg-white space-y-6">
      <h3 className="text-lg font-bold text-slate-800">기본정보</h3>

      {/* 평가 제목 */}
      <div>
        <label htmlFor="title" className="block text-sm font-bold text-slate-700 mb-2">
          평가 제목 <span className="text-orange-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => onChange('title', e.target.value)}
          placeholder="예: 2024년 상반기 최초 위험성평가"
          className={`w-full px-4 py-3 rounded-xl border-2 ${
            errors.title
              ? 'border-red-300 bg-red-50'
              : 'border-gray-200 bg-white'
          } focus:outline-none focus:border-orange-500`}
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title}</p>
        )}
      </div>

      {/* 현장 선택 */}
      <div>
        <label htmlFor="siteId" className="block text-sm font-bold text-slate-700 mb-2">
          현장 <span className="text-orange-500">*</span>
        </label>
        <select
          id="siteId"
          value={siteId}
          onChange={(e) => onChange('site_id', e.target.value)}
          className={`w-full px-4 py-3 rounded-xl border-2 ${
            errors.site_id
              ? 'border-red-300 bg-red-50'
              : 'border-gray-200 bg-white'
          } focus:outline-none focus:border-orange-500`}
        >
          <option value="">현장을 선택하세요</option>
          {mockSites.map((site) => (
            <option key={site.id} value={site.id}>
              {site.name}
            </option>
          ))}
        </select>
        {errors.site_id && (
          <p className="mt-1 text-sm text-red-600">{errors.site_id}</p>
        )}
      </div>

      {/* 팀 선택 (선택사항) */}
      <div>
        <label htmlFor="teamId" className="block text-sm font-bold text-slate-700 mb-2">
          팀(업체) <span className="text-slate-400 text-xs">(선택사항)</span>
        </label>
        <select
          id="teamId"
          value={teamId || ''}
          onChange={(e) => onChange('team_id', e.target.value)}
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white focus:outline-none focus:border-orange-500"
        >
          <option value="">전체 (팀 미지정)</option>
          {mockTeams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

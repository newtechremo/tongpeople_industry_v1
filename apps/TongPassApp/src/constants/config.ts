// 직책/직종 옵션
export const JOB_TITLE_OPTIONS = [
  '공사기사',
  '전기기사',
  '미장기사',
  '설비기사',
  '안전관리자',
  '일반근로자',
  '기타',
];

// 국적 옵션
export const NATIONALITY_OPTIONS = [
  {code: 'KR', label: '대한민국'},
  {code: 'CN', label: '중국'},
  {code: 'VN', label: '베트남'},
  {code: 'NP', label: '네팔'},
  {code: 'MM', label: '미얀마'},
  {code: 'KH', label: '캄보디아'},
  {code: 'TH', label: '태국'},
  {code: 'ID', label: '인도네시아'},
  {code: 'UZ', label: '우즈베키스탄'},
  {code: 'ETC', label: '기타'},
];

// 약관 목록
export const TERMS_LIST = [
  {id: 'service', label: '서비스 이용약관', required: true},
  {id: 'privacy', label: '개인정보 수집 및 이용 동의', required: true},
  {id: 'thirdParty', label: '개인정보 제3자 제공 동의', required: true},
  {id: 'location', label: '위치기반서비스 이용 약관', required: true},
];

// SMS 인증 타이머 (초)
export const SMS_VERIFY_TIMEOUT = 180;

// 고령자 기준 나이
export const SENIOR_AGE = 65;

import {SENIOR_AGE} from '@/constants';

// 전화번호 유효성 검사 (한국)
export const isValidPhoneNumber = (phone: string): boolean => {
  const cleaned = phone.replace(/[^0-9]/g, '');
  return /^01[0-9]{8,9}$/.test(cleaned);
};

// 생년월일 유효성 검사 (YYYYMMDD)
export const isValidBirthDate = (birthDate: string): boolean => {
  if (!/^\d{8}$/.test(birthDate)) {
    return false;
  }

  const year = parseInt(birthDate.substring(0, 4), 10);
  const month = parseInt(birthDate.substring(4, 6), 10);
  const day = parseInt(birthDate.substring(6, 8), 10);

  if (month < 1 || month > 12) {
    return false;
  }
  if (day < 1 || day > 31) {
    return false;
  }
  if (year < 1900 || year > new Date().getFullYear()) {
    return false;
  }

  return true;
};

// 만 나이 계산
export const calculateAge = (birthDate: string): number => {
  const birth = new Date(
    parseInt(birthDate.substring(0, 4), 10),
    parseInt(birthDate.substring(4, 6), 10) - 1,
    parseInt(birthDate.substring(6, 8), 10),
  );

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
};

// 고령자 여부 (만 65세 이상)
export const isSenior = (birthDate: string): boolean => {
  return calculateAge(birthDate) >= SENIOR_AGE;
};

// 이메일 유효성 검사
export const isValidEmail = (email: string): boolean => {
  if (!email) {
    return true;
  } // 선택 항목
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// 회사코드 유효성 검사
export const isValidCompanyCode = (code: string): boolean => {
  return /^[A-Za-z0-9]{4,10}$/.test(code);
};

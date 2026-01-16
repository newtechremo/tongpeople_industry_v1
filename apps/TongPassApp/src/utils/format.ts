// 전화번호 포맷팅 (010-1234-5678)
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

// 생년월일 포맷팅 (1985.03.15)
export const formatBirthDate = (birthDate: string): string => {
  if (birthDate.length !== 8) {
    return birthDate;
  }
  return `${birthDate.slice(0, 4)}.${birthDate.slice(4, 6)}.${birthDate.slice(6)}`;
};

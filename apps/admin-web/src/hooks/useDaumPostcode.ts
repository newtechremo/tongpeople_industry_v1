// Daum 우편번호 검색 훅
import { useCallback } from 'react';

export interface AddressData {
  zonecode: string; // 우편번호
  address: string; // 기본 주소 (도로명 또는 지번)
  roadAddress: string; // 도로명 주소
  jibunAddress: string; // 지번 주소
  buildingName: string; // 건물명
  sido: string; // 시도
  sigungu: string; // 시군구
  bname: string; // 법정동
}

interface UseDaumPostcodeOptions {
  onComplete: (data: AddressData) => void;
  onClose?: () => void;
}

export function useDaumPostcode({ onComplete, onClose }: UseDaumPostcodeOptions) {
  const openPostcode = useCallback(() => {
    if (!window.daum || !window.daum.Postcode) {
      console.error('Daum Postcode 스크립트가 로드되지 않았습니다.');
      alert('주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    new window.daum.Postcode({
      oncomplete: (data) => {
        // 도로명 주소 우선, 없으면 지번 주소
        const address = data.roadAddress || data.jibunAddress;

        onComplete({
          zonecode: data.zonecode,
          address,
          roadAddress: data.roadAddress,
          jibunAddress: data.jibunAddress,
          buildingName: data.buildingName,
          sido: data.sido,
          sigungu: data.sigungu,
          bname: data.bname,
        });
      },
      onclose: onClose,
      width: '100%',
      height: '100%',
    }).open();
  }, [onComplete, onClose]);

  return { openPostcode };
}

export default useDaumPostcode;

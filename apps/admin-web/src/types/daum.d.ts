// Daum 우편번호 서비스 타입 정의
declare namespace daum {
  interface PostcodeData {
    zonecode: string; // 우편번호
    address: string; // 기본 주소
    addressEnglish: string; // 영문 주소
    addressType: 'R' | 'J'; // R: 도로명, J: 지번
    roadAddress: string; // 도로명 주소
    roadAddressEnglish: string;
    jibunAddress: string; // 지번 주소
    jibunAddressEnglish: string;
    buildingCode: string; // 건물 관리 번호
    buildingName: string; // 건물명
    apartment: 'Y' | 'N'; // 아파트 여부
    sido: string; // 시도
    sigungu: string; // 시군구
    sigunguCode: string;
    bname: string; // 법정동/법정리
    bname1: string;
    bname2: string;
    roadname: string; // 도로명
    roadnameCode: string;
    userSelectedType: 'R' | 'J'; // 사용자 선택 주소 타입
    autoRoadAddress: string;
    autoJibunAddress: string;
  }

  interface PostcodeOptions {
    oncomplete: (data: PostcodeData) => void;
    onclose?: () => void;
    width?: string | number;
    height?: string | number;
    animation?: boolean;
    focusInput?: boolean;
    autoMapping?: boolean;
  }

  class Postcode {
    constructor(options: PostcodeOptions);
    open(): void;
    embed(element: HTMLElement): void;
  }
}

interface Window {
  daum: typeof daum;
}

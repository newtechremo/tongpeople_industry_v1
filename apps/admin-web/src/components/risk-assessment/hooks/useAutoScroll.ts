/**
 * 자동 스크롤 Hook
 *
 * 자동 확장/스크롤 정책:
 * - 기본: CLICK_NEXT 성공 시 다음 섹션으로 자동 스크롤
 * - 자동 스크롤 금지 조건:
 *   - 최근 1초 내 수동 스크롤 발생
 *   - 사용자가 이미 다른 섹션을 수동 편집 중
 *   - 모바일 키보드 활성 상태 (향후 확장)
 * - 접근성: 자동 이동 시 섹션 제목에 포커스 이동
 */

import { useEffect, useRef, useCallback } from 'react';

interface UseAutoScrollOptions {
  /** 스크롤 활성화 여부 */
  enabled?: boolean;
  /** 스크롤 완료 후 콜백 */
  onScrollComplete?: () => void;
}

export function useAutoScroll(options: UseAutoScrollOptions = {}) {
  const { enabled = true, onScrollComplete } = options;
  const lastManualScrollTime = useRef<number>(0);
  const isAutoScrolling = useRef<boolean>(false);

  // 수동 스크롤 감지
  useEffect(() => {
    if (!enabled) return;

    const handleScroll = () => {
      // 자동 스크롤 중이면 수동 스크롤로 간주하지 않음
      if (isAutoScrolling.current) return;

      lastManualScrollTime.current = Date.now();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [enabled]);

  /**
   * 특정 요소로 스크롤
   */
  const scrollToElement = useCallback(
    (elementId: string, focus = true) => {
      if (!enabled) return;

      // 최근 1초 내 수동 스크롤이 있었다면 자동 스크롤 차단
      const timeSinceManualScroll = Date.now() - lastManualScrollTime.current;
      if (timeSinceManualScroll < 1000) {
        console.log('[AutoScroll] Blocked: Recent manual scroll detected');
        return;
      }

      const element = document.getElementById(elementId);
      if (!element) {
        console.warn(`[AutoScroll] Element not found: ${elementId}`);
        return;
      }

      isAutoScrolling.current = true;

      // 스크롤 실행
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });

      // 접근성: 포커스 이동
      if (focus) {
        // 스크롤 애니메이션 완료 후 포커스
        setTimeout(() => {
          const focusableElement = element.querySelector<HTMLElement>(
            'button, [tabindex]:not([tabindex="-1"])'
          );
          if (focusableElement) {
            focusableElement.focus();
          } else {
            element.focus();
          }

          isAutoScrolling.current = false;
          onScrollComplete?.();
        }, 500);
      } else {
        setTimeout(() => {
          isAutoScrolling.current = false;
          onScrollComplete?.();
        }, 500);
      }
    },
    [enabled, onScrollComplete]
  );

  /**
   * 섹션으로 스크롤 (섹션 ID 기반)
   */
  const scrollToSection = useCallback(
    (sectionId: string, focus = true) => {
      scrollToElement(`section-${sectionId}`, focus);
    },
    [scrollToElement]
  );

  return {
    scrollToElement,
    scrollToSection,
  };
}

import { useState, useCallback, useEffect } from 'react';
import type {
  OnboardingData,
  OnboardingStep1,
  OnboardingStep2,
  OnboardingStep3,
  OnboardingStep4,
} from '@tong-pass/shared';

const STORAGE_KEY = 'tongpass_onboarding';

// Initial state
const initialData: OnboardingData = {
  step1: null,
  step2: null,
  step3: null,
  step4: null,
  currentStep: 1,
};

// Load from localStorage
function loadFromStorage(): OnboardingData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as OnboardingData;
    }
  } catch {
    console.error('Failed to load onboarding data from storage');
  }
  return initialData;
}

// Save to localStorage
function saveToStorage(data: OnboardingData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    console.error('Failed to save onboarding data to storage');
  }
}

// Clear from localStorage
function clearStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    console.error('Failed to clear onboarding data from storage');
  }
}

export interface UseOnboardingReturn {
  data: OnboardingData;
  currentStep: OnboardingData['currentStep'];
  setStep1: (data: OnboardingStep1) => void;
  setStep2: (data: OnboardingStep2) => void;
  setStep3: (data: OnboardingStep3) => void;
  setStep4: (data: OnboardingStep4) => void;
  goToStep: (step: OnboardingData['currentStep']) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
  isStepComplete: (step: number) => boolean;
}

export function useOnboarding(): UseOnboardingReturn {
  const [data, setData] = useState<OnboardingData>(loadFromStorage);

  // Persist to localStorage whenever data changes
  useEffect(() => {
    saveToStorage(data);
  }, [data]);

  const setStep1 = useCallback((step1Data: OnboardingStep1) => {
    setData((prev) => ({
      ...prev,
      step1: step1Data,
    }));
  }, []);

  const setStep2 = useCallback((step2Data: OnboardingStep2) => {
    setData((prev) => ({
      ...prev,
      step2: step2Data,
    }));
  }, []);

  const setStep3 = useCallback((step3Data: OnboardingStep3) => {
    setData((prev) => ({
      ...prev,
      step3: step3Data,
    }));
  }, []);

  const setStep4 = useCallback((step4Data: OnboardingStep4) => {
    setData((prev) => ({
      ...prev,
      step4: step4Data,
    }));
  }, []);

  const goToStep = useCallback((step: OnboardingData['currentStep']) => {
    setData((prev) => ({
      ...prev,
      currentStep: step,
    }));
  }, []);

  const nextStep = useCallback(() => {
    setData((prev) => {
      const next = Math.min(prev.currentStep + 1, 6) as OnboardingData['currentStep'];
      return {
        ...prev,
        currentStep: next,
      };
    });
  }, []);

  const prevStep = useCallback(() => {
    setData((prev) => {
      const previous = Math.max(prev.currentStep - 1, 1) as OnboardingData['currentStep'];
      return {
        ...prev,
        currentStep: previous,
      };
    });
  }, []);

  const reset = useCallback(() => {
    setData(initialData);
    clearStorage();
  }, []);

  const isStepComplete = useCallback(
    (step: number): boolean => {
      switch (step) {
        case 1:
          return !!(
            data.step1?.name &&
            data.step1?.phone &&
            data.step1?.phoneVerified &&
            data.step1?.termsAgreed &&
            data.step1?.privacyAgreed
          );
        case 2:
          return !!(
            data.step2?.companyName &&
            data.step2?.ceoName &&
            data.step2?.address &&
            data.step2?.businessNumber
          );
        case 3:
          return !!(
            data.step3?.siteName &&
            data.step3?.siteAddress &&
            data.step3?.checkoutPolicy
          );
        case 4:
          return !!(data.step4?.password && data.step4?.passwordConfirm);
        default:
          return false;
      }
    },
    [data]
  );

  return {
    data,
    currentStep: data.currentStep,
    setStep1,
    setStep2,
    setStep3,
    setStep4,
    goToStep,
    nextStep,
    prevStep,
    reset,
    isStepComplete,
  };
}

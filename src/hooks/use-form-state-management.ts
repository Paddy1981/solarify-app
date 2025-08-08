"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { UseFormReturn, FieldValues } from 'react-hook-form';
import { debounce } from 'lodash';

// Form state management types
export interface FormStateConfig {
  storageKey: string;
  autoSaveInterval?: number; // milliseconds
  enableLocalStorage?: boolean;
  enableSessionStorage?: boolean;
  enableCloudSync?: boolean;
  maxHistoryEntries?: number;
  excludeFields?: string[];
  encryptSensitiveFields?: boolean;
}

export interface FormHistoryEntry {
  id: string;
  timestamp: Date;
  data: any;
  step?: number;
  label?: string;
}

export interface FormRecoveryData {
  data: any;
  timestamp: Date;
  step?: number;
  version: string;
}

// Main form state management hook
export function useFormStateManagement<TFieldValues extends FieldValues = FieldValues>({
  form,
  config
}: {
  form: UseFormReturn<TFieldValues>;
  config: FormStateConfig;
}) {
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [history, setHistory] = useState<FormHistoryEntry[]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);
  const [recoveryData, setRecoveryData] = useState<FormRecoveryData | null>(null);
  
  const autoSaveTimeout = useRef<NodeJS.Timeout>();
  const lastSavedData = useRef<any>(null);
  const formVersion = useRef('1.0.0');

  const {
    storageKey,
    autoSaveInterval = 30000, // 30 seconds
    enableLocalStorage = true,
    enableSessionStorage = false,
    enableCloudSync = false,
    maxHistoryEntries = 10,
    excludeFields = ['password', 'confirmPassword', 'creditCard'],
    encryptSensitiveFields = true
  } = config;

  // Storage utilities
  const getStorageKey = useCallback((suffix?: string) => {
    return suffix ? `${storageKey}_${suffix}` : storageKey;
  }, [storageKey]);

  const saveToStorage = useCallback((data: any, suffix?: string) => {
    const key = getStorageKey(suffix);
    const payload = {
      data: filterSensitiveData(data),
      timestamp: new Date().toISOString(),
      version: formVersion.current
    };

    if (enableLocalStorage) {
      try {
        localStorage.setItem(key, JSON.stringify(payload));
      } catch (error) {
        console.warn('Failed to save to localStorage:', error);
      }
    }

    if (enableSessionStorage) {
      try {
        sessionStorage.setItem(key, JSON.stringify(payload));
      } catch (error) {
        console.warn('Failed to save to sessionStorage:', error);
      }
    }
  }, [getStorageKey, enableLocalStorage, enableSessionStorage]);

  const loadFromStorage = useCallback((suffix?: string) => {
    const key = getStorageKey(suffix);
    
    let data = null;
    
    if (enableLocalStorage) {
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          data = JSON.parse(stored);
        }
      } catch (error) {
        console.warn('Failed to load from localStorage:', error);
      }
    }

    if (!data && enableSessionStorage) {
      try {
        const stored = sessionStorage.getItem(key);
        if (stored) {
          data = JSON.parse(stored);
        }
      } catch (error) {
        console.warn('Failed to load from sessionStorage:', error);
      }
    }

    return data;
  }, [getStorageKey, enableLocalStorage, enableSessionStorage]);

  const clearStorage = useCallback((suffix?: string) => {
    const key = getStorageKey(suffix);
    
    if (enableLocalStorage) {
      localStorage.removeItem(key);
    }
    
    if (enableSessionStorage) {
      sessionStorage.removeItem(key);
    }
  }, [getStorageKey, enableLocalStorage, enableSessionStorage]);

  // Filter out sensitive data based on configuration
  const filterSensitiveData = useCallback((data: any) => {
    if (!data || typeof data !== 'object') return data;
    
    const filtered = { ...data };
    
    excludeFields.forEach(field => {
      if (field in filtered) {
        if (encryptSensitiveFields) {
          // In a real app, implement proper encryption here
          filtered[field] = '[ENCRYPTED]';
        } else {
          delete filtered[field];
        }
      }
    });
    
    return filtered;
  }, [excludeFields, encryptSensitiveFields]);

  // Auto-save functionality
  const performAutoSave = useCallback(async () => {
    const currentData = form.getValues();
    
    // Skip if data hasn't changed
    if (JSON.stringify(currentData) === JSON.stringify(lastSavedData.current)) {
      return;
    }

    setIsAutoSaving(true);
    
    try {
      // Save to local storage
      saveToStorage(currentData, 'autosave');
      
      // Cloud sync if enabled
      if (enableCloudSync) {
        // Implement cloud sync logic here
        await syncToCloud(currentData);
      }
      
      lastSavedData.current = currentData;
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      
      // Add to history
      const historyEntry: FormHistoryEntry = {
        id: `auto_${Date.now()}`,
        timestamp: new Date(),
        data: currentData,
        label: 'Auto-save'
      };
      
      setHistory(prev => {
        const newHistory = [historyEntry, ...prev];
        return newHistory.slice(0, maxHistoryEntries);
      });
      
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsAutoSaving(false);
    }
  }, [form, saveToStorage, enableCloudSync, maxHistoryEntries]);

  // Debounced auto-save
  const debouncedAutoSave = useCallback(
    debounce(performAutoSave, 2000),
    [performAutoSave]
  );

  // Manual save
  const saveManually = useCallback(async (label?: string) => {
    const currentData = form.getValues();
    
    setIsAutoSaving(true);
    
    try {
      saveToStorage(currentData, 'manual');
      
      if (enableCloudSync) {
        await syncToCloud(currentData);
      }
      
      const historyEntry: FormHistoryEntry = {
        id: `manual_${Date.now()}`,
        timestamp: new Date(),
        data: currentData,
        label: label || 'Manual save'
      };
      
      setHistory(prev => {
        const newHistory = [historyEntry, ...prev];
        return newHistory.slice(0, maxHistoryEntries);
      });
      
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      lastSavedData.current = currentData;
      
    } catch (error) {
      console.error('Manual save failed:', error);
      throw error;
    } finally {
      setIsAutoSaving(false);
    }
  }, [form, saveToStorage, enableCloudSync, maxHistoryEntries]);

  // Recovery functionality
  const loadRecoveryData = useCallback(() => {
    const data = loadFromStorage('autosave') || loadFromStorage('manual');
    if (data) {
      setRecoveryData({
        data: data.data,
        timestamp: new Date(data.timestamp),
        version: data.version
      });
    }
  }, [loadFromStorage]);

  const applyRecoveryData = useCallback(() => {
    if (recoveryData) {
      form.reset(recoveryData.data);
      setRecoveryData(null);
      lastSavedData.current = recoveryData.data;
      setHasUnsavedChanges(false);
    }
  }, [form, recoveryData]);

  const dismissRecoveryData = useCallback(() => {
    setRecoveryData(null);
    clearStorage('autosave');
  }, [clearStorage]);

  // History navigation
  const undo = useCallback(() => {
    if (currentHistoryIndex < history.length - 1) {
      const newIndex = currentHistoryIndex + 1;
      const historyEntry = history[newIndex];
      form.reset(historyEntry.data);
      setCurrentHistoryIndex(newIndex);
    }
  }, [form, history, currentHistoryIndex]);

  const redo = useCallback(() => {
    if (currentHistoryIndex > 0) {
      const newIndex = currentHistoryIndex - 1;
      const historyEntry = history[newIndex];
      form.reset(historyEntry.data);
      setCurrentHistoryIndex(newIndex);
    }
  }, [form, history, currentHistoryIndex]);

  const canUndo = currentHistoryIndex < history.length - 1;
  const canRedo = currentHistoryIndex > 0;

  // Cloud sync (mock implementation)
  const syncToCloud = async (data: any) => {
    // Implement actual cloud sync logic here
    // This could integrate with your backend API
    return new Promise(resolve => setTimeout(resolve, 1000));
  };

  // Form change detection
  useEffect(() => {
    const subscription = form.watch((data) => {
      const currentData = JSON.stringify(data);
      const lastData = JSON.stringify(lastSavedData.current);
      
      if (currentData !== lastData) {
        setHasUnsavedChanges(true);
        debouncedAutoSave();
      }
    });

    return () => subscription.unsubscribe();
  }, [form, debouncedAutoSave]);

  // Set up auto-save interval
  useEffect(() => {
    if (autoSaveInterval > 0) {
      autoSaveTimeout.current = setInterval(() => {
        if (hasUnsavedChanges) {
          performAutoSave();
        }
      }, autoSaveInterval);

      return () => {
        if (autoSaveTimeout.current) {
          clearInterval(autoSaveTimeout.current);
        }
      };
    }
  }, [autoSaveInterval, hasUnsavedChanges, performAutoSave]);

  // Load recovery data on mount
  useEffect(() => {
    loadRecoveryData();
  }, [loadRecoveryData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeout.current) {
        clearInterval(autoSaveTimeout.current);
      }
      debouncedAutoSave.cancel();
    };
  }, [debouncedAutoSave]);

  // Page visibility change handler for saving before leaving
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && hasUnsavedChanges) {
        performAutoSave();
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges, performAutoSave]);

  return {
    // State
    isAutoSaving,
    lastSaved,
    hasUnsavedChanges,
    history,
    recoveryData,
    
    // Actions
    saveManually,
    loadRecoveryData,
    applyRecoveryData,
    dismissRecoveryData,
    undo,
    redo,
    canUndo,
    canRedo,
    
    // Utilities
    clearStorage: () => clearStorage(),
    exportFormData: () => form.getValues(),
    importFormData: (data: TFieldValues) => form.reset(data),
  };
}

// Multi-step form state management
export function useMultiStepFormState<TFieldValues extends FieldValues = FieldValues>({
  form,
  totalSteps,
  config
}: {
  form: UseFormReturn<TFieldValues>;
  totalSteps: number;
  config: FormStateConfig;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [stepData, setStepData] = useState<Record<number, any>>({});

  const baseStateManagement = useFormStateManagement({ form, config });

  // Save current step data
  const saveStepData = useCallback((step: number, data: any) => {
    setStepData(prev => ({ ...prev, [step]: data }));
    baseStateManagement.saveManually(`Step ${step + 1} completed`);
  }, [baseStateManagement]);

  // Load step data
  const loadStepData = useCallback((step: number) => {
    return stepData[step] || {};
  }, [stepData]);

  // Navigate to step
  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < totalSteps) {
      // Save current step data before navigating
      const currentData = form.getValues();
      setStepData(prev => ({ ...prev, [currentStep]: currentData }));
      
      setCurrentStep(step);
      
      // Load data for the target step
      const targetStepData = stepData[step];
      if (targetStepData) {
        form.reset(targetStepData);
      }
    }
  }, [form, currentStep, stepData, totalSteps]);

  // Mark step as completed
  const markStepCompleted = useCallback((step: number) => {
    setCompletedSteps(prev => new Set([...prev, step]));
  }, []);

  // Navigate to next step
  const nextStep = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      markStepCompleted(currentStep);
      saveStepData(currentStep, form.getValues());
      goToStep(currentStep + 1);
    }
  }, [currentStep, totalSteps, form, markStepCompleted, saveStepData, goToStep]);

  // Navigate to previous step
  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      saveStepData(currentStep, form.getValues());
      goToStep(currentStep - 1);
    }
  }, [currentStep, form, saveStepData, goToStep]);

  // Check if step is completed
  const isStepCompleted = useCallback((step: number) => {
    return completedSteps.has(step);
  }, [completedSteps]);

  // Get form completion percentage
  const getCompletionPercentage = useCallback(() => {
    return Math.round((completedSteps.size / totalSteps) * 100);
  }, [completedSteps.size, totalSteps]);

  // Save all steps data
  const saveAllStepsData = useCallback(() => {
    const allData = {
      currentStep,
      stepData: { ...stepData, [currentStep]: form.getValues() },
      completedSteps: Array.from(completedSteps)
    };
    
    try {
      const storageKey = `${config.storageKey}_multistep`;
      localStorage.setItem(storageKey, JSON.stringify({
        ...allData,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }));
    } catch (error) {
      console.warn('Failed to save multi-step data:', error);
    }
  }, [currentStep, stepData, form, completedSteps, config.storageKey]);

  // Load all steps data
  const loadAllStepsData = useCallback(() => {
    try {
      const storageKey = `${config.storageKey}_multistep`;
      const stored = localStorage.getItem(storageKey);
      
      if (stored) {
        const data = JSON.parse(stored);
        setCurrentStep(data.currentStep || 0);
        setStepData(data.stepData || {});
        setCompletedSteps(new Set(data.completedSteps || []));
        
        // Load current step data into form
        const currentStepData = data.stepData?.[data.currentStep || 0];
        if (currentStepData) {
          form.reset(currentStepData);
        }
        
        return true;
      }
    } catch (error) {
      console.warn('Failed to load multi-step data:', error);
    }
    
    return false;
  }, [config.storageKey, form]);

  // Auto-save step data when it changes
  useEffect(() => {
    saveAllStepsData();
  }, [currentStep, stepData, completedSteps, saveAllStepsData]);

  // Load data on mount
  useEffect(() => {
    loadAllStepsData();
  }, [loadAllStepsData]);

  return {
    ...baseStateManagement,
    // Multi-step specific state
    currentStep,
    totalSteps,
    completedSteps,
    stepData,
    
    // Multi-step specific actions
    goToStep,
    nextStep,
    prevStep,
    markStepCompleted,
    isStepCompleted,
    saveStepData,
    loadStepData,
    getCompletionPercentage,
    
    // Data management
    saveAllStepsData,
    loadAllStepsData,
    
    // Computed properties
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === totalSteps - 1,
    canGoToNextStep: currentStep < totalSteps - 1,
    canGoToPrevStep: currentStep > 0,
  };
}
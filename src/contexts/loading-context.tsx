"use client";

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';

export interface LoadingState {
  isLoading: boolean;
  progress: number;
  stage: string;
  estimatedTime?: number;
  startTime?: number;
  error?: string;
  retryCount: number;
  type?: 'initial' | 'navigation' | 'data' | 'calculation' | 'form';
  details?: Record<string, any>;
}

export interface LoadingContextValue {
  // Global loading state
  globalLoading: LoadingState;
  // Component-specific loading states
  loadingStates: Record<string, LoadingState>;
  
  // Actions
  startLoading: (id: string, options?: Partial<LoadingState>) => void;
  updateProgress: (id: string, progress: number, stage?: string) => void;
  finishLoading: (id: string) => void;
  setError: (id: string, error: string) => void;
  retry: (id: string) => void;
  clearLoading: (id: string) => void;
  
  // Utilities
  isAnyLoading: () => boolean;
  getLoadingById: (id: string) => LoadingState | null;
  getEstimatedTimeRemaining: (id: string) => number | null;
}

type LoadingAction =
  | { type: 'START_LOADING'; payload: { id: string; options?: Partial<LoadingState> } }
  | { type: 'UPDATE_PROGRESS'; payload: { id: string; progress: number; stage?: string } }
  | { type: 'FINISH_LOADING'; payload: { id: string } }
  | { type: 'SET_ERROR'; payload: { id: string; error: string } }
  | { type: 'RETRY'; payload: { id: string } }
  | { type: 'CLEAR_LOADING'; payload: { id: string } }
  | { type: 'UPDATE_ESTIMATED_TIME'; payload: { id: string; estimatedTime: number } };

interface LoadingReducerState {
  loadingStates: Record<string, LoadingState>;
}

const defaultLoadingState: LoadingState = {
  isLoading: false,
  progress: 0,
  stage: 'idle',
  retryCount: 0,
  type: 'data',
};

const loadingReducer = (state: LoadingReducerState, action: LoadingAction): LoadingReducerState => {
  switch (action.type) {
    case 'START_LOADING': {
      const { id, options = {} } = action.payload;
      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          [id]: {
            ...defaultLoadingState,
            ...options,
            isLoading: true,
            progress: 0,
            stage: options.stage || 'starting',
            startTime: Date.now(),
          },
        },
      };
    }

    case 'UPDATE_PROGRESS': {
      const { id, progress, stage } = action.payload;
      const currentState = state.loadingStates[id];
      if (!currentState) return state;

      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          [id]: {
            ...currentState,
            progress: Math.min(100, Math.max(0, progress)),
            stage: stage || currentState.stage,
          },
        },
      };
    }

    case 'FINISH_LOADING': {
      const { id } = action.payload;
      const currentState = state.loadingStates[id];
      if (!currentState) return state;

      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          [id]: {
            ...currentState,
            isLoading: false,
            progress: 100,
            stage: 'completed',
            error: undefined,
          },
        },
      };
    }

    case 'SET_ERROR': {
      const { id, error } = action.payload;
      const currentState = state.loadingStates[id];
      if (!currentState) return state;

      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          [id]: {
            ...currentState,
            isLoading: false,
            error,
            stage: 'error',
          },
        },
      };
    }

    case 'RETRY': {
      const { id } = action.payload;
      const currentState = state.loadingStates[id];
      if (!currentState) return state;

      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          [id]: {
            ...currentState,
            isLoading: true,
            progress: 0,
            stage: 'retrying',
            error: undefined,
            retryCount: currentState.retryCount + 1,
            startTime: Date.now(),
          },
        },
      };
    }

    case 'CLEAR_LOADING': {
      const { id } = action.payload;
      const newState = { ...state.loadingStates };
      delete newState[id];
      return {
        ...state,
        loadingStates: newState,
      };
    }

    case 'UPDATE_ESTIMATED_TIME': {
      const { id, estimatedTime } = action.payload;
      const currentState = state.loadingStates[id];
      if (!currentState) return state;

      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          [id]: {
            ...currentState,
            estimatedTime,
          },
        },
      };
    }

    default:
      return state;
  }
};

const LoadingContext = createContext<LoadingContextValue | null>(null);

export interface LoadingProviderProps {
  children: React.ReactNode;
  globalLoadingId?: string;
}

export function LoadingProvider({ children, globalLoadingId = 'global' }: LoadingProviderProps) {
  const [state, dispatch] = useReducer(loadingReducer, { loadingStates: {} });

  const startLoading = useCallback((id: string, options?: Partial<LoadingState>) => {
    dispatch({ type: 'START_LOADING', payload: { id, options } });
  }, []);

  const updateProgress = useCallback((id: string, progress: number, stage?: string) => {
    dispatch({ type: 'UPDATE_PROGRESS', payload: { id, progress, stage } });
    
    // Update estimated time based on progress and elapsed time
    const loadingState = state.loadingStates[id];
    if (loadingState && loadingState.startTime && progress > 0 && progress < 100) {
      const elapsed = Date.now() - loadingState.startTime;
      const estimatedTotal = (elapsed / progress) * 100;
      const estimatedRemaining = estimatedTotal - elapsed;
      
      dispatch({
        type: 'UPDATE_ESTIMATED_TIME',
        payload: { id, estimatedTime: estimatedRemaining },
      });
    }
  }, [state.loadingStates]);

  const finishLoading = useCallback((id: string) => {
    dispatch({ type: 'FINISH_LOADING', payload: { id } });
  }, []);

  const setError = useCallback((id: string, error: string) => {
    dispatch({ type: 'SET_ERROR', payload: { id, error } });
  }, []);

  const retry = useCallback((id: string) => {
    dispatch({ type: 'RETRY', payload: { id } });
  }, []);

  const clearLoading = useCallback((id: string) => {
    dispatch({ type: 'CLEAR_LOADING', payload: { id } });
  }, []);

  const isAnyLoading = useCallback(() => {
    return Object.values(state.loadingStates).some(state => state.isLoading);
  }, [state.loadingStates]);

  const getLoadingById = useCallback((id: string) => {
    return state.loadingStates[id] || null;
  }, [state.loadingStates]);

  const getEstimatedTimeRemaining = useCallback((id: string) => {
    const loadingState = state.loadingStates[id];
    if (!loadingState || !loadingState.estimatedTime) return null;
    return loadingState.estimatedTime;
  }, [state.loadingStates]);

  const globalLoading = state.loadingStates[globalLoadingId] || defaultLoadingState;

  const value: LoadingContextValue = {
    globalLoading,
    loadingStates: state.loadingStates,
    startLoading,
    updateProgress,
    finishLoading,
    setError,
    retry,
    clearLoading,
    isAnyLoading,
    getLoadingById,
    getEstimatedTimeRemaining,
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}

// Specialized hooks for common loading patterns

export function useAsyncOperation() {
  const { startLoading, updateProgress, finishLoading, setError, getLoadingById } = useLoading();

  const execute = useCallback(async <T>(
    id: string,
    operation: (updateProgress: (progress: number, stage?: string) => void) => Promise<T>,
    options?: Partial<LoadingState>
  ): Promise<T> => {
    try {
      startLoading(id, options);
      
      const result = await operation((progress: number, stage?: string) => {
        updateProgress(id, progress, stage);
      });
      
      finishLoading(id);
      return result;
    } catch (error) {
      setError(id, error instanceof Error ? error.message : 'An error occurred');
      throw error;
    }
  }, [startLoading, updateProgress, finishLoading, setError]);

  return { execute, getLoadingById };
}

export function useProgressiveLoader(stages: string[], totalDuration: number = 2000) {
  const { updateProgress } = useLoading();
  const [currentStageIndex, setCurrentStageIndex] = React.useState(0);

  const nextStage = useCallback((id: string) => {
    if (currentStageIndex < stages.length - 1) {
      const nextIndex = currentStageIndex + 1;
      const progress = ((nextIndex + 1) / stages.length) * 100;
      
      setCurrentStageIndex(nextIndex);
      updateProgress(id, progress, stages[nextIndex]);
    }
  }, [currentStageIndex, stages, updateProgress]);

  const reset = useCallback(() => {
    setCurrentStageIndex(0);
  }, []);

  return {
    currentStage: stages[currentStageIndex],
    currentStageIndex,
    totalStages: stages.length,
    nextStage,
    reset,
  };
}

export function useSmartLoader(id: string, options?: {
  estimatedDuration?: number;
  stages?: string[];
  retryLimit?: number;
}) {
  const loading = useLoading();
  const [isActive, setIsActive] = React.useState(false);
  const estimatedDuration = options?.estimatedDuration || 2000;
  const stages = options?.stages || ['loading'];
  const retryLimit = options?.retryLimit || 3;

  const start = useCallback(async <T>(
    operation: () => Promise<T>
  ): Promise<T> => {
    setIsActive(true);
    
    try {
      return await loading.execute(id, async (updateProgress) => {
        // Simulate progressive loading with stages
        for (let i = 0; i < stages.length; i++) {
          const progress = (i / stages.length) * 90; // Leave 10% for completion
          updateProgress(progress, stages[i]);
          
          if (i < stages.length - 1) {
            await new Promise(resolve => setTimeout(resolve, estimatedDuration / stages.length));
          }
        }

        const result = await operation();
        updateProgress(100, 'completed');
        return result;
      }, {
        type: 'data',
        estimatedTime: estimatedDuration,
      });
    } finally {
      setIsActive(false);
    }
  }, [id, loading, estimatedDuration, stages]);

  const loadingState = loading.getLoadingById(id);
  const canRetry = loadingState?.retryCount < retryLimit;

  return {
    start,
    isActive,
    loadingState,
    canRetry,
    retry: () => loading.retry(id),
    clear: () => loading.clearLoading(id),
  };
}
"use client";

import React from 'react';
import { useQuery, useMutation, type UseQueryOptions, type UseMutationOptions } from '@tanstack/react-query';
import { useLoading } from '@/contexts/loading-context';
import { useComponentPerformance } from './use-performance-monitoring';

// Integration with React Query for automatic loading states
export function useQueryWithLoading<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends readonly unknown[] = readonly unknown[]
>(
  queryKey: TQueryKey,
  queryFn: () => Promise<TQueryFnData>,
  options?: Omit<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, 'queryKey' | 'queryFn'> & {
    loadingId?: string;
    loadingStages?: string[];
    showSkeleton?: boolean;
  }
) {
  const { loadingId = queryKey.join('-'), loadingStages, showSkeleton, ...queryOptions } = options || {};
  const { startLoading, updateProgress, finishLoading, setError } = useLoading();
  const { recordLoadingStart, recordLoadingEnd, recordError, recordSuccess } = 
    useComponentPerformance(loadingId);

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      recordLoadingStart();
      startLoading(loadingId, {
        type: 'data',
        stage: loadingStages?.[0] || 'fetching',
      });

      try {
        // Simulate progressive loading if stages are provided
        if (loadingStages && loadingStages.length > 1) {
          for (let i = 0; i < loadingStages.length - 1; i++) {
            const progress = ((i + 1) / loadingStages.length) * 90; // Leave 10% for completion
            updateProgress(loadingId, progress, loadingStages[i + 1]);
            await new Promise(resolve => setTimeout(resolve, 100)); // Brief delay for UX
          }
        }

        const result = await queryFn();
        
        finishLoading(loadingId);
        recordLoadingEnd();
        recordSuccess();
        
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Query failed';
        setError(loadingId, errorMessage);
        recordError();
        throw error;
      }
    },
    ...queryOptions,
  });

  return {
    ...query,
    loadingId,
    showSkeleton: showSkeleton && query.isLoading,
  };
}

// Integration with React Query mutations
export function useMutationWithLoading<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown
>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: UseMutationOptions<TData, TError, TVariables, TContext> & {
    loadingId?: string;
    loadingStages?: string[];
    estimatedDuration?: number;
  }
) {
  const { loadingId = 'mutation', loadingStages, estimatedDuration, ...mutationOptions } = options || {};
  const { startLoading, updateProgress, finishLoading, setError } = useLoading();
  const { recordLoadingStart, recordLoadingEnd, recordError, recordSuccess } = 
    useComponentPerformance(loadingId);

  const mutation = useMutation({
    mutationFn: async (variables: TVariables) => {
      recordLoadingStart();
      startLoading(loadingId, {
        type: 'form',
        stage: loadingStages?.[0] || 'processing',
        estimatedTime: estimatedDuration,
      });

      try {
        // Progressive loading simulation
        if (loadingStages && loadingStages.length > 1) {
          const stageInterval = estimatedDuration ? estimatedDuration / loadingStages.length : 500;
          
          for (let i = 0; i < loadingStages.length; i++) {
            const progress = ((i + 1) / loadingStages.length) * 95; // Leave 5% for completion
            updateProgress(loadingId, progress, loadingStages[i]);
            
            if (i < loadingStages.length - 1) {
              await new Promise(resolve => setTimeout(resolve, stageInterval));
            }
          }
        }

        const result = await mutationFn(variables);
        
        finishLoading(loadingId);
        recordLoadingEnd();
        recordSuccess();
        
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Mutation failed';
        setError(loadingId, errorMessage);
        recordError();
        throw error;
      }
    },
    ...mutationOptions,
  });

  return {
    ...mutation,
    loadingId,
  };
}

// Hook for form integration
export function useFormWithLoading(formId: string) {
  const { startLoading, updateProgress, finishLoading, setError, getLoadingById } = useLoading();
  const { recordLoadingStart, recordLoadingEnd, recordError, recordSuccess } = 
    useComponentPerformance(formId);
  
  const [validationProgress, setValidationProgress] = React.useState(0);
  const [submissionProgress, setSubmissionProgress] = React.useState(0);

  const startValidation = React.useCallback((fieldCount: number) => {
    recordLoadingStart();
    startLoading(formId, {
      type: 'form',
      stage: 'validating',
    });
    setValidationProgress(0);
  }, [formId, startLoading, recordLoadingStart]);

  const updateValidationProgress = React.useCallback((validatedFields: number, totalFields: number) => {
    const progress = (validatedFields / totalFields) * 40; // Validation is 40% of total
    setValidationProgress(progress);
    updateProgress(formId, progress, `Validating field ${validatedFields}/${totalFields}`);
  }, [formId, updateProgress]);

  const startSubmission = React.useCallback(() => {
    updateProgress(formId, 50, 'Submitting form');
    setSubmissionProgress(50);
  }, [formId, updateProgress]);

  const updateSubmissionProgress = React.useCallback((stage: string, progress: number) => {
    const totalProgress = 50 + (progress * 0.5); // Submission is remaining 50%
    setSubmissionProgress(totalProgress);
    updateProgress(formId, totalProgress, stage);
  }, [formId, updateProgress]);

  const completeSubmission = React.useCallback(() => {
    finishLoading(formId);
    recordLoadingEnd();
    recordSuccess();
    setValidationProgress(0);
    setSubmissionProgress(0);
  }, [formId, finishLoading, recordLoadingEnd, recordSuccess]);

  const handleFormError = React.useCallback((error: string) => {
    setError(formId, error);
    recordError();
    setValidationProgress(0);
    setSubmissionProgress(0);
  }, [formId, setError, recordError]);

  return {
    loadingState: getLoadingById(formId),
    validationProgress,
    submissionProgress,
    startValidation,
    updateValidationProgress,
    startSubmission,
    updateSubmissionProgress,
    completeSubmission,
    handleFormError,
  };
}

// Hook for solar calculation integration
export function useSolarCalculationLoading(calculationId: string) {
  const { startLoading, updateProgress, finishLoading, setError, getLoadingById } = useLoading();
  const { recordLoadingStart, recordLoadingEnd, recordError, recordSuccess } = 
    useComponentPerformance(calculationId);

  const calculateSolarSystem = React.useCallback(async (
    calculationFn: (updateProgress: (progress: number, stage: string) => void) => Promise<any>
  ) => {
    recordLoadingStart();
    startLoading(calculationId, {
      type: 'calculation',
      stage: 'initializing',
      estimatedTime: 5000, // 5 seconds estimated
    });

    const stages = [
      'Analyzing location data',
      'Calculating solar irradiance',
      'Processing energy requirements',
      'Evaluating equipment options',
      'Optimizing system design',
      'Calculating financial metrics',
      'Generating recommendations',
      'Finalizing results'
    ];

    try {
      let currentStageIndex = 0;
      
      const progressCallback = (progress: number, customStage?: string) => {
        const stage = customStage || stages[Math.floor((progress / 100) * stages.length)] || stages[0];
        updateProgress(calculationId, progress, stage);
        
        // Auto-advance stages based on progress
        const expectedStageIndex = Math.floor((progress / 100) * stages.length);
        if (expectedStageIndex > currentStageIndex && expectedStageIndex < stages.length) {
          currentStageIndex = expectedStageIndex;
        }
      };

      const result = await calculationFn(progressCallback);
      
      finishLoading(calculationId);
      recordLoadingEnd();
      recordSuccess();
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Solar calculation failed';
      setError(calculationId, errorMessage);
      recordError();
      throw error;
    }
  }, [calculationId, startLoading, updateProgress, finishLoading, setError, recordLoadingStart, recordLoadingEnd, recordError, recordSuccess]);

  return {
    loadingState: getLoadingById(calculationId),
    calculateSolarSystem,
  };
}

// Hook for equipment search integration
export function useEquipmentSearchLoading(searchId: string = 'equipment-search') {
  const { startLoading, updateProgress, finishLoading, setError, getLoadingById } = useLoading();
  const { recordLoadingStart, recordLoadingEnd, recordError, recordSuccess } = 
    useComponentPerformance(searchId);

  const searchEquipment = React.useCallback(async (
    searchFn: () => Promise<any>,
    filters: Record<string, any> = {}
  ) => {
    recordLoadingStart();
    
    const filterCount = Object.keys(filters).length;
    const hasComplexFilters = filterCount > 3;
    const estimatedTime = hasComplexFilters ? 3000 : 1500;
    
    startLoading(searchId, {
      type: 'data',
      stage: 'searching',
      estimatedTime,
      details: { filterCount, filters },
    });

    const stages = [
      'Initializing search',
      'Applying filters',
      'Querying equipment database',
      'Processing compatibility',
      'Calculating pricing',
      'Sorting results',
      'Finalizing search'
    ];

    try {
      for (let i = 0; i < stages.length; i++) {
        const progress = ((i + 1) / stages.length) * 90; // Leave 10% for final processing
        updateProgress(searchId, progress, stages[i]);
        
        // Longer delay for complex searches
        const delay = hasComplexFilters ? 200 : 100;
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      const result = await searchFn();
      
      updateProgress(searchId, 100, 'Search complete');
      finishLoading(searchId);
      recordLoadingEnd();
      recordSuccess();
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Equipment search failed';
      setError(searchId, errorMessage);
      recordError();
      throw error;
    }
  }, [searchId, startLoading, updateProgress, finishLoading, setError, recordLoadingStart, recordLoadingEnd, recordError, recordSuccess]);

  return {
    loadingState: getLoadingById(searchId),
    searchEquipment,
  };
}

// Hook for dashboard data loading
export function useDashboardDataLoading(dashboardId: string) {
  const { startLoading, updateProgress, finishLoading, setError, getLoadingById } = useLoading();
  const { recordLoadingStart, recordLoadingEnd, recordError, recordSuccess } = 
    useComponentPerformance(dashboardId);

  const loadDashboardData = React.useCallback(async (
    dataSources: Array<{
      name: string;
      loader: () => Promise<any>;
      weight: number; // Relative weight for progress calculation
    }>
  ) => {
    recordLoadingStart();
    startLoading(dashboardId, {
      type: 'data',
      stage: 'loading dashboard',
      estimatedTime: 2000,
    });

    const totalWeight = dataSources.reduce((sum, source) => sum + source.weight, 0);
    let completedWeight = 0;
    const results: Record<string, any> = {};

    try {
      for (const source of dataSources) {
        updateProgress(
          dashboardId, 
          (completedWeight / totalWeight) * 90,
          `Loading ${source.name}`
        );

        try {
          results[source.name] = await source.loader();
          recordSuccess();
        } catch (sourceError) {
          // Log individual source errors but continue with others
          console.warn(`Failed to load ${source.name}:`, sourceError);
          recordError();
          results[source.name] = null;
        }

        completedWeight += source.weight;
      }

      updateProgress(dashboardId, 100, 'Dashboard loaded');
      finishLoading(dashboardId);
      recordLoadingEnd();
      
      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Dashboard loading failed';
      setError(dashboardId, errorMessage);
      recordError();
      throw error;
    }
  }, [dashboardId, startLoading, updateProgress, finishLoading, setError, recordLoadingStart, recordLoadingEnd, recordError, recordSuccess]);

  return {
    loadingState: getLoadingById(dashboardId),
    loadDashboardData,
  };
}

// Hook for image loading with progressive enhancement
export function useImageLoading() {
  const [loadedImages, setLoadedImages] = React.useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = React.useState<Set<string>>(new Set());
  const [loadingImages, setLoadingImages] = React.useState<Set<string>>(new Set());

  const loadImage = React.useCallback((src: string): Promise<void> => {
    if (loadedImages.has(src)) {
      return Promise.resolve();
    }

    if (failedImages.has(src)) {
      return Promise.reject(new Error('Image previously failed to load'));
    }

    if (loadingImages.has(src)) {
      // Return existing promise for this image
      return new Promise((resolve, reject) => {
        const checkLoaded = () => {
          if (loadedImages.has(src)) {
            resolve();
          } else if (failedImages.has(src)) {
            reject(new Error('Image failed to load'));
          } else {
            setTimeout(checkLoaded, 100);
          }
        };
        checkLoaded();
      });
    }

    setLoadingImages(prev => new Set([...prev, src]));

    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        setLoadedImages(prev => new Set([...prev, src]));
        setLoadingImages(prev => {
          const newSet = new Set(prev);
          newSet.delete(src);
          return newSet;
        });
        resolve();
      };
      
      img.onerror = () => {
        setFailedImages(prev => new Set([...prev, src]));
        setLoadingImages(prev => {
          const newSet = new Set(prev);
          newSet.delete(src);
          return newSet;
        });
        reject(new Error('Image failed to load'));
      };
      
      img.src = src;
    });
  }, [loadedImages, failedImages, loadingImages]);

  const preloadImages = React.useCallback((sources: string[]) => {
    return Promise.allSettled(sources.map(loadImage));
  }, [loadImage]);

  const getImageStatus = React.useCallback((src: string) => {
    if (loadedImages.has(src)) return 'loaded';
    if (failedImages.has(src)) return 'failed';
    if (loadingImages.has(src)) return 'loading';
    return 'pending';
  }, [loadedImages, failedImages, loadingImages]);

  return {
    loadImage,
    preloadImages,
    getImageStatus,
    isLoaded: (src: string) => loadedImages.has(src),
    isFailed: (src: string) => failedImages.has(src),
    isLoading: (src: string) => loadingImages.has(src),
  };
}

// Hook for route transition loading
export function useRouteTransitionLoading() {
  const { startLoading, finishLoading, updateProgress } = useLoading();
  const [isTransitioning, setIsTransitioning] = React.useState(false);

  const startTransition = React.useCallback((routeName: string) => {
    setIsTransitioning(true);
    startLoading(`route-${routeName}`, {
      type: 'navigation',
      stage: 'navigating',
      estimatedTime: 1000,
    });

    // Simulate route loading progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      updateProgress(`route-${routeName}`, progress, 'Loading page');
      
      if (progress >= 80) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [startLoading, updateProgress]);

  const finishTransition = React.useCallback((routeName: string) => {
    finishLoading(`route-${routeName}`);
    setIsTransitioning(false);
  }, [finishLoading]);

  return {
    isTransitioning,
    startTransition,
    finishTransition,
  };
}
"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { 
  UseFormReturn, 
  FieldPath, 
  FieldValues, 
  UseFormWatch,
  UseFormSetError,
  UseFormClearErrors,
  FieldError
} from 'react-hook-form';
import { z } from 'zod';
import { debounce } from 'lodash';

// Validation state types
export type ValidationState = 'idle' | 'validating' | 'valid' | 'invalid';

export type FieldValidationState = {
  state: ValidationState;
  error?: string;
  lastValidatedValue?: any;
  isAsyncValidating?: boolean;
};

export type FormValidationState = {
  [key: string]: FieldValidationState;
};

// Validation rule types
export type ValidationRule<T = any> = {
  name: string;
  validator: (value: T, formData?: any) => boolean | string | Promise<boolean | string>;
  message?: string;
  debounceMs?: number;
  runOnChange?: boolean;
  runOnBlur?: boolean;
  dependsOn?: string[];
};

export type AsyncValidationRule<T = any> = {
  name: string;
  validator: (value: T, formData?: any) => Promise<boolean | string>;
  message?: string;
  debounceMs?: number;
  dependsOn?: string[];
};

// Enhanced form validation hook configuration
export type UseEnhancedFormValidationConfig<TFieldValues extends FieldValues> = {
  form: UseFormReturn<TFieldValues>;
  validationRules?: Record<FieldPath<TFieldValues>, ValidationRule[]>;
  asyncValidationRules?: Record<FieldPath<TFieldValues>, AsyncValidationRule[]>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceMs?: number;
  progressiveValidation?: boolean;
  crossFieldValidation?: {
    [key: string]: {
      fields: FieldPath<TFieldValues>[];
      validator: (values: Partial<TFieldValues>) => boolean | string | Promise<boolean | string>;
      message?: string;
    };
  };
};

// Custom hook for enhanced form validation
export function useEnhancedFormValidation<TFieldValues extends FieldValues = FieldValues>({
  form,
  validationRules = {},
  asyncValidationRules = {},
  validateOnChange = true,
  validateOnBlur = true,
  debounceMs = 300,
  progressiveValidation = false,
  crossFieldValidation = {}
}: UseEnhancedFormValidationConfig<TFieldValues>) {
  const [validationState, setValidationState] = useState<FormValidationState>({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const validationTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const lastValidatedValues = useRef<Partial<TFieldValues>>({});
  
  const { watch, setError, clearErrors, formState } = form;
  const watchedValues = watch();

  // Debounced validation function
  const debouncedValidate = useCallback(
    debounce(async (fieldName: string, value: any, allValues: TFieldValues) => {
      await validateField(fieldName, value, allValues);
    }, debounceMs),
    [debounceMs]
  );

  // Clear validation timeout for a field
  const clearValidationTimeout = useCallback((fieldName: string) => {
    const timeout = validationTimeouts.current.get(fieldName);
    if (timeout) {
      clearTimeout(timeout);
      validationTimeouts.current.delete(fieldName);
    }
  }, []);

  // Set validation state for a field
  const setFieldValidationState = useCallback((
    fieldName: string, 
    state: FieldValidationState
  ) => {
    setValidationState(prev => ({
      ...prev,
      [fieldName]: state
    }));
  }, []);

  // Validate individual field
  const validateField = useCallback(async (
    fieldName: string, 
    value: any, 
    allValues: TFieldValues
  ) => {
    const rules = validationRules[fieldName as FieldPath<TFieldValues>] || [];
    const asyncRules = asyncValidationRules[fieldName as FieldPath<TFieldValues>] || [];

    // Set validating state
    setFieldValidationState(fieldName, {
      state: 'validating',
      lastValidatedValue: value,
      isAsyncValidating: asyncRules.length > 0
    });

    try {
      // Run synchronous validations first
      for (const rule of rules) {
        const result = rule.validator(value, allValues);
        
        if (typeof result === 'string') {
          // Validation failed with custom message
          setError(fieldName as FieldPath<TFieldValues>, {
            type: rule.name,
            message: result
          });
          setFieldValidationState(fieldName, {
            state: 'invalid',
            error: result,
            lastValidatedValue: value
          });
          return false;
        } else if (result === false) {
          // Validation failed with default message
          const message = rule.message || `${fieldName} is invalid`;
          setError(fieldName as FieldPath<TFieldValues>, {
            type: rule.name,
            message
          });
          setFieldValidationState(fieldName, {
            state: 'invalid',
            error: message,
            lastValidatedValue: value
          });
          return false;
        }
      }

      // Run asynchronous validations
      for (const rule of asyncRules) {
        try {
          const result = await rule.validator(value, allValues);
          
          if (typeof result === 'string') {
            setError(fieldName as FieldPath<TFieldValues>, {
              type: rule.name,
              message: result
            });
            setFieldValidationState(fieldName, {
              state: 'invalid',
              error: result,
              lastValidatedValue: value
            });
            return false;
          } else if (result === false) {
            const message = rule.message || `${fieldName} is invalid`;
            setError(fieldName as FieldPath<TFieldValues>, {
              type: rule.name,
              message
            });
            setFieldValidationState(fieldName, {
              state: 'invalid',
              error: message,
              lastValidatedValue: value
            });
            return false;
          }
        } catch (error) {
          console.warn(`Async validation failed for ${fieldName}:`, error);
          const message = `Validation error for ${fieldName}`;
          setError(fieldName as FieldPath<TFieldValues>, {
            type: 'async-error',
            message
          });
          setFieldValidationState(fieldName, {
            state: 'invalid',
            error: message,
            lastValidatedValue: value
          });
          return false;
        }
      }

      // All validations passed
      clearErrors(fieldName as FieldPath<TFieldValues>);
      setFieldValidationState(fieldName, {
        state: 'valid',
        lastValidatedValue: value
      });
      return true;

    } catch (error) {
      console.error(`Validation error for ${fieldName}:`, error);
      const message = `Validation error for ${fieldName}`;
      setError(fieldName as FieldPath<TFieldValues>, {
        type: 'validation-error',
        message
      });
      setFieldValidationState(fieldName, {
        state: 'invalid',
        error: message,
        lastValidatedValue: value
      });
      return false;
    }
  }, [validationRules, asyncValidationRules, setError, clearErrors, setFieldValidationState]);

  // Validate cross-field dependencies
  const validateCrossFields = useCallback(async (values: TFieldValues) => {
    for (const [ruleName, rule] of Object.entries(crossFieldValidation)) {
      try {
        const result = await rule.validator(values);
        
        if (typeof result === 'string' || result === false) {
          const message = typeof result === 'string' ? result : (rule.message || 'Cross-field validation failed');
          
          // Set error on all dependent fields
          rule.fields.forEach(fieldName => {
            setError(fieldName, {
              type: 'cross-field',
              message
            });
          });
          return false;
        }
      } catch (error) {
        console.error(`Cross-field validation error for ${ruleName}:`, error);
        rule.fields.forEach(fieldName => {
          setError(fieldName, {
            type: 'cross-field-error',
            message: 'Cross-field validation error'
          });
        });
        return false;
      }
    }
    return true;
  }, [crossFieldValidation, setError]);

  // Watch for form changes and trigger validation
  useEffect(() => {
    if (!validateOnChange) return;

    const subscription = watch((values, { name, type }) => {
      if (!name) return;

      const fieldName = name as string;
      const value = values[fieldName];

      // Skip if value hasn't changed
      if (lastValidatedValues.current[fieldName] === value) return;
      lastValidatedValues.current[fieldName] = value;

      // Clear any existing timeout for this field
      clearValidationTimeout(fieldName);

      // Progressive validation - only validate current and previous fields
      if (progressiveValidation) {
        const fieldNames = Object.keys(validationRules);
        const currentFieldIndex = fieldNames.indexOf(fieldName);
        if (currentFieldIndex > progressStep) {
          return; // Don't validate future fields
        }
      }

      // Set up debounced validation
      const timeout = setTimeout(() => {
        debouncedValidate(fieldName, value, values as TFieldValues);
      }, debounceMs);

      validationTimeouts.current.set(fieldName, timeout);
    });

    return () => subscription.unsubscribe();
  }, [watch, validateOnChange, debouncedValidate, debounceMs, progressiveValidation, progressStep, clearValidationTimeout, validationRules]);

  // Update form validity state
  useEffect(() => {
    const hasErrors = Object.keys(formState.errors).length > 0;
    const hasInvalidFields = Object.values(validationState).some(
      field => field.state === 'invalid'
    );
    const isValidating = Object.values(validationState).some(
      field => field.state === 'validating' || field.isAsyncValidating
    );

    setIsFormValid(!hasErrors && !hasInvalidFields && !isValidating);
  }, [formState.errors, validationState]);

  // Update progress step for progressive validation
  useEffect(() => {
    if (!progressiveValidation) return;

    const fieldNames = Object.keys(validationRules);
    let maxValidStep = 0;

    for (let i = 0; i < fieldNames.length; i++) {
      const fieldName = fieldNames[i];
      const fieldState = validationState[fieldName];
      
      if (fieldState?.state === 'valid') {
        maxValidStep = i + 1;
      } else {
        break;
      }
    }

    setProgressStep(maxValidStep);
  }, [validationState, validationRules, progressiveValidation]);

  // Manual validation trigger
  const triggerValidation = useCallback(async (fieldName?: string) => {
    const values = form.getValues();

    if (fieldName) {
      return await validateField(fieldName, values[fieldName as keyof TFieldValues], values);
    }

    // Validate all fields
    const results = await Promise.all(
      Object.keys(validationRules).map(async (field) => {
        return await validateField(field, values[field as keyof TFieldValues], values);
      })
    );

    // Validate cross-field rules
    const crossFieldResult = await validateCrossFields(values);

    return results.every(result => result) && crossFieldResult;
  }, [form, validateField, validateCrossFields, validationRules]);

  // Get validation state for a specific field
  const getFieldValidationState = useCallback((fieldName: string): FieldValidationState => {
    return validationState[fieldName] || { state: 'idle' };
  }, [validationState]);

  // Check if a field is valid
  const isFieldValid = useCallback((fieldName: string): boolean => {
    const state = getFieldValidationState(fieldName);
    return state.state === 'valid';
  }, [getFieldValidationState]);

  // Check if a field is validating
  const isFieldValidating = useCallback((fieldName: string): boolean => {
    const state = getFieldValidationState(fieldName);
    return state.state === 'validating' || state.isAsyncValidating === true;
  }, [getFieldValidationState]);

  // Get field error message
  const getFieldError = useCallback((fieldName: string): string | undefined => {
    const state = getFieldValidationState(fieldName);
    return state.error;
  }, [getFieldValidationState]);

  // Clear validation state
  const clearValidationState = useCallback(() => {
    setValidationState({});
    validationTimeouts.current.forEach(timeout => clearTimeout(timeout));
    validationTimeouts.current.clear();
    lastValidatedValues.current = {};
  }, []);

  return {
    validationState,
    isFormValid,
    progressStep,
    triggerValidation,
    getFieldValidationState,
    isFieldValid,
    isFieldValidating,
    getFieldError,
    clearValidationState,
    validateField,
    validateCrossFields
  };
}

// Predefined validation rules for common use cases
export const commonValidationRules = {
  required: (message = 'This field is required'): ValidationRule => ({
    name: 'required',
    validator: (value) => {
      if (value === null || value === undefined || value === '') {
        return message;
      }
      if (Array.isArray(value) && value.length === 0) {
        return message;
      }
      return true;
    },
    runOnChange: true,
    runOnBlur: true
  }),

  email: (message = 'Please enter a valid email address'): ValidationRule => ({
    name: 'email',
    validator: (value) => {
      if (!value) return true; // Let required rule handle empty values
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value) || message;
    },
    debounceMs: 500,
    runOnChange: true
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    name: 'minLength',
    validator: (value) => {
      if (!value) return true;
      return value.length >= min || message || `Must be at least ${min} characters`;
    },
    runOnChange: true
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    name: 'maxLength',
    validator: (value) => {
      if (!value) return true;
      return value.length <= max || message || `Must be no more than ${max} characters`;
    },
    runOnChange: true
  }),

  pattern: (regex: RegExp, message = 'Invalid format'): ValidationRule => ({
    name: 'pattern',
    validator: (value) => {
      if (!value) return true;
      return regex.test(value) || message;
    },
    debounceMs: 300,
    runOnChange: true
  }),

  numeric: (message = 'Please enter a valid number'): ValidationRule => ({
    name: 'numeric',
    validator: (value) => {
      if (!value) return true;
      return !isNaN(Number(value)) || message;
    },
    runOnChange: true
  }),

  min: (min: number, message?: string): ValidationRule => ({
    name: 'min',
    validator: (value) => {
      if (!value) return true;
      const num = Number(value);
      return num >= min || message || `Must be at least ${min}`;
    },
    runOnChange: true
  }),

  max: (max: number, message?: string): ValidationRule => ({
    name: 'max',
    validator: (value) => {
      if (!value) return true;
      const num = Number(value);
      return num <= max || message || `Must be no more than ${max}`;
    },
    runOnChange: true
  }),

  phone: (message = 'Please enter a valid phone number'): ValidationRule => ({
    name: 'phone',
    validator: (value) => {
      if (!value) return true;
      // US phone number regex
      const phoneRegex = /^[\+]?[1]?[\s\-\.]?[\(]?[0-9]{3}[\)]?[\s\-\.]?[0-9]{3}[\s\-\.]?[0-9]{4}$/;
      return phoneRegex.test(value.replace(/\D/g, '')) || message;
    },
    debounceMs: 500,
    runOnChange: true
  }),

  zipCode: (message = 'Please enter a valid ZIP code'): ValidationRule => ({
    name: 'zipCode',
    validator: (value) => {
      if (!value) return true;
      const zipRegex = /^\d{5}(-\d{4})?$/;
      return zipRegex.test(value) || message;
    },
    runOnChange: true
  }),
};

// Predefined async validation rules
export const commonAsyncValidationRules = {
  uniqueEmail: (checkUnique: (email: string) => Promise<boolean>, message = 'This email is already in use'): AsyncValidationRule => ({
    name: 'uniqueEmail',
    validator: async (value) => {
      if (!value) return true;
      const isUnique = await checkUnique(value);
      return isUnique || message;
    },
    debounceMs: 1000
  }),

  addressValidation: (validateAddress: (address: string) => Promise<boolean>, message = 'Please enter a valid address'): AsyncValidationRule => ({
    name: 'addressValidation',
    validator: async (value) => {
      if (!value) return true;
      const isValid = await validateAddress(value);
      return isValid || message;
    },
    debounceMs: 1000
  }),
};
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "./input";
import { Button } from "./button";
import { Badge } from "./badge";
import { Card, CardContent } from "./card";
import { 
  Search, 
  X, 
  Upload, 
  File, 
  Image, 
  Check,
  ChevronDown,
  Calendar,
  Clock,
  MapPin,
  Phone,
  CreditCard,
  DollarSign,
  Percent,
  Calculator
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  FieldFeedback, 
  ValidationIndicator, 
  CharacterCounter,
  ContextualHelp,
  PasswordToggle
} from "./enhanced-form-feedback";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";

// Smart auto-complete component
export interface SmartAutoCompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (item: any) => void;
  placeholder?: string;
  suggestions: any[];
  suggestionKeyField?: string;
  suggestionDisplayField?: string;
  isLoading?: boolean;
  error?: string;
  debounceMs?: number;
  maxSuggestions?: number;
  showIcon?: boolean;
  className?: string;
}

export function SmartAutoComplete({
  value,
  onChange,
  onSelect,
  placeholder = "Type to search...",
  suggestions = [],
  suggestionKeyField = 'id',
  suggestionDisplayField = 'label',
  isLoading = false,
  error,
  debounceMs = 300,
  maxSuggestions = 10,
  showIcon = true,
  className
}: SmartAutoCompleteProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = React.useState(suggestions);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Debounced filtering
  const debouncedFilter = React.useMemo(
    () => {
      let timeout: NodeJS.Timeout;
      return (searchValue: string) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          if (!searchValue.trim()) {
            setFilteredSuggestions(suggestions.slice(0, maxSuggestions));
            return;
          }

          const filtered = suggestions
            .filter(item => {
              const displayValue = item[suggestionDisplayField]?.toLowerCase() || '';
              return displayValue.includes(searchValue.toLowerCase());
            })
            .slice(0, maxSuggestions);
          
          setFilteredSuggestions(filtered);
        }, debounceMs);
      };
    },
    [suggestions, suggestionDisplayField, maxSuggestions, debounceMs]
  );

  React.useEffect(() => {
    debouncedFilter(value);
  }, [value, debouncedFilter]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsOpen(true);
  };

  const handleSelect = (item: any) => {
    const displayValue = item[suggestionDisplayField];
    onChange(displayValue);
    onSelect?.(item);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        {showIcon && (
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        )}
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={cn(
            showIcon && "pl-10",
            error && "border-red-500"
          )}
        />
        <ValidationIndicator
          isValidating={isLoading}
          hasError={!!error}
          className="absolute right-3 top-1/2 transform -translate-y-1/2"
        />
      </div>

      {isOpen && (filteredSuggestions.length > 0 || isLoading) && (
        <Card className="absolute z-50 w-full mt-1 shadow-lg border">
          <CardContent className="p-2 max-h-60 overflow-y-auto">
            {isLoading ? (
              <div className="p-3 text-center text-sm text-muted-foreground">
                Searching...
              </div>
            ) : filteredSuggestions.length > 0 ? (
              <div className="space-y-1">
                {filteredSuggestions.map((item, index) => (
                  <button
                    key={item[suggestionKeyField] || index}
                    onClick={() => handleSelect(item)}
                    className="w-full text-left p-2 rounded hover:bg-accent transition-colors text-sm"
                  >
                    {item[suggestionDisplayField]}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-3 text-center text-sm text-muted-foreground">
                No suggestions found
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {error && (
        <FieldFeedback state="error" message={error} className="mt-1" />
      )}
    </div>
  );
}

// Multi-select with search component
export interface MultiSelectWithSearchProps {
  value: string[];
  onChange: (value: string[]) => void;
  options: { value: string; label: string; disabled?: boolean }[];
  placeholder?: string;
  searchPlaceholder?: string;
  maxSelections?: number;
  showSearch?: boolean;
  showSelectAll?: boolean;
  error?: string;
  className?: string;
}

export function MultiSelectWithSearch({
  value = [],
  onChange,
  options = [],
  placeholder = "Select items...",
  searchPlaceholder = "Search options...",
  maxSelections,
  showSearch = true,
  showSelectAll = false,
  error,
  className
}: MultiSelectWithSearchProps) {
  const [searchValue, setSearchValue] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  
  const filteredOptions = React.useMemo(() => {
    if (!searchValue) return options;
    return options.filter(option =>
      option.label.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [options, searchValue]);

  const handleToggleOption = (optionValue: string) => {
    const isSelected = value.includes(optionValue);
    
    if (isSelected) {
      onChange(value.filter(v => v !== optionValue));
    } else {
      if (maxSelections && value.length >= maxSelections) {
        return; // Don't add if max reached
      }
      onChange([...value, optionValue]);
    }
  };

  const handleSelectAll = () => {
    const availableOptions = filteredOptions.filter(opt => !opt.disabled);
    if (value.length === availableOptions.length) {
      onChange([]); // Deselect all
    } else {
      const newValues = availableOptions.map(opt => opt.value);
      onChange(maxSelections ? newValues.slice(0, maxSelections) : newValues);
    }
  };

  const removeSelection = (optionValue: string) => {
    onChange(value.filter(v => v !== optionValue));
  };

  const selectedLabels = React.useMemo(() => {
    return value.map(v => options.find(opt => opt.value === v)?.label).filter(Boolean);
  }, [value, options]);

  return (
    <div className={cn("relative", className)}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-between text-left font-normal h-auto min-h-10 p-3",
              error && "border-red-500"
            )}
          >
            <div className="flex flex-wrap gap-1">
              {value.length === 0 ? (
                <span className="text-muted-foreground">{placeholder}</span>
              ) : (
                selectedLabels.map((label, index) => (
                  <Badge
                    key={`${label}-${index}`}
                    variant="secondary"
                    className="gap-1"
                  >
                    {label}
                    <X
                      className="h-3 w-3 hover:bg-muted-foreground/20 rounded-sm cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        const optionValue = value[index];
                        removeSelection(optionValue);
                      }}
                    />
                  </Badge>
                ))
              )}
            </div>
            <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent className="w-full min-w-[300px] p-2" align="start">
          {showSearch && (
            <div className="relative mb-2">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="pl-8 h-8"
              />
            </div>
          )}
          
          <div className="max-h-60 overflow-y-auto">
            {showSelectAll && filteredOptions.length > 0 && (
              <DropdownMenuItem
                onClick={handleSelectAll}
                className="justify-between"
              >
                <span>Select All</span>
                <span className="text-xs text-muted-foreground">
                  ({value.length}/{filteredOptions.filter(opt => !opt.disabled).length})
                </span>
              </DropdownMenuItem>
            )}
            
            {filteredOptions.map((option) => {
              const isSelected = value.includes(option.value);
              const isDisabled = option.disabled || 
                (maxSelections && !isSelected && value.length >= maxSelections);
              
              return (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => !isDisabled && handleToggleOption(option.value)}
                  className={cn(
                    "justify-between",
                    isDisabled && "opacity-50 cursor-not-allowed"
                  )}
                  disabled={isDisabled}
                >
                  <span>{option.label}</span>
                  {isSelected && <Check className="h-4 w-4" />}
                </DropdownMenuItem>
              );
            })}
            
            {filteredOptions.length === 0 && (
              <div className="p-2 text-center text-sm text-muted-foreground">
                No options found
              </div>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {maxSelections && (
        <div className="mt-1 text-xs text-muted-foreground">
          {value.length} of {maxSelections} selected
        </div>
      )}

      {error && (
        <FieldFeedback state="error" message={error} className="mt-1" />
      )}
    </div>
  );
}

// File upload with drag and drop component
export interface FileUploadWithDragDropProps {
  onFileSelect: (files: File[]) => void;
  acceptedFileTypes?: string[];
  maxFileSize?: number; // in MB
  maxFiles?: number;
  multiple?: boolean;
  error?: string;
  className?: string;
  children?: React.ReactNode;
}

export function FileUploadWithDragDrop({
  onFileSelect,
  acceptedFileTypes = ['image/*', '.pdf', '.doc', '.docx'],
  maxFileSize = 10,
  maxFiles = 5,
  multiple = true,
  error,
  className,
  children
}: FileUploadWithDragDropProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [uploadedFiles, setUploadedFiles] = React.useState<File[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
  };

  const processFiles = (files: File[]) => {
    const validFiles = files.filter(file => {
      // Check file size
      if (file.size > maxFileSize * 1024 * 1024) {
        console.warn(`File ${file.name} exceeds size limit`);
        return false;
      }

      // Check file type
      const isValidType = acceptedFileTypes.some(type => {
        if (type.startsWith('.')) {
          return file.name.toLowerCase().endsWith(type.toLowerCase());
        }
        return file.type.match(type.replace('*', '.*'));
      });

      if (!isValidType) {
        console.warn(`File ${file.name} is not an accepted file type`);
        return false;
      }

      return true;
    });

    if (!multiple && validFiles.length > 1) {
      validFiles.splice(1);
    }

    if (maxFiles && validFiles.length > maxFiles) {
      validFiles.splice(maxFiles);
    }

    setUploadedFiles(prev => {
      const newFiles = [...prev, ...validFiles];
      return maxFiles ? newFiles.slice(0, maxFiles) : newFiles;
    });

    onFileSelect(validFiles);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => {
      const newFiles = prev.filter((_, i) => i !== index);
      onFileSelect(newFiles);
      return newFiles;
    });
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-4 w-4" />;
    }
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25",
          error && "border-red-500",
          "hover:border-primary hover:bg-primary/5"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={acceptedFileTypes.join(',')}
          onChange={handleFileInput}
          className="hidden"
        />
        
        {children || (
          <div className="space-y-2">
            <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {isMobile ? 'Tap to select files' : 'Drop files here or click to browse'}
              </p>
              <p className="text-xs text-muted-foreground">
                Supports: {acceptedFileTypes.join(', ')} • Max {maxFileSize}MB
                {maxFiles && ` • Up to ${maxFiles} files`}
              </p>
            </div>
          </div>
        )}
      </div>

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Uploaded Files:</p>
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-3 bg-muted/50 rounded border"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {getFileIcon(file)}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="flex-shrink-0 h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <FieldFeedback state="error" message={error} />
      )}
    </div>
  );
}

// Smart numeric input with formatting
export interface SmartNumericInputProps {
  value: string | number;
  onChange: (value: string | number) => void;
  type?: 'number' | 'currency' | 'percentage';
  currency?: string;
  locale?: string;
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  placeholder?: string;
  error?: string;
  showCalculator?: boolean;
  help?: string;
  className?: string;
}

export function SmartNumericInput({
  value,
  onChange,
  type = 'number',
  currency = 'USD',
  locale = 'en-US',
  min,
  max,
  step = 1,
  precision = 2,
  placeholder,
  error,
  showCalculator = false,
  help,
  className
}: SmartNumericInputProps) {
  const [displayValue, setDisplayValue] = React.useState('');
  const [isFocused, setIsFocused] = React.useState(false);

  const formatValue = React.useCallback((val: string | number) => {
    if (!val && val !== 0) return '';
    
    const numValue = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(numValue)) return '';

    switch (type) {
      case 'currency':
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency,
          minimumFractionDigits: precision,
          maximumFractionDigits: precision
        }).format(numValue);
      
      case 'percentage':
        return new Intl.NumberFormat(locale, {
          style: 'percent',
          minimumFractionDigits: precision,
          maximumFractionDigits: precision
        }).format(numValue / 100);
      
      default:
        return new Intl.NumberFormat(locale, {
          minimumFractionDigits: 0,
          maximumFractionDigits: precision
        }).format(numValue);
    }
  }, [type, currency, locale, precision]);

  React.useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatValue(value));
    }
  }, [value, formatValue, isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
    setDisplayValue(value.toString());
  };

  const handleBlur = () => {
    setIsFocused(false);
    const numValue = parseFloat(displayValue);
    if (!isNaN(numValue)) {
      onChange(numValue);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setDisplayValue(newValue);
    
    const numValue = parseFloat(newValue);
    if (!isNaN(numValue)) {
      if ((min === undefined || numValue >= min) && (max === undefined || numValue <= max)) {
        onChange(numValue);
      }
    } else if (newValue === '') {
      onChange('');
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'currency':
        return <DollarSign className="h-4 w-4 text-muted-foreground" />;
      case 'percentage':
        return <Percent className="h-4 w-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        {getIcon() && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            {getIcon()}
          </div>
        )}
        <Input
          type="text"
          value={isFocused ? displayValue : formatValue(value)}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={cn(
            getIcon() && "pl-10",
            (showCalculator || help) && "pr-20",
            error && "border-red-500"
          )}
          step={step}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {showCalculator && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => {
                // Could open a calculator modal
                console.log('Open calculator');
              }}
            >
              <Calculator className="h-3 w-3" />
            </Button>
          )}
          {help && (
            <ContextualHelp content={help} />
          )}
        </div>
      </div>

      {error && (
        <FieldFeedback state="error" message={error} className="mt-1" />
      )}
      
      {(min !== undefined || max !== undefined) && (
        <div className="mt-1 text-xs text-muted-foreground">
          Range: {min ?? '∞'} - {max ?? '∞'}
        </div>
      )}
    </div>
  );
}

// Enhanced date/time picker optimized for mobile
export interface EnhancedDateTimePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  type?: 'date' | 'time' | 'datetime';
  min?: Date;
  max?: Date;
  placeholder?: string;
  error?: string;
  showIcon?: boolean;
  className?: string;
}

export function EnhancedDateTimePicker({
  value,
  onChange,
  type = 'date',
  min,
  max,
  placeholder,
  error,
  showIcon = true,
  className
}: EnhancedDateTimePickerProps) {
  const isMobile = useIsMobile();
  
  const formatDate = (date: Date) => {
    switch (type) {
      case 'time':
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case 'datetime':
        return date.toLocaleString();
      default:
        return date.toLocaleDateString();
    }
  };

  const getInputType = () => {
    if (isMobile) {
      switch (type) {
        case 'time':
          return 'time';
        case 'datetime':
          return 'datetime-local';
        default:
          return 'date';
      }
    }
    return 'text';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    if (inputValue) {
      const date = new Date(inputValue);
      if (!isNaN(date.getTime())) {
        onChange(date);
      }
    } else {
      onChange(undefined);
    }
  };

  const formatValueForInput = () => {
    if (!value) return '';
    
    if (isMobile) {
      switch (type) {
        case 'time':
          return value.toTimeString().slice(0, 5);
        case 'datetime':
          return value.toISOString().slice(0, 16);
        default:
          return value.toISOString().slice(0, 10);
      }
    }
    return formatDate(value);
  };

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        {showIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            {type === 'time' ? (
              <Clock className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Calendar className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        )}
        <Input
          type={getInputType()}
          value={formatValueForInput()}
          onChange={handleInputChange}
          placeholder={placeholder || `Select ${type}...`}
          className={cn(
            showIcon && "pl-10",
            error && "border-red-500"
          )}
          min={min?.toISOString().slice(0, type === 'time' ? 5 : type === 'datetime' ? 16 : 10)}
          max={max?.toISOString().slice(0, type === 'time' ? 5 : type === 'datetime' ? 16 : 10)}
        />
      </div>

      {error && (
        <FieldFeedback state="error" message={error} className="mt-1" />
      )}
    </div>
  );
}

// Conditional field renderer
export interface ConditionalFieldProps {
  condition: boolean | (() => boolean);
  children: React.ReactNode;
  fallback?: React.ReactNode;
  animateIn?: boolean;
  className?: string;
}

export function ConditionalField({
  condition,
  children,
  fallback,
  animateIn = true,
  className
}: ConditionalFieldProps) {
  const shouldShow = typeof condition === 'function' ? condition() : condition;

  if (!shouldShow) {
    return fallback ? <>{fallback}</> : null;
  }

  return (
    <div className={cn(
      animateIn && "animate-in slide-in-from-top duration-200",
      className
    )}>
      {children}
    </div>
  );
}

// Enhanced password input with all features
export interface EnhancedPasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showStrengthMeter?: boolean;
  showToggle?: boolean;
  showRequirements?: boolean;
  error?: string;
  help?: string;
  className?: string;
}

export function EnhancedPasswordInput({
  value,
  onChange,
  placeholder = "Enter password...",
  showStrengthMeter = true,
  showToggle = true,
  showRequirements = true,
  error,
  help,
  className
}: EnhancedPasswordInputProps) {
  const [isVisible, setIsVisible] = React.useState(false);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="relative">
        <Input
          type={isVisible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            showToggle && "pr-12",
            error && "border-red-500"
          )}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {help && <ContextualHelp content={help} />}
          {showToggle && (
            <PasswordToggle
              isVisible={isVisible}
              onToggle={() => setIsVisible(!isVisible)}
            />
          )}
        </div>
      </div>

      {error && (
        <FieldFeedback state="error" message={error} />
      )}

      {showStrengthMeter && value && (
        <div className="space-y-2">
          {/* This would integrate with the PasswordStrengthMeter component */}
          <div className="text-xs text-muted-foreground">
            Password strength indicator would go here
          </div>
        </div>
      )}
    </div>
  );
}
import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { Button } from "./button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface MobileFormStep {
  id: string
  title: string
  description?: string
  content: React.ReactNode
  validation?: () => boolean | Promise<boolean>
}

interface MobileFormProps {
  steps: MobileFormStep[]
  currentStep: number
  onStepChange: (step: number) => void
  onComplete?: () => void
  className?: string
  showProgress?: boolean
  allowSkipSteps?: boolean
}

export function MobileForm({
  steps,
  currentStep,
  onStepChange,
  onComplete,
  className,
  showProgress = true,
  allowSkipSteps = false
}: MobileFormProps) {
  const [isValidating, setIsValidating] = React.useState(false)
  
  const currentStepData = steps[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === steps.length - 1

  const handleNext = async () => {
    if (currentStepData.validation) {
      setIsValidating(true)
      try {
        const isValid = await currentStepData.validation()
        if (!isValid) {
          setIsValidating(false)
          return
        }
      } catch (error) {
        setIsValidating(false)
        return
      }
      setIsValidating(false)
    }

    if (isLastStep) {
      onComplete?.()
    } else {
      onStepChange(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (!isFirstStep) {
      onStepChange(currentStep - 1)
    }
  }

  const handleStepClick = (stepIndex: number) => {
    if (allowSkipSteps || stepIndex <= currentStep) {
      onStepChange(stepIndex)
    }
  }

  return (
    <div className={cn("w-full max-w-2xl mx-auto", className)}>
      {/* Progress Indicator */}
      {showProgress && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round(((currentStep + 1) / steps.length) * 100)}%
            </span>
          </div>
          
          {/* Desktop Progress Bar */}
          <div className="hidden sm:block">
            <div className="flex items-center space-x-2">
              {steps.map((step, index) => (
                <React.Fragment key={step.id}>
                  <button
                    className={cn(
                      "w-8 h-8 rounded-full text-xs font-medium transition-colors",
                      index <= currentStep
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                      allowSkipSteps || index <= currentStep
                        ? "cursor-pointer hover:scale-105"
                        : "cursor-not-allowed"
                    )}
                    onClick={() => handleStepClick(index)}
                    disabled={!allowSkipSteps && index > currentStep}
                  >
                    {index + 1}
                  </button>
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        "flex-1 h-0.5 transition-colors",
                        index < currentStep ? "bg-primary" : "bg-muted"
                      )}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Mobile Progress Bar */}
          <div className="sm:hidden">
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${((currentStep + 1) / steps.length) * 100}%`
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Step Content */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg sm:text-xl">
            {currentStepData.title}
          </CardTitle>
          {currentStepData.description && (
            <p className="text-sm text-muted-foreground">
              {currentStepData.description}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {currentStepData.content}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-6 gap-4">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={isFirstStep}
          size="mobile"
          className="flex-1 sm:flex-none"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        <Button
          onClick={handleNext}
          disabled={isValidating}
          size="mobile"
          className="flex-1 sm:flex-none"
        >
          {isValidating ? (
            "Validating..."
          ) : isLastStep ? (
            "Complete"
          ) : (
            <>
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

// Mobile-optimized form field component
interface MobileFormFieldProps {
  label: string
  description?: string
  required?: boolean
  error?: string
  children: React.ReactNode
  className?: string
}

export function MobileFormField({
  label,
  description,
  required,
  error,
  children,
  className
}: MobileFormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {children}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}

// Mobile-optimized form section
interface MobileFormSectionProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function MobileFormSection({
  title,
  description,
  children,
  className
}: MobileFormSectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-1">
        <h3 className="text-base font-semibold">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )
}

// Mobile-optimized form grid
interface MobileFormGridProps {
  children: React.ReactNode
  columns?: 1 | 2
  className?: string
}

export function MobileFormGrid({
  children,
  columns = 1,
  className
}: MobileFormGridProps) {
  return (
    <div className={cn(
      "grid gap-4",
      columns === 1 && "grid-cols-1",
      columns === 2 && "grid-cols-1 sm:grid-cols-2",
      className
    )}>
      {children}
    </div>
  )
}
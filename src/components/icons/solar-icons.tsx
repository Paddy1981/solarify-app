/**
 * Solarify Solar Industry Icon System
 * Accessible SVG icons specifically designed for solar marketplace
 * All icons follow WCAG 2.1 AA guidelines with proper ARIA labels
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Icon wrapper with accessibility and size variants
const iconVariants = cva(
  ['inline-block flex-shrink-0'],
  {
    variants: {
      size: {
        xs: 'w-3 h-3',         // 12px
        sm: 'w-4 h-4',         // 16px
        md: 'w-5 h-5',         // 20px  
        lg: 'w-6 h-6',         // 24px
        xl: 'w-8 h-8',         // 32px
        '2xl': 'w-10 h-10',    // 40px
        '3xl': 'w-12 h-12',    // 48px
        // Touch-friendly sizes for mobile
        'mobile-sm': 'w-6 h-6',  // 24px minimum for mobile
        'mobile-md': 'w-8 h-8',  // 32px comfortable mobile
        'mobile-lg': 'w-10 h-10', // 40px large mobile
      },
      color: {
        current: 'text-current',
        inherit: 'text-inherit',
        primary: 'text-primary',
        secondary: 'text-secondary',
        muted: 'text-muted-foreground',
        success: 'text-success',
        warning: 'text-warning',
        error: 'text-error',
        // Solar-specific colors
        solar: 'text-solar-primary',
        energy: 'text-energy-primary',
        eco: 'text-eco-primary',
      },
    },
    defaultVariants: {
      size: 'md',
      color: 'current',
    },
  }
);

// Base icon interface with accessibility props
interface IconProps extends VariantProps<typeof iconVariants> {
  className?: string;
  'aria-label'?: string;
  'aria-hidden'?: boolean;
  title?: string;
  role?: string;
}

// Base icon component with accessibility features
const BaseIcon = React.forwardRef<SVGSVGElement, IconProps & { children: React.ReactNode }>(
  ({ children, size, color, className, 'aria-label': ariaLabel, 'aria-hidden': ariaHidden, title, role, ...props }, ref) => {
    const hasLabel = Boolean(ariaLabel || title);
    
    return (
      <svg
        ref={ref}
        className={cn(iconVariants({ size, color }), className)}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        viewBox="0 0 24 24"
        aria-label={ariaLabel}
        aria-hidden={ariaHidden || (!hasLabel ? true : undefined)}
        role={role || (hasLabel ? 'img' : 'presentation')}
        focusable="false"
        {...props}
      >
        {title && <title>{title}</title>}
        {children}
      </svg>
    );
  }
);
BaseIcon.displayName = 'BaseIcon';

// Solar Panel Icons
export const SolarPanelIcon = React.forwardRef<SVGSVGElement, IconProps>(
  (props, ref) => (
    <BaseIcon ref={ref} {...props} aria-label={props['aria-label'] || 'Solar panel'}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
    </BaseIcon>
  )
);
SolarPanelIcon.displayName = 'SolarPanelIcon';

export const SunIcon = React.forwardRef<SVGSVGElement, IconProps>(
  (props, ref) => (
    <BaseIcon ref={ref} {...props} aria-label={props['aria-label'] || 'Sun energy'}>
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </BaseIcon>
  )
);
SunIcon.displayName = 'SunIcon';

export const BatteryIcon = React.forwardRef<SVGSVGElement, IconProps>(
  (props, ref) => (
    <BaseIcon ref={ref} {...props} aria-label={props['aria-label'] || 'Solar battery storage'}>
      <rect x="2" y="7" width="16" height="10" rx="1" />
      <path d="M22 11v2" />
      <rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor" fillOpacity="0.3" />
    </BaseIcon>
  )
);
BatteryIcon.displayName = 'BatteryIcon';

export const PowerIcon = React.forwardRef<SVGSVGElement, IconProps>(
  (props, ref) => (
    <BaseIcon ref={ref} {...props} aria-label={props['aria-label'] || 'Electrical power'}>
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </BaseIcon>
  )
);
PowerIcon.displayName = 'PowerIcon';

export const ElectricMeterIcon = React.forwardRef<SVGSVGElement, IconProps>(
  (props, ref) => (
    <BaseIcon ref={ref} {...props} aria-label={props['aria-label'] || 'Electric meter'}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 9v6M9 12h6" />
      <path d="M7 4v-1a1 1 0 011-1h8a1 1 0 011 1v1" />
    </BaseIcon>
  )
);
ElectricMeterIcon.displayName = 'ElectricMeterIcon';

// Energy & Efficiency Icons
export const EnergyIcon = React.forwardRef<SVGSVGElement, IconProps>(
  (props, ref) => (
    <BaseIcon ref={ref} {...props} aria-label={props['aria-label'] || 'Energy efficiency'}>
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      <circle cx="18" cy="6" r="3" fill="currentColor" fillOpacity="0.3" />
    </BaseIcon>
  )
);
EnergyIcon.displayName = 'EnergyIcon';

export const EfficiencyIcon = React.forwardRef<SVGSVGElement, IconProps>(
  (props, ref) => (
    <BaseIcon ref={ref} {...props} aria-label={props['aria-label'] || 'Efficiency rating'}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </BaseIcon>
  )
);
EfficiencyIcon.displayName = 'EfficiencyIcon';

export const CostSavingsIcon = React.forwardRef<SVGSVGElement, IconProps>(
  (props, ref) => (
    <BaseIcon ref={ref} {...props} aria-label={props['aria-label'] || 'Cost savings'}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
      <path d="M16 2v4M8 2v4" />
    </BaseIcon>
  )
);
CostSavingsIcon.displayName = 'CostSavingsIcon';

// Installation & Maintenance Icons
export const InstallerIcon = React.forwardRef<SVGSVGElement, IconProps>(
  (props, ref) => (
    <BaseIcon ref={ref} {...props} aria-label={props['aria-label'] || 'Solar installer'}>
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
      <path d="M14 14l2-2 4 4" />
    </BaseIcon>
  )
);
InstallerIcon.displayName = 'InstallerIcon';

export const MaintenanceIcon = React.forwardRef<SVGSVGElement, IconProps>(
  (props, ref) => (
    <BaseIcon ref={ref} {...props} aria-label={props['aria-label'] || 'System maintenance'}>
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
    </BaseIcon>
  )
);
MaintenanceIcon.displayName = 'MaintenanceIcon';

export const InspectionIcon = React.forwardRef<SVGSVGElement, IconProps>(
  (props, ref) => (
    <BaseIcon ref={ref} {...props} aria-label={props['aria-label'] || 'System inspection'}>
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
      <circle cx="11" cy="11" r="3" />
    </BaseIcon>
  )
);
InspectionIcon.displayName = 'InspectionIcon';

// Environmental Icons
export const LeafIcon = React.forwardRef<SVGSVGElement, IconProps>(
  (props, ref) => (
    <BaseIcon ref={ref} {...props} aria-label={props['aria-label'] || 'Environmental benefit'}>
      <path d="M11 20A7 7 0 019.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </BaseIcon>
  )
);
LeafIcon.displayName = 'LeafIcon';

export const RecycleIcon = React.forwardRef<SVGSVGElement, IconProps>(
  (props, ref) => (
    <BaseIcon ref={ref} {...props} aria-label={props['aria-label'] || 'Recyclable energy'}>
      <path d="M7 19H4.815a1.83 1.83 0 01-1.57-.881 1.785 1.785 0 01-.004-1.784L7.196 9.5" />
      <path d="M11 19h8.203a1.83 1.83 0 001.556-.89 1.784 1.784 0 000-1.775L16.804 9.5" />
      <path d="M14 16l-3 3 3 3M8.5 2l3 3-3 3" />
    </BaseIcon>
  )
);
RecycleIcon.displayName = 'RecycleIcon';

export const CarbonFootprintIcon = React.forwardRef<SVGSVGElement, IconProps>(
  (props, ref) => (
    <BaseIcon ref={ref} {...props} aria-label={props['aria-label'] || 'Carbon footprint reduction'}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z" />
      <circle cx="12" cy="10" r="3" />
      <path d="M12 13v6" />
    </BaseIcon>
  )
);
CarbonFootprintIcon.displayName = 'CarbonFootprintIcon';

// Data & Analytics Icons
export const ChartIcon = React.forwardRef<SVGSVGElement, IconProps>(
  (props, ref) => (
    <BaseIcon ref={ref} {...props} aria-label={props['aria-label'] || 'Energy analytics'}>
      <path d="M3 3v18h18" />
      <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
    </BaseIcon>
  )
);
ChartIcon.displayName = 'ChartIcon';

export const DashboardIcon = React.forwardRef<SVGSVGElement, IconProps>(
  (props, ref) => (
    <BaseIcon ref={ref} {...props} aria-label={props['aria-label'] || 'System dashboard'}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 3v18" />
    </BaseIcon>
  )
);
DashboardIcon.displayName = 'DashboardIcon';

export const ReportIcon = React.forwardRef<SVGSVGElement, IconProps>(
  (props, ref) => (
    <BaseIcon ref={ref} {...props} aria-label={props['aria-label'] || 'Energy report'}>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </BaseIcon>
  )
);
ReportIcon.displayName = 'ReportIcon';

// Home & Building Icons
export const HomeIcon = React.forwardRef<SVGSVGElement, IconProps>(
  (props, ref) => (
    <BaseIcon ref={ref} {...props} aria-label={props['aria-label'] || 'Residential solar'}>
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </BaseIcon>
  )
);
HomeIcon.displayName = 'HomeIcon';

export const BuildingIcon = React.forwardRef<SVGSVGElement, IconProps>(
  (props, ref) => (
    <BaseIcon ref={ref} {...props} aria-label={props['aria-label'] || 'Commercial solar'}>
      <path d="M6 22V4a2 2 0 012-2h8a2 2 0 012 2v18z" />
      <path d="M6 12h12" />
      <path d="M6 8h2M6 16h2M14 8h2M14 16h2" />
    </BaseIcon>
  )
);
BuildingIcon.displayName = 'BuildingIcon';

export const RooftopIcon = React.forwardRef<SVGSVGElement, IconProps>(
  (props, ref) => (
    <BaseIcon ref={ref} {...props} aria-label={props['aria-label'] || 'Rooftop installation'}>
      <path d="M6 20V9l-3 3V9l9-7 9 7v3l-3-3v11" />
      <path d="M6 9h12" />
      <rect x="8" y="11" width="2" height="9" />
      <rect x="14" y="11" width="2" height="9" />
    </BaseIcon>
  )
);
RooftopIcon.displayName = 'RooftopIcon';

// Financial Icons
export const DollarIcon = React.forwardRef<SVGSVGElement, IconProps>(
  (props, ref) => (
    <BaseIcon ref={ref} {...props} aria-label={props['aria-label'] || 'Cost or savings'}>
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </BaseIcon>
  )
);
DollarIcon.displayName = 'DollarIcon';

export const CalculatorIcon = React.forwardRef<SVGSVGElement, IconProps>(
  (props, ref) => (
    <BaseIcon ref={ref} {...props} aria-label={props['aria-label'] || 'Solar calculator'}>
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="8" y1="6" x2="16" y2="6" />
      <line x1="8" y1="10" x2="8" y2="10" />
      <line x1="12" y1="10" x2="12" y2="10" />
      <line x1="16" y1="10" x2="16" y2="10" />
      <line x1="8" y1="14" x2="8" y2="14" />
      <line x1="12" y1="14" x2="12" y2="14" />
      <line x1="16" y1="14" x2="16" y2="14" />
      <line x1="8" y1="18" x2="16" y2="18" />
    </BaseIcon>
  )
);
CalculatorIcon.displayName = 'CalculatorIcon';

// Weather Icons
export const CloudyIcon = React.forwardRef<SVGSVGElement, IconProps>(
  (props, ref) => (
    <BaseIcon ref={ref} {...props} aria-label={props['aria-label'] || 'Cloudy weather'}>
      <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" />
    </BaseIcon>
  )
);
CloudyIcon.displayName = 'CloudyIcon';

export const PartlyCloudyIcon = React.forwardRef<SVGSVGElement, IconProps>(
  (props, ref) => (
    <BaseIcon ref={ref} {...props} aria-label={props['aria-label'] || 'Partly cloudy weather'}>
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" />
    </BaseIcon>
  )
);
PartlyCloudyIcon.displayName = 'PartlyCloudyIcon';

// System Status Icons
export const CheckIcon = React.forwardRef<SVGSVGElement, IconProps>(
  (props, ref) => (
    <BaseIcon ref={ref} {...props} aria-label={props['aria-label'] || 'System operational'}>
      <polyline points="20 6 9 17 4 12" />
    </BaseIcon>
  )
);
CheckIcon.displayName = 'CheckIcon';

export const AlertIcon = React.forwardRef<SVGSVGElement, IconProps>(
  (props, ref) => (
    <BaseIcon ref={ref} {...props} aria-label={props['aria-label'] || 'System alert'}>
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </BaseIcon>
  )
);
AlertIcon.displayName = 'AlertIcon';

export const InfoIcon = React.forwardRef<SVGSVGElement, IconProps>(
  (props, ref) => (
    <BaseIcon ref={ref} {...props} aria-label={props['aria-label'] || 'Information'}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </BaseIcon>
  )
);
InfoIcon.displayName = 'InfoIcon';

// Arrow and Navigation Icons
export const ArrowUpIcon = React.forwardRef<SVGSVGElement, IconProps>(
  (props, ref) => (
    <BaseIcon ref={ref} {...props} aria-label={props['aria-label'] || 'Arrow up'}>
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </BaseIcon>
  )
);
ArrowUpIcon.displayName = 'ArrowUpIcon';

export const ArrowDownIcon = React.forwardRef<SVGSVGElement, IconProps>(
  (props, ref) => (
    <BaseIcon ref={ref} {...props} aria-label={props['aria-label'] || 'Arrow down'}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <polyline points="19 12 12 19 5 12" />
    </BaseIcon>
  )
);
ArrowDownIcon.displayName = 'ArrowDownIcon';

export const ArrowRightIcon = React.forwardRef<SVGSVGElement, IconProps>(
  (props, ref) => (
    <BaseIcon ref={ref} {...props} aria-label={props['aria-label'] || 'Arrow right'}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </BaseIcon>
  )
);
ArrowRightIcon.displayName = 'ArrowRightIcon';

// Export all icons for easy importing
export const SolarIcons = {
  // Solar equipment
  SolarPanel: SolarPanelIcon,
  Sun: SunIcon,
  Battery: BatteryIcon,
  Power: PowerIcon,
  ElectricMeter: ElectricMeterIcon,
  
  // Energy & efficiency  
  Energy: EnergyIcon,
  Efficiency: EfficiencyIcon,
  CostSavings: CostSavingsIcon,
  
  // Installation & maintenance
  Installer: InstallerIcon,
  Maintenance: MaintenanceIcon,
  Inspection: InspectionIcon,
  
  // Environmental
  Leaf: LeafIcon,
  Recycle: RecycleIcon,
  CarbonFootprint: CarbonFootprintIcon,
  
  // Data & analytics
  Chart: ChartIcon,
  Dashboard: DashboardIcon,
  Report: ReportIcon,
  
  // Buildings
  Home: HomeIcon,
  Building: BuildingIcon,
  Rooftop: RooftopIcon,
  
  // Financial
  Dollar: DollarIcon,
  Calculator: CalculatorIcon,
  
  // Weather
  Cloudy: CloudyIcon,
  PartlyCloudy: PartlyCloudyIcon,
  
  // Status
  Check: CheckIcon,
  Alert: AlertIcon,
  Info: InfoIcon,
  
  // Navigation
  ArrowUp: ArrowUpIcon,
  ArrowDown: ArrowDownIcon,
  ArrowRight: ArrowRightIcon,
};

// Export icon variant props type
export type IconVariantProps = VariantProps<typeof iconVariants>;

// Export default
export default SolarIcons;
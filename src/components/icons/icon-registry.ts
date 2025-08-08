/**
 * Solarify Icon Registry
 * Centralized icon management system with type safety and accessibility
 * Provides consistent icon usage across the application
 */

import { SolarIcons } from './solar-icons';

// Icon categories for organization
export const iconCategories = {
  solar: {
    label: 'Solar Equipment',
    description: 'Icons related to solar panels, batteries, and equipment',
    icons: {
      'solar-panel': SolarIcons.SolarPanel,
      'sun': SolarIcons.Sun,
      'battery': SolarIcons.Battery,
      'power': SolarIcons.Power,
      'electric-meter': SolarIcons.ElectricMeter,
    },
  },
  
  energy: {
    label: 'Energy & Efficiency',
    description: 'Icons for energy production, efficiency, and savings',
    icons: {
      'energy': SolarIcons.Energy,
      'efficiency': SolarIcons.Efficiency,
      'cost-savings': SolarIcons.CostSavings,
    },
  },
  
  services: {
    label: 'Installation & Services',
    description: 'Icons for installation, maintenance, and service providers',
    icons: {
      'installer': SolarIcons.Installer,
      'maintenance': SolarIcons.Maintenance,
      'inspection': SolarIcons.Inspection,
    },
  },
  
  environmental: {
    label: 'Environmental Impact',
    description: 'Icons representing environmental benefits and sustainability',
    icons: {
      'leaf': SolarIcons.Leaf,
      'recycle': SolarIcons.Recycle,
      'carbon-footprint': SolarIcons.CarbonFootprint,
    },
  },
  
  analytics: {
    label: 'Data & Analytics',
    description: 'Icons for dashboards, reports, and data visualization',
    icons: {
      'chart': SolarIcons.Chart,
      'dashboard': SolarIcons.Dashboard,
      'report': SolarIcons.Report,
    },
  },
  
  buildings: {
    label: 'Buildings & Properties',
    description: 'Icons for different types of solar installations',
    icons: {
      'home': SolarIcons.Home,
      'building': SolarIcons.Building,
      'rooftop': SolarIcons.Rooftop,
    },
  },
  
  financial: {
    label: 'Financial & Calculations',
    description: 'Icons for costs, savings, and financial calculations',
    icons: {
      'dollar': SolarIcons.Dollar,
      'calculator': SolarIcons.Calculator,
    },
  },
  
  weather: {
    label: 'Weather Conditions',
    description: 'Icons representing weather conditions affecting solar production',
    icons: {
      'cloudy': SolarIcons.Cloudy,
      'partly-cloudy': SolarIcons.PartlyCloudy,
    },
  },
  
  status: {
    label: 'System Status',
    description: 'Icons indicating system status and alerts',
    icons: {
      'check': SolarIcons.Check,
      'alert': SolarIcons.Alert,
      'info': SolarIcons.Info,
    },
  },
  
  navigation: {
    label: 'Navigation & UI',
    description: 'Icons for navigation and user interface elements',
    icons: {
      'arrow-up': SolarIcons.ArrowUp,
      'arrow-down': SolarIcons.ArrowDown,
      'arrow-right': SolarIcons.ArrowRight,
    },
  },
} as const;

// Create flat registry for easy lookup
export const iconRegistry = Object.values(iconCategories).reduce(
  (registry, category) => ({
    ...registry,
    ...category.icons,
  }),
  {}
);

// Type definitions
export type IconName = keyof typeof iconRegistry;
export type IconCategoryName = keyof typeof iconCategories;

// Utility functions
export const getIcon = (name: IconName) => {
  return iconRegistry[name];
};

export const getIconsByCategory = (categoryName: IconCategoryName) => {
  return iconCategories[categoryName]?.icons || {};
};

export const getAllIcons = () => {
  return iconRegistry;
};

export const getIconNames = (): IconName[] => {
  return Object.keys(iconRegistry) as IconName[];
};

export const getCategoryNames = (): IconCategoryName[] => {
  return Object.keys(iconCategories) as IconCategoryName[];
};

// Icon usage contexts for semantic naming
export const iconContexts = {
  // Dashboard contexts
  dashboard: {
    energyProduction: 'sun',
    energySavings: 'cost-savings',
    systemStatus: 'check',
    batteryLevel: 'battery',
    weatherCondition: 'cloudy',
  },
  
  // Product contexts
  product: {
    solarPanel: 'solar-panel',
    battery: 'battery',
    inverter: 'power',
    monitoring: 'dashboard',
    warranty: 'check',
  },
  
  // Service contexts
  service: {
    installation: 'installer',
    maintenance: 'maintenance',
    inspection: 'inspection',
    consultation: 'info',
    quote: 'calculator',
  },
  
  // Property contexts
  property: {
    residential: 'home',
    commercial: 'building',
    rooftop: 'rooftop',
    groundMount: 'solar-panel',
  },
  
  // Financial contexts
  financial: {
    cost: 'dollar',
    savings: 'cost-savings',
    calculator: 'calculator',
    report: 'report',
    payback: 'chart',
  },
  
  // Environmental contexts
  environmental: {
    carbonReduction: 'carbon-footprint',
    sustainability: 'leaf',
    renewable: 'recycle',
    clean: 'sun',
  },
} as const;

// Accessibility guidelines for icon usage
export const iconAccessibilityGuidelines = {
  // When to use aria-hidden
  decorative: {
    description: 'Icons that are purely decorative and don\'t convey meaning should be hidden from screen readers',
    example: 'Icons next to text labels that duplicate the meaning',
    implementation: 'aria-hidden="true"',
  },
  
  // When to use aria-label
  informative: {
    description: 'Icons that convey important information should have descriptive labels',
    example: 'Status indicators, action buttons without text',
    implementation: 'aria-label="Clear description of the icon\'s meaning"',
  },
  
  // Interactive icons
  interactive: {
    description: 'Icons used as buttons or links need proper labels and focus states',
    example: 'Icon-only buttons, navigation icons',
    implementation: 'aria-label + proper focus management',
  },
  
  // Size recommendations
  sizes: {
    mobile: 'Use mobile-sm (24px) or larger for touch targets on mobile devices',
    desktop: 'Use sm (16px) to lg (24px) for most desktop UI elements',
    decorative: 'Use xs (12px) to sm (16px) for purely decorative elements',
  },
} as const;

// Color usage guidelines
export const iconColorGuidelines = {
  semantic: {
    description: 'Use semantic colors to convey meaning',
    examples: {
      success: 'Use success color for positive status indicators',
      warning: 'Use warning color for caution or attention states',
      error: 'Use error color for problems or destructive actions',
      solar: 'Use solar color for solar-specific features',
      energy: 'Use energy color for energy-related metrics',
      eco: 'Use eco color for environmental benefits',
    },
  },
  
  contrast: {
    description: 'Ensure sufficient color contrast for accessibility',
    requirements: {
      'Normal text': 'Minimum 4.5:1 contrast ratio',
      'Large text': 'Minimum 3:1 contrast ratio',
      'Interactive elements': 'Minimum 3:1 contrast ratio for focus states',
    },
  },
} as const;

// Export types for TypeScript support
export type IconContext = keyof typeof iconContexts;
export type IconContextValue<T extends IconContext> = typeof iconContexts[T];

// Utility to get contextual icon
export const getContextualIcon = <T extends IconContext>(
  context: T,
  key: keyof IconContextValue<T>
): IconName => {
  return iconContexts[context][key] as IconName;
};
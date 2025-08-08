/**
 * Solarify Icons - Main Export
 * Complete icon system for solar marketplace application
 */

// Export main icon components
export { default as Icon } from './Icon';
export { SolarIcons, type IconVariantProps } from './solar-icons';

// Export individual icon components for direct imports
export {
  // Solar equipment icons
  SolarPanelIcon,
  SunIcon,
  BatteryIcon,
  PowerIcon,
  ElectricMeterIcon,
  
  // Energy & efficiency icons
  EnergyIcon,
  EfficiencyIcon,
  CostSavingsIcon,
  
  // Installation & maintenance icons
  InstallerIcon,
  MaintenanceIcon,
  InspectionIcon,
  
  // Environmental icons
  LeafIcon,
  RecycleIcon,
  CarbonFootprintIcon,
  
  // Data & analytics icons
  ChartIcon,
  DashboardIcon,
  ReportIcon,
  
  // Building icons
  HomeIcon,
  BuildingIcon,
  RooftopIcon,
  
  // Financial icons
  DollarIcon,
  CalculatorIcon,
  
  // Weather icons
  CloudyIcon,
  PartlyCloudyIcon,
  
  // Status icons
  CheckIcon,
  AlertIcon,
  InfoIcon,
  
  // Navigation icons
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowRightIcon,
} from './solar-icons';

// Export registry and utilities
export {
  iconCategories,
  iconRegistry,
  iconContexts,
  iconAccessibilityGuidelines,
  iconColorGuidelines,
  getIcon,
  getIconsByCategory,
  getAllIcons,
  getIconNames,
  getCategoryNames,
  getContextualIcon,
  type IconName,
  type IconCategoryName,
  type IconContext,
} from './icon-registry';

// Re-export for convenience
export type { IconVariantProps as IconProps };
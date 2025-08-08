/**
 * Universal Icon Component
 * Convenient wrapper for all solar marketplace icons with type safety
 * Automatically handles accessibility and consistent styling
 */

import * as React from 'react';
import { type IconName, getIcon } from './icon-registry';
import { type IconVariantProps } from './solar-icons';

interface IconProps extends IconVariantProps {
  name: IconName;
  className?: string;
  'aria-label'?: string;
  'aria-hidden'?: boolean;
  title?: string;
  role?: string;
}

/**
 * Universal Icon component that renders any icon from the registry
 * 
 * @example
 * // Basic usage
 * <Icon name="solar-panel" />
 * 
 * // With accessibility label
 * <Icon name="battery" aria-label="Battery level indicator" />
 * 
 * // With custom styling
 * <Icon name="sun" size="lg" color="solar" className="animate-pulse" />
 * 
 * // Decorative icon (hidden from screen readers)
 * <Icon name="leaf" aria-hidden={true} />
 */
export const Icon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ name, ...props }, ref) => {
    const IconComponent = getIcon(name);
    
    if (!IconComponent) {
      console.warn(`Icon "${name}" not found in registry`);
      return null;
    }
    
    return <IconComponent ref={ref} {...props} />;
  }
);

Icon.displayName = 'Icon';

// Export for convenience
export default Icon;
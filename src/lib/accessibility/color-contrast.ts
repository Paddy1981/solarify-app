/**
 * Color contrast validation utilities for WCAG 2.1 AA compliance
 * Implements WCAG contrast ratio calculations and validation
 */

import type { ColorContrastResult } from './types';

/**
 * Convert hex color to RGB values
 */
function hexToRgb(hex: string): [number, number, number] | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : null;
}

/**
 * Convert HSL to RGB values
 */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360;
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h * 6) % 2 - 1));
  const m = l - c / 2;

  let r: number, g: number, b: number;

  if (0 <= h && h < 1/6) {
    r = c; g = x; b = 0;
  } else if (1/6 <= h && h < 2/6) {
    r = x; g = c; b = 0;
  } else if (2/6 <= h && h < 3/6) {
    r = 0; g = c; b = x;
  } else if (3/6 <= h && h < 4/6) {
    r = 0; g = x; b = c;
  } else if (4/6 <= h && h < 5/6) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255)
  ];
}

/**
 * Parse HSL string to RGB values
 */
function parseHslString(hsl: string): [number, number, number] | null {
  const match = hsl.match(/hsl\(\s*(\d+)\s*,?\s*(\d+)%?\s*,?\s*(\d+)%?\s*\)/);
  if (!match) return null;
  
  const [, h, s, l] = match;
  return hslToRgb(parseInt(h), parseInt(s), parseInt(l));
}

/**
 * Calculate relative luminance of a color
 * Based on WCAG 2.1 specification
 */
function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    const channel = c / 255;
    return channel <= 0.03928 
      ? channel / 12.92 
      : Math.pow((channel + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 * Returns a value between 1 and 21
 */
function calculateContrastRatio(color1: [number, number, number], color2: [number, number, number]): number {
  const l1 = getRelativeLuminance(...color1);
  const l2 = getRelativeLuminance(...color2);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Parse color string to RGB values
 * Supports hex, rgb, hsl formats
 */
function parseColor(color: string): [number, number, number] | null {
  // Remove whitespace
  color = color.trim();
  
  // Hex color
  if (color.startsWith('#')) {
    return hexToRgb(color);
  }
  
  // RGB color
  if (color.startsWith('rgb')) {
    const match = color.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
    if (match) {
      return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
    }
  }
  
  // HSL color
  if (color.startsWith('hsl')) {
    return parseHslString(color);
  }
  
  // Named colors (basic set)
  const namedColors: Record<string, [number, number, number]> = {
    'white': [255, 255, 255],
    'black': [0, 0, 0],
    'red': [255, 0, 0],
    'green': [0, 128, 0],
    'blue': [0, 0, 255],
    'yellow': [255, 255, 0],
    'cyan': [0, 255, 255],
    'magenta': [255, 0, 255],
    'silver': [192, 192, 192],
    'gray': [128, 128, 128],
    'maroon': [128, 0, 0],
    'olive': [128, 128, 0],
    'lime': [0, 255, 0],
    'aqua': [0, 255, 255],
    'teal': [0, 128, 128],
    'navy': [0, 0, 128],
    'fuchsia': [255, 0, 255],
    'purple': [128, 0, 128]
  };
  
  const lowerColor = color.toLowerCase();
  if (lowerColor in namedColors) {
    return namedColors[lowerColor];
  }
  
  return null;
}

/**
 * Check if contrast ratio meets WCAG requirements
 */
export function checkColorContrast(foreground: string, background: string): ColorContrastResult {
  const fg = parseColor(foreground);
  const bg = parseColor(background);
  
  if (!fg || !bg) {
    return {
      ratio: 0,
      passes: { AA: false, AAA: false, AAlarge: false, AAAlarge: false },
      grade: 'Fail'
    };
  }
  
  const ratio = calculateContrastRatio(fg, bg);
  
  const passes = {
    AA: ratio >= 4.5,          // Normal text WCAG AA
    AAA: ratio >= 7,           // Normal text WCAG AAA
    AAlarge: ratio >= 3,       // Large text WCAG AA
    AAAlarge: ratio >= 4.5     // Large text WCAG AAA
  };
  
  let grade: 'A' | 'AA' | 'AAA' | 'Fail';
  if (passes.AAA) {
    grade = 'AAA';
  } else if (passes.AA) {
    grade = 'AA';
  } else if (passes.AAlarge) {
    grade = 'A';
  } else {
    grade = 'Fail';
  }
  
  return { ratio, passes, grade };
}

/**
 * Validate all color combinations in the design system
 */
export function validateDesignSystemColors(): Record<string, ColorContrastResult> {
  // Colors from globals.css converted to hex for validation
  const colors = {
    // Light theme
    'primary-on-white': ['#FFEA00', '#FFFFFF'],           // Yellow on white
    'primary-foreground-on-primary': ['#0A0A0A', '#FFEA00'], // Black on yellow
    'accent-on-white': ['#29ABE2', '#FFFFFF'],            // Blue on white
    'accent-foreground-on-accent': ['#FAFAFA', '#29ABE2'], // White on blue
    'foreground-on-background': ['#0A0A0A', '#F5F5F5'],   // Black on light gray
    'muted-foreground-on-background': ['#737373', '#F5F5F5'], // Gray on light gray
    'muted-foreground-on-muted': ['#737373', '#E5E5E5'],  // Gray on muted
    
    // Dark theme
    'primary-on-dark-background': ['#FFEA00', '#0A0A0A'],  // Yellow on dark
    'accent-on-dark-background': ['#29ABE2', '#0A0A0A'],   // Blue on dark
    'foreground-on-dark-background': ['#FAFAFA', '#0A0A0A'], // White on dark
    'muted-foreground-on-dark-background': ['#A3A3A3', '#0A0A0A'], // Light gray on dark
  };
  
  const results: Record<string, ColorContrastResult> = {};
  
  for (const [name, [foreground, background]] of Object.entries(colors)) {
    results[name] = checkColorContrast(foreground, background);
  }
  
  return results;
}

/**
 * Get accessible color alternatives
 */
export function getAccessibleColorAlternatives(
  foreground: string, 
  background: string, 
  targetRatio: number = 4.5
): string[] {
  const bg = parseColor(background);
  if (!bg) return [];
  
  const alternatives: string[] = [];
  const bgLuminance = getRelativeLuminance(...bg);
  
  // Calculate required luminance for the target ratio
  const requiredLuminanceBright = (bgLuminance + 0.05) * targetRatio - 0.05;
  const requiredLuminanceDark = (bgLuminance + 0.05) / targetRatio - 0.05;
  
  // Generate some alternative colors
  const originalFg = parseColor(foreground);
  if (originalFg) {
    const [r, g, b] = originalFg;
    
    // Try darker versions
    for (let factor = 0.1; factor <= 0.9; factor += 0.1) {
      const darkR = Math.round(r * factor);
      const darkG = Math.round(g * factor);
      const darkB = Math.round(b * factor);
      const darkHex = `#${darkR.toString(16).padStart(2, '0')}${darkG.toString(16).padStart(2, '0')}${darkB.toString(16).padStart(2, '0')}`;
      
      const contrast = checkColorContrast(darkHex, background);
      if (contrast.passes.AA) {
        alternatives.push(darkHex);
      }
    }
    
    // Try lighter versions (if background is dark enough)
    if (bgLuminance < 0.5) {
      for (let factor = 1.1; factor <= 2; factor += 0.1) {
        const lightR = Math.min(255, Math.round(r * factor));
        const lightG = Math.min(255, Math.round(g * factor));
        const lightB = Math.min(255, Math.round(b * factor));
        const lightHex = `#${lightR.toString(16).padStart(2, '0')}${lightG.toString(16).padStart(2, '0')}${lightB.toString(16).padStart(2, '0')}`;
        
        const contrast = checkColorContrast(lightHex, background);
        if (contrast.passes.AA) {
          alternatives.push(lightHex);
        }
      }
    }
  }
  
  return [...new Set(alternatives)]; // Remove duplicates
}

/**
 * Check if a color is accessible on both light and dark backgrounds
 */
export function isUniversallyAccessible(color: string): boolean {
  const lightBgResult = checkColorContrast(color, '#FFFFFF');
  const darkBgResult = checkColorContrast(color, '#000000');
  
  return lightBgResult.passes.AA && darkBgResult.passes.AA;
}

/**
 * Generate WCAG compliant color report
 */
export function generateColorReport(): string {
  const results = validateDesignSystemColors();
  let report = 'WCAG 2.1 AA Color Contrast Compliance Report\n';
  report += '=============================================\n\n';
  
  const violations: string[] = [];
  const warnings: string[] = [];
  const passes: string[] = [];
  
  for (const [name, result] of Object.entries(results)) {
    const line = `${name}: ${result.ratio.toFixed(2)}:1 (${result.grade})`;
    
    if (result.grade === 'Fail') {
      violations.push(line);
    } else if (result.grade === 'A') {
      warnings.push(line);
    } else {
      passes.push(line);
    }
  }
  
  if (violations.length > 0) {
    report += 'VIOLATIONS (WCAG AA Failure):\n';
    violations.forEach(v => report += `❌ ${v}\n`);
    report += '\n';
  }
  
  if (warnings.length > 0) {
    report += 'WARNINGS (Large text only):\n';
    warnings.forEach(w => report += `⚠️  ${w}\n`);
    report += '\n';
  }
  
  if (passes.length > 0) {
    report += 'PASSES:\n';
    passes.forEach(p => report += `✅ ${p}\n`);
    report += '\n';
  }
  
  return report;
}
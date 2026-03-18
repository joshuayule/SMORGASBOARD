import Color from 'color';
import namer from 'color-namer';
import { ColorTheoryRule, PaletteColor, ColorRole } from './types';

export const COLOR_ROLES: ColorRole[] = [
  'Primary',
  'Primary Light',
  'Primary Dark',
  'Secondary',
  'Accent',
  'Surface',
  'Background',
  'Text',
  'Success',
  'Warning',
  'Error',
  'Neutral',
  'Highlight'
];

export const getColorName = (hex: string): string => {
  try {
    const names = namer(hex);
    return names.ntc[0].name;
  } catch (e) {
    return 'Unknown Color';
  }
};

export const generatePaletteFromRule = (baseHex: string, rule: ColorTheoryRule, isDarkMode: boolean = false): PaletteColor[] => {
  const base = Color(baseHex);
  const palette = [base];

  switch (rule) {
    case 'complementary':
      palette.push(base.rotate(180));
      palette.push(base.lighten(0.2));
      palette.push(base.rotate(180).darken(0.2));
      palette.push(base.desaturate(0.5));
      break;
    case 'analogous':
      palette.push(base.rotate(-30));
      palette.push(base.rotate(-15));
      palette.push(base.rotate(15));
      palette.push(base.rotate(30));
      break;
    case 'triadic':
      palette.push(base.rotate(120));
      palette.push(base.rotate(240));
      palette.push(base.rotate(120).lighten(0.2));
      palette.push(base.rotate(240).darken(0.2));
      break;
    case 'tetradic':
      palette.push(base.rotate(90));
      palette.push(base.rotate(180));
      palette.push(base.rotate(270));
      palette.push(base.lighten(0.2));
      break;
    case 'monochromatic':
      palette.push(base.lighten(0.2));
      palette.push(base.lighten(0.4));
      palette.push(base.darken(0.2));
      palette.push(base.darken(0.4));
      break;
    case 'split-complementary':
      palette.push(base.rotate(150));
      palette.push(base.rotate(210));
      palette.push(base.lighten(0.1));
      palette.push(base.darken(0.1));
      break;
    case 'design-system':
      const s = base.saturationl();
      // Primary shades - smarter adjustments based on base lightness
      const isBaseDark = base.isDark();
      palette.push(isBaseDark ? base.lighten(0.3) : base.lighten(0.15)); // Primary Light
      palette.push(isBaseDark ? base.darken(0.15) : base.darken(0.3));  // Primary Dark
      
      // Accent - complementary but with dynamic saturation for better contrast
      const accentSaturation = s < 30 ? s + 40 : s + 10;
      palette.push(base.rotate(180).saturationl(Math.min(accentSaturation, 90)).lightness(isDarkMode ? 60 : 50)); // Accent
      
      // Background & Surface - derived from base hue for cohesion
      const baseHue = base.hue();
      if (isDarkMode) {
        // Dark mode: Deep, desaturated version of base hue
        palette.push(Color.hsl(baseHue, 15, 15)); // Surface
        palette.push(Color.hsl(baseHue, 10, 8));   // Background
        palette.push(Color.hsl(baseHue, 10, 95));  // Text
      } else {
        // Light mode: Very pale, desaturated version of base hue
        palette.push(Color.hsl(baseHue, 8, 100)); // Surface
        palette.push(Color.hsl(baseHue, 12, 98));  // Background
        palette.push(Color.hsl(baseHue, 20, 15)); // Text
      }
      
      // Semantic - adapted to base color's saturation for cohesion
      // We keep the functional hues but adapt the "energy"
      palette.push(Color.hsl(142, Math.min(s + 20, 75), isDarkMode ? 50 : 45)); // Success
      palette.push(Color.hsl(38, Math.min(s + 30, 90), isDarkMode ? 60 : 55));  // Warning
      palette.push(Color.hsl(0, Math.min(s + 25, 80), isDarkMode ? 55 : 50));   // Error
      break;
  }

  if (rule === 'design-system') {
    const roles: ColorRole[] = [
      'Primary',
      'Primary Light',
      'Primary Dark',
      'Accent',
      'Surface',
      'Background',
      'Text',
      'Success',
      'Warning',
      'Error'
    ];
    return palette.map((c, i) => ({
      hex: c.hex(),
      name: getColorName(c.hex()),
      role: roles[i]
    }));
  }

  return palette.map((c, i) => ({
    hex: c.hex(),
    name: getColorName(c.hex()),
    role: COLOR_ROLES[i % COLOR_ROLES.length]
  }));
};

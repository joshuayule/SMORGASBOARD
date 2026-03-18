import Color from 'color';

export type ColorTheoryRule = 
  | 'complementary' 
  | 'analogous' 
  | 'triadic' 
  | 'tetradic' 
  | 'monochromatic' 
  | 'split-complementary'
  | 'design-system';

export type ColorRole = 
  | 'Primary' 
  | 'Primary Light'
  | 'Primary Dark'
  | 'Secondary' 
  | 'Accent' 
  | 'Surface' 
  | 'Background' 
  | 'Text'
  | 'Success'
  | 'Warning'
  | 'Error'
  | 'Neutral' 
  | 'Highlight';

export interface PaletteColor {
  hex: string;
  name: string;
  role?: ColorRole;
  isLocked?: boolean;
}

export interface AgentConfig {
  id: string;
  name: string;
  role: string;
  systemInstruction: string;
  model: string;
  temperature: number;
  topP: number;
  topK: number;
}

export const DEFAULT_AGENTS: AgentConfig[] = [
  {
    id: 'mood-specialist',
    name: 'Mood Specialist',
    role: 'Translates emotions and vibes into color palettes.',
    systemInstruction: 'You are a world-class color theorist. Your goal is to provide a list of 5 hex color codes that perfectly capture the mood or keyword provided by the user. Return ONLY a JSON array of hex codes.',
    model: 'gemini-3-flash-preview',
    temperature: 0.7,
    topP: 0.95,
    topK: 40,
  },
  {
    id: 'brand-expert',
    name: 'Brand Expert',
    role: 'Focuses on accessibility and corporate identity.',
    systemInstruction: 'You are a branding expert. Use the Branding Guidelines Archive (https://brandingstyleguides.com/) as a reference to help target specific requests. Provide 5 hex codes that are professional, accessible, and suitable for a modern tech brand. Return ONLY a JSON array of hex codes.',
    model: 'gemini-3.1-pro-preview',
    temperature: 0.4,
    topP: 0.8,
    topK: 20,
  },
  {
    id: 'typo-layout-expert',
    name: 'Typography & Layout Expert',
    role: 'Expert in font pairings, hierarchy, and grid systems.',
    systemInstruction: 'You are a typography and layout expert. Suggest 5 hex codes that create a balanced hierarchy for a text-heavy design (background, primary text, secondary text, accent, and border). Return ONLY a JSON array of hex codes.',
    model: 'gemini-3.1-pro-preview',
    temperature: 0.5,
    topP: 0.9,
    topK: 30,
  },
  {
    id: 'accessibility-advocate',
    name: 'Accessibility Advocate',
    role: 'Ensures inclusive design for all vision types.',
    systemInstruction: 'You are a world-class Accessibility Advocate and Inclusive Design Expert. Your mission is to generate color palettes that are not just beautiful, but universally accessible for users with all types of vision impairments, including low vision, total color blindness (Achromatopsia), and various forms of Dichromacy (Protanopia, Deuteranopia, Tritanopia). Strictly adhere to the following principles: 1. WCAG Compliance: Ensure foreground-to-background contrast ratios meet or exceed WCAG 2.1 AAA standards (7:1 for normal text, 4.5:1 for large text). 2. Chromatic Distinction: Select colors that remain distinct from one another even when viewed in grayscale or through color-blindness simulators. Avoid relying solely on hue to convey meaning. 3. Anti-Vibration: Avoid high-saturation pairings (like pure red and pure blue) that cause visual "vibration" and eye strain. 4. Semantic Clarity: If providing a functional palette, ensure "Success", "Error", and "Warning" variants are accessible and distinct for color-blind users. 5. Inclusive Aesthetics: Prove that accessible design can be vibrant and modern. Return ONLY a JSON array of 5 hex codes.',
    model: 'gemini-3.1-pro-preview',
    temperature: 0.3,
    topP: 0.8,
    topK: 20,
  }
];

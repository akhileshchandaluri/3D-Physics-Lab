export interface CustomShadows {
  soft: string;
  medium: string;
  floating: string;
  glow: string;
  glass: string;
}

export const lightShadows: CustomShadows = {
  soft: '0 1px 2px rgba(0, 0, 0, 0.05)',
  medium: '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
  floating: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.05)',
  glow: '0 0 40px rgba(99, 102, 241, 0.12)',
  glass: '0 8px 32px 0 rgba(31, 38, 135, 0.037)',
};

export const darkShadows: CustomShadows = {
  soft: '0 1px 2px rgba(0, 0, 0, 0.3)',
  medium: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.3)',
  floating: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
  glow: '0 0 40px rgba(99, 102, 241, 0.25)',
  glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
};

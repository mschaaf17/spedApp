// Material Design 3 Theme Configuration
export const m3Theme = {
  // Color System
  colors: {
    // Primary colors
    primary: {
      0: '#000000',
      10: '#001F24',
      20: '#003640',
      30: '#004E5D',
      40: '#006782',
      50: '#0082A3',
      60: '#009EC5',
      70: '#4FB8E8',
      80: '#8DD4F8',
      90: '#C8E8FF',
      95: '#E4F3FF',
      99: '#FDFCFF',
      100: '#FFFFFF'
    },
    
    // Secondary colors
    secondary: {
      0: '#000000',
      10: '#1A1C00',
      20: '#2F3100',
      30: '#454700',
      40: '#5C5F00',
      50: '#747700',
      60: '#8E9100',
      70: '#A8AC00',
      80: '#C3C700',
      90: '#DFE300',
      95: '#EDF100',
      99: '#FDFCFF',
      100: '#FFFFFF'
    },
    
    // Tertiary colors
    tertiary: {
      0: '#000000',
      10: '#2B1700',
      20: '#422B00',
      30: '#5B4100',
      40: '#755800',
      50: '#8F7000',
      60: '#AA8900',
      70: '#C6A300',
      80: '#E2BE00',
      90: '#FFD95A',
      95: '#FFEDB8',
      99: '#FDFCFF',
      100: '#FFFFFF'
    },
    
    // Error colors
    error: {
      0: '#000000',
      10: '#410002',
      20: '#690005',
      30: '#93000A',
      40: '#BA1A1A',
      50: '#DE3730',
      60: '#FF5449',
      70: '#FF897D',
      80: '#FFB4AB',
      90: '#FFDAD6',
      95: '#FFEDEA',
      99: '#FDFCFF',
      100: '#FFFFFF'
    },
    
    // Neutral colors
    neutral: {
      0: '#000000',
      10: '#191C20',
      20: '#2E3132',
      30: '#444748',
      40: '#5C5F60',
      50: '#757779',
      60: '#8E9192',
      70: '#A9ABAC',
      80: '#C4C7C8',
      90: '#E0E3E3',
      95: '#EFF1F1',
      99: '#FDFCFF',
      100: '#FFFFFF'
    },
    
    // Neutral variant
    neutralVariant: {
      0: '#000000',
      10: '#151D20',
      20: '#2A3235',
      30: '#40484B',
      40: '#586063',
      50: '#71797C',
      60: '#8B9396',
      70: '#A6AEB1',
      80: '#C2CACC',
      90: '#DEE6E9',
      95: '#ECF4F7',
      99: '#FDFCFF',
      100: '#FFFFFF'
    }
  },
  
  // Typography
  typography: {
    displayLarge: {
      fontSize: '57px',
      lineHeight: '64px',
      fontWeight: 400,
      letterSpacing: '-0.25px'
    },
    displayMedium: {
      fontSize: '45px',
      lineHeight: '52px',
      fontWeight: 400,
      letterSpacing: '0px'
    },
    displaySmall: {
      fontSize: '36px',
      lineHeight: '44px',
      fontWeight: 400,
      letterSpacing: '0px'
    },
    headlineLarge: {
      fontSize: '32px',
      lineHeight: '40px',
      fontWeight: 400,
      letterSpacing: '0px'
    },
    headlineMedium: {
      fontSize: '28px',
      lineHeight: '36px',
      fontWeight: 400,
      letterSpacing: '0px'
    },
    headlineSmall: {
      fontSize: '24px',
      lineHeight: '32px',
      fontWeight: 400,
      letterSpacing: '0px'
    },
    titleLarge: {
      fontSize: '22px',
      lineHeight: '28px',
      fontWeight: 400,
      letterSpacing: '0px'
    },
    titleMedium: {
      fontSize: '16px',
      lineHeight: '24px',
      fontWeight: 500,
      letterSpacing: '0.15px'
    },
    titleSmall: {
      fontSize: '14px',
      lineHeight: '20px',
      fontWeight: 500,
      letterSpacing: '0.1px'
    },
    labelLarge: {
      fontSize: '14px',
      lineHeight: '20px',
      fontWeight: 500,
      letterSpacing: '0.1px'
    },
    labelMedium: {
      fontSize: '12px',
      lineHeight: '16px',
      fontWeight: 500,
      letterSpacing: '0.5px'
    },
    labelSmall: {
      fontSize: '11px',
      lineHeight: '16px',
      fontWeight: 500,
      letterSpacing: '0.5px'
    },
    bodyLarge: {
      fontSize: '16px',
      lineHeight: '24px',
      fontWeight: 400,
      letterSpacing: '0.5px'
    },
    bodyMedium: {
      fontSize: '14px',
      lineHeight: '20px',
      fontWeight: 400,
      letterSpacing: '0.25px'
    },
    bodySmall: {
      fontSize: '12px',
      lineHeight: '16px',
      fontWeight: 400,
      letterSpacing: '0.4px'
    }
  },
  
  // Spacing
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
    xxxl: '64px'
  },
  
  // Elevation (shadows)
  elevation: {
    level0: 'none',
    level1: '0px 1px 3px 1px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.30)',
    level2: '0px 2px 6px 2px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.30)',
    level3: '0px 4px 8px 3px rgba(0, 0, 0, 0.15), 0px 1px 3px 0px rgba(0, 0, 0, 0.30)',
    level4: '0px 6px 10px 4px rgba(0, 0, 0, 0.15), 0px 2px 4px 0px rgba(0, 0, 0, 0.30)',
    level5: '0px 8px 12px 6px rgba(0, 0, 0, 0.15), 0px 4px 6px 0px rgba(0, 0, 0, 0.30)'
  },
  
  // Border radius
  borderRadius: {
    none: '0px',
    extraSmall: '4px',
    small: '8px',
    medium: '12px',
    large: '16px',
    extraLarge: '28px',
    full: '9999px'
  }
};

// Helper functions for theme usage
export const getColor = (colorName, shade = 50) => {
  return m3Theme.colors[colorName]?.[shade] || m3Theme.colors.neutral[shade];
};

export const getTypography = (variant) => {
  return m3Theme.typography[variant] || m3Theme.typography.bodyMedium;
};

export const getSpacing = (size) => {
  return m3Theme.spacing[size] || m3Theme.spacing.md;
};

export const getElevation = (level) => {
  return m3Theme.elevation[`level${level}`] || m3Theme.elevation.level0;
};

export const getBorderRadius = (size) => {
  return m3Theme.borderRadius[size] || m3Theme.borderRadius.medium;
}; 
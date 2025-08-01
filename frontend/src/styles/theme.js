// Uber-inspired dark theme configuration
export const theme = {
  colors: {
    // Dark theme base colors
    background: {
      primary: '#0a0a0a',      // Almost black
      secondary: '#121212',     // Dark gray
      tertiary: '#1a1a1a',     // Lighter dark
      surface: '#2d2d2d',      // Surface elements
      elevated: '#333333',     // Elevated surfaces
    },
    
    // Text colors
    text: {
      primary: '#ffffff',       // Pure white
      secondary: '#b3b3b3',     // Light gray
      tertiary: '#8a8a8a',      // Medium gray
      disabled: '#666666',      // Disabled text
      inverse: '#000000',       // Black text on light backgrounds
    },
    
    // Brand colors (Uber-inspired)
    brand: {
      primary: '#00d4aa',       // Uber green
      secondary: '#1fbad3',     // Cyan
      accent: '#ff9100',        // Orange accent
      warning: '#ffab00',       // Warning yellow
      error: '#ff5252',         // Error red
      success: '#4caf50',       // Success green
    },
    
    // Interactive elements
    interactive: {
      hover: '#404040',         // Hover state
      active: '#505050',        // Active state
      focus: '#00d4aa',         // Focus outline
      border: '#404040',        // Default borders
      borderLight: '#2d2d2d',   // Light borders
    },
    
    // Status colors
    status: {
      pending: '#ffab00',
      running: '#1fbad3',
      completed: '#4caf50',
      failed: '#ff5252',
      cancelled: '#8a8a8a',
    },
    
    // Node type colors
    nodeTypes: {
      input: '#00d4aa',
      script: '#1fbad3',
      logic: '#9c27b0',
      output: '#ff5722',
    }
  },
  
  // Typography
  typography: {
    fontFamily: {
      primary: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      mono: '"JetBrains Mono", "Fira Code", "Monaco", "Consolas", monospace',
    },
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '32px',
      '4xl': '40px',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    }
  },
  
  // Spacing
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
  },
  
  // Border radius
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },
  
  // Shadows
  shadows: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px rgba(0, 0, 0, 0.3)',
    lg: '0 10px 25px rgba(0, 0, 0, 0.4)',
    xl: '0 25px 50px rgba(0, 0, 0, 0.5)',
  },
  
  // Z-index
  zIndex: {
    dropdown: 1000,
    modal: 1100,
    overlay: 1200,
    tooltip: 1300,
  },
  
  // Transitions
  transitions: {
    fast: '150ms ease-in-out',
    normal: '250ms ease-in-out',
    slow: '350ms ease-in-out',
  }
};

export default theme;
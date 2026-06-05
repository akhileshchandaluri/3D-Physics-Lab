
export const getComponentOverrides = (themeMode: 'light' | 'dark') => {
  const isDark = themeMode === 'dark';

  return {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '8px 18px',
          fontWeight: 600,
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          textTransform: 'none' as const,
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: isDark 
              ? '0 4px 12px rgba(99, 102, 241, 0.25)' 
              : '0 4px 12px rgba(99, 102, 241, 0.15)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
          color: '#ffffff',
          border: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: isDark 
            ? '1px solid rgba(255, 255, 255, 0.08)' 
            : '1px solid rgba(0, 0, 0, 0.06)',
          backgroundColor: isDark 
            ? 'rgba(20, 20, 40, 0.6)' 
            : 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(16px)',
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundImage: 'none',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            backgroundColor: isDark 
              ? 'rgba(255, 255, 255, 0.03)' 
              : 'rgba(0, 0, 0, 0.02)',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              backgroundColor: isDark 
                ? 'rgba(255, 255, 255, 0.05)' 
                : 'rgba(0, 0, 0, 0.03)',
            },
            '&.Mui-focused': {
              backgroundColor: isDark 
                ? 'rgba(255, 255, 255, 0.01)' 
                : 'rgba(255, 255, 255, 1)',
            },
          },
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          height: 6,
          color: '#6366f1',
        },
        thumb: {
          height: 18,
          width: 18,
          backgroundColor: '#fff',
          border: '3px solid currentColor',
          '&:hover, &.Mui-focusVisible': {
            boxShadow: '0px 0px 0px 8px rgba(99, 102, 241, 0.16)',
          },
          '&.Mui-active': {
            boxShadow: '0px 0px 0px 14px rgba(99, 102, 241, 0.24)',
          },
        },
        rail: {
          opacity: 0.28,
          backgroundColor: '#9ca3af',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
          borderRadius: '3px 3px 0 0',
          backgroundColor: '#6366f1',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none' as const,
          fontWeight: 600,
          fontSize: '0.9rem',
          minWidth: 100,
          transition: 'all 0.2s ease-in-out',
        },
      },
    },
  };
};

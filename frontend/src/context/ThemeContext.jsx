import { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Get initial mode from localStorage or default to 'light'
  const [mode, setMode] = useState(() => {
    const savedMode = localStorage.getItem('themeMode');
    return savedMode || 'light';
  });

  // Save to localStorage whenever mode changes
  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  const toggleColorMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          ...(mode === 'light'
            ? {
                // Light mode - Professional corporate colors
                primary: {
                  main: '#1976d2', // Professional Blue
                  light: '#42a5f5',
                  dark: '#1565c0',
                  contrastText: '#ffffff',
                },
                secondary: {
                  main: '#00897b', // Teal
                  light: '#4db6ac',
                  dark: '#00695c',
                  contrastText: '#ffffff',
                },
                success: {
                  main: '#43a047', // Green
                  light: '#66bb6a',
                  dark: '#2e7d32',
                },
                warning: {
                  main: '#fb8c00', // Orange
                  light: '#ffa726',
                  dark: '#f57c00',
                },
                error: {
                  main: '#e53935', // Red
                  light: '#ef5350',
                  dark: '#c62828',
                },
                info: {
                  main: '#039be5', // Light Blue
                  light: '#29b6f6',
                  dark: '#0277bd',
                },
                background: {
                  default: '#f5f7fa',
                  paper: '#ffffff',
                },
                text: {
                  primary: '#263238',
                  secondary: '#546e7a',
                },
              }
            : {
                // Dark mode - Professional corporate colors
                primary: {
                  main: '#42a5f5',
                  light: '#64b5f6',
                  dark: '#1976d2',
                  contrastText: '#000000',
                },
                secondary: {
                  main: '#26a69a',
                  light: '#4db6ac',
                  dark: '#00897b',
                  contrastText: '#000000',
                },
                success: {
                  main: '#66bb6a',
                  light: '#81c784',
                  dark: '#43a047',
                },
                warning: {
                  main: '#ffa726',
                  light: '#ffb74d',
                  dark: '#fb8c00',
                },
                error: {
                  main: '#ef5350',
                  light: '#e57373',
                  dark: '#e53935',
                },
                info: {
                  main: '#29b6f6',
                  light: '#4fc3f7',
                  dark: '#039be5',
                },
                background: {
                  default: '#0f1419',
                  paper: '#1a2027',
                },
                text: {
                  primary: '#ffffff',
                  secondary: '#b0bec5',
                },
              }),
        },
        typography: {
          fontFamily: [
            '-apple-system',
            'BlinkMacSystemFont',
            '"Segoe UI"',
            'Roboto',
            '"Helvetica Neue"',
            'Arial',
            'sans-serif',
          ].join(','),
          h1: {
            fontWeight: 700,
          },
          h2: {
            fontWeight: 700,
          },
          h3: {
            fontWeight: 700,
          },
          h4: {
            fontWeight: 600,
          },
          h5: {
            fontWeight: 600,
          },
          h6: {
            fontWeight: 600,
          },
          button: {
            fontWeight: 600,
            letterSpacing: '0.5px',
          },
        },
        shape: {
          borderRadius: 8,
        },
        shadows: [
          'none',
          '0px 2px 4px rgba(0,0,0,0.05)',
          '0px 4px 8px rgba(0,0,0,0.08)',
          '0px 6px 12px rgba(0,0,0,0.10)',
          '0px 8px 16px rgba(0,0,0,0.12)',
          '0px 10px 20px rgba(0,0,0,0.14)',
          ...Array(19).fill('0px 10px 20px rgba(0,0,0,0.14)'),
        ],
        components: {
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                boxShadow: mode === 'light' 
                  ? '0px 2px 8px rgba(0,0,0,0.08)'
                  : '0px 2px 8px rgba(0,0,0,0.24)',
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                textTransform: 'none',
                fontWeight: 600,
                padding: '8px 20px',
              },
              contained: {
                boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
                '&:hover': {
                  boxShadow: '0px 4px 8px rgba(0,0,0,0.15)',
                },
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                fontWeight: 500,
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                borderRadius: 12,
              },
              elevation1: {
                boxShadow: mode === 'light'
                  ? '0px 2px 4px rgba(0,0,0,0.05)'
                  : '0px 2px 4px rgba(0,0,0,0.2)',
              },
            },
          },
          MuiTableCell: {
            styleOverrides: {
              head: {
                fontWeight: 600,
                backgroundColor: mode === 'light' ? '#f5f7fa' : '#1a2027',
              },
            },
          },
        },
      }),
    [mode]
  );

  const value = useMemo(
    () => ({
      mode,
      toggleColorMode,
    }),
    [mode]
  );

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};


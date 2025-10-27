import { createTheme } from '@mui/material/styles';
import createCache from '@emotion/cache';
import rtlPlugin from 'stylis-plugin-rtl';
import { prefixer } from 'stylis';

// Configuration du cache RTL pour Emotion
export const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
});

// Configuration du cache LTR pour Emotion
export const cacheLtr = createCache({
  key: 'muiltr',
  stylisPlugins: [prefixer],
});

// Thème RTL
export const rtlTheme = createTheme({
  direction: 'rtl',
  // Personnalisation des couleurs pour correspondre au design existant
  palette: {
    primary: {
      main: 'rgb(14, 102, 129)',
      light: 'rgb(36, 124, 149)',
    },
  },
  components: {
    // Personnalisation du Stepper pour correspondre au style existant
    MuiStepConnector: {
      styleOverrides: {
        line: {
          borderColor: 'rgb(229, 231, 235)', // gray-200 for light mode
          borderTopWidth: 2,
          '.Mui-completed &, .Mui-active &': {
            borderColor: 'rgb(14, 102, 129)',
          },
          // Dark mode support
          '@media (prefers-color-scheme: dark)': {
            borderColor: 'rgb(107, 114, 128)', // gray-500 for better dark mode visibility
            '.Mui-completed &, .Mui-active &': {
              borderColor: 'rgb(128, 213, 212)', // lighter teal for dark mode
            },
          },
        },
      },
    },
    MuiStepIcon: {
      styleOverrides: {
        root: {
          width: 40,
          height: 40,
          color: 'rgb(156, 163, 175)', // gray-400 for inactive state
          '&.Mui-completed': {
            color: 'rgb(14, 102, 129)',
          },
          '&.Mui-active': {
            color: 'rgb(14, 102, 129)',
          },
          // Dark mode support
          '@media (prefers-color-scheme: dark)': {
            color: 'rgb(107, 114, 128)', // gray-500 for inactive state in dark mode
            '&.Mui-completed': {
              color: 'rgb(128, 213, 212)', // lighter teal for dark mode
            },
            '&.Mui-active': {
              color: 'rgb(128, 213, 212)', // lighter teal for dark mode
            },
          },
        },
        text: {
          fontSize: '0.75rem',
          fontWeight: 600,
          fill: '#ffffff', // White text for better contrast
          // Dark mode support
          '@media (prefers-color-scheme: dark)': {
            fill: '#1f2937', // dark text on light background for better contrast
          },
        },
      },
    },
    MuiStepLabel: {
      styleOverrides: {
        label: {
          fontSize: '0.875rem',
          fontWeight: 500,
          color: 'rgb(107, 114, 128)', // gray-500 for inactive labels
          '&.Mui-active': {
            color: 'rgb(14, 102, 129)',
          },
          '&.Mui-completed': {
            color: 'rgb(14, 102, 129)',
          },
          // Dark mode support
          '@media (prefers-color-scheme: dark)': {
            color: 'rgb(156, 163, 175)', // gray-400 for inactive labels in dark mode
            '&.Mui-active': {
              color: 'rgb(128, 213, 212)', // lighter teal for dark mode
            },
            '&.Mui-completed': {
              color: 'rgb(128, 213, 212)', // lighter teal for dark mode
            },
          },
        },
      },
    },
  },
});

// Thème LTR
export const ltrTheme = createTheme({
  direction: 'ltr',
  // Même personnalisation que RTL mais pour LTR
  palette: {
    primary: {
      main: 'rgb(14, 102, 129)',
      light: 'rgb(36, 124, 149)',
    },
  },
  components: {
    MuiStepConnector: {
      styleOverrides: {
        line: {
          borderColor: 'rgb(229, 231, 235)', // gray-200 for light mode
          borderTopWidth: 2,
          '.Mui-completed &, .Mui-active &': {
            borderColor: 'rgb(14, 102, 129)',
          },
          // Dark mode support
          '@media (prefers-color-scheme: dark)': {
            borderColor: 'rgb(107, 114, 128)', // gray-500 for better dark mode visibility
            '.Mui-completed &, .Mui-active &': {
              borderColor: 'rgb(128, 213, 212)', // lighter teal for dark mode
            },
          },
        },
      },
    },
    MuiStepIcon: {
      styleOverrides: {
        root: {
          width: 40,
          height: 40,
          color: 'rgb(156, 163, 175)', // gray-400 for inactive state
          '&.Mui-completed': {
            color: 'rgb(14, 102, 129)',
          },
          '&.Mui-active': {
            color: 'rgb(14, 102, 129)',
          },
          // Dark mode support
          '@media (prefers-color-scheme: dark)': {
            color: 'rgb(107, 114, 128)', // gray-500 for inactive state in dark mode
            '&.Mui-completed': {
              color: 'rgb(128, 213, 212)', // lighter teal for dark mode
            },
            '&.Mui-active': {
              color: 'rgb(128, 213, 212)', // lighter teal for dark mode
            },
          },
        },
        text: {
          fontSize: '0.75rem',
          fontWeight: 600,
          fill: '#ffffff', // White text for better contrast
          // Dark mode support
          '@media (prefers-color-scheme: dark)': {
            fill: '#1f2937', // dark text on light background for better contrast
          },
        },
      },
    },
    MuiStepLabel: {
      styleOverrides: {
        label: {
          fontSize: '0.875rem',
          fontWeight: 500,
          color: 'rgb(107, 114, 128)', // gray-500 for inactive labels
          '&.Mui-active': {
            color: 'rgb(14, 102, 129)',
          },
          '&.Mui-completed': {
            color: 'rgb(14, 102, 129)',
          },
          // Dark mode support
          '@media (prefers-color-scheme: dark)': {
            color: 'rgb(156, 163, 175)', // gray-400 for inactive labels in dark mode
            '&.Mui-active': {
              color: 'rgb(128, 213, 212)', // lighter teal for dark mode
            },
            '&.Mui-completed': {
              color: 'rgb(128, 213, 212)', // lighter teal for dark mode
            },
          },
        },
      },
    },
  },
});
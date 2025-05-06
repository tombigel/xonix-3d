import { createContext, useContext, useState, ReactNode } from 'react';
import * as THREE from 'three';
import { CellState } from '../utils/ClassicGameTypes';

// Define a theme configuration type
export interface ThemeConfig {
  name: string;
  cellMaterials: {
    [CellState.UNCAPTURED]: THREE.MeshStandardMaterial;
    [CellState.CAPTURED]: THREE.MeshStandardMaterial;
    [CellState.TRAIL]: THREE.MeshStandardMaterial;
  };
  playerMaterial: THREE.MeshStandardMaterial;
  enemyMaterial: THREE.MeshStandardMaterial;
  gridMaterial: THREE.LineBasicMaterial;
  environmentPreset:
    | 'sunset'
    | 'dawn'
    | 'night'
    | 'warehouse'
    | 'forest'
    | 'apartment'
    | 'studio'
    | 'city'
    | 'park'
    | 'lobby';
  lightIntensity: {
    ambient: number;
    directional: number;
  };
  uiColors: {
    text: string;
    textShadow?: string;
    buttonBackground?: string;
    buttonText?: string;
    buttonBorder?: string;
    buttonShadow?: string;
  };
}

// Define the theme context type
interface ThemeContextType {
  currentTheme: ThemeConfig;
  themeIndex: number;
  cycleTheme: () => void;
  setCustomTheme: (theme: ThemeConfig) => void;
}

// Create the context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Define some default themes
const defaultThemes: ThemeConfig[] = [
  // Standard theme
  {
    name: 'Standard',
    cellMaterials: {
      [CellState.UNCAPTURED]: new THREE.MeshStandardMaterial({
        color: 0x000000,
        roughness: 0.7,
      }),
      [CellState.CAPTURED]: new THREE.MeshStandardMaterial({
        color: 0x00aaaa,
        roughness: 0.5,
      }),
      [CellState.TRAIL]: new THREE.MeshStandardMaterial({
        color: 0xff00ff,
        roughness: 0.3,
        emissive: 0x550055,
      }),
    },
    playerMaterial: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
    }),
    enemyMaterial: new THREE.MeshStandardMaterial({
      color: 0xff0000,
      roughness: 0.5,
    }),
    gridMaterial: new THREE.LineBasicMaterial({
      color: 0x444444,
    }),
    environmentPreset: 'city',
    lightIntensity: {
      ambient: 0.5,
      directional: 1.0,
    },
    uiColors: {
      text: 'white',
    },
  },
  // Tron theme
  {
    name: 'Tron',
    cellMaterials: {
      [CellState.UNCAPTURED]: new THREE.MeshStandardMaterial({
        color: 0x000000,
        emissive: 0x000000,
        roughness: 0.0,
        metalness: 1.0,
      }),
      [CellState.CAPTURED]: new THREE.MeshStandardMaterial({
        color: 0x0088ff,
        emissive: 0x0066cc,
        roughness: 0.2,
        metalness: 0.8,
        envMapIntensity: 2.0,
      }),
      [CellState.TRAIL]: new THREE.MeshStandardMaterial({
        color: 0xff00ff,
        emissive: 0xcc00cc,
        roughness: 0.0,
        metalness: 0.9,
        envMapIntensity: 3.0,
      }),
    },
    playerMaterial: new THREE.MeshStandardMaterial({
      color: 0xffff00,
      emissive: 0xffaa00,
      roughness: 0.0,
      metalness: 0.9,
      envMapIntensity: 3.0,
    }),
    enemyMaterial: new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xcc0000,
      roughness: 0.0,
      metalness: 0.9,
      envMapIntensity: 3.0,
    }),
    gridMaterial: new THREE.LineBasicMaterial({
      color: 0x0066cc,
      opacity: 0.3,
      transparent: true,
    }),
    environmentPreset: 'night',
    lightIntensity: {
      ambient: 0.2,
      directional: 0.7,
    },
    uiColors: {
      text: '#00FFFF',
      textShadow: '0 0 5px #00AAFF',
      buttonBackground: '#003366',
      buttonText: '#00FFFF',
      buttonBorder: '1px solid #0088FF',
      buttonShadow: '0 0 10px #0066CC',
    },
  },
  // Retro theme
  {
    name: 'Retro',
    cellMaterials: {
      [CellState.UNCAPTURED]: new THREE.MeshStandardMaterial({
        color: 0x222222,
        roughness: 0.5,
      }),
      [CellState.CAPTURED]: new THREE.MeshStandardMaterial({
        color: 0x22aa22,
        roughness: 0.5,
        emissive: 0x115511,
      }),
      [CellState.TRAIL]: new THREE.MeshStandardMaterial({
        color: 0xaaaa00,
        roughness: 0.3,
        emissive: 0x555500,
      }),
    },
    playerMaterial: new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      emissive: 0x00aa00,
      roughness: 0.3,
    }),
    enemyMaterial: new THREE.MeshStandardMaterial({
      color: 0xaaaa22,
      emissive: 0x555511,
      roughness: 0.5,
    }),
    gridMaterial: new THREE.LineBasicMaterial({
      color: 0x00aa00,
      opacity: 0.5,
      transparent: true,
    }),
    environmentPreset: 'city',
    lightIntensity: {
      ambient: 0.3,
      directional: 0.8,
    },
    uiColors: {
      text: '#22FF22',
      textShadow: '0 0 5px #115511',
      buttonBackground: '#115511',
      buttonText: '#AAFFAA',
      buttonBorder: '1px solid #22CC22',
      buttonShadow: '0 0 10px #115511',
    },
  },
];

// Create the provider component
export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [themeIndex, setThemeIndex] = useState(0);
  const [themes, setThemes] = useState(defaultThemes);

  // Function to cycle through themes
  const cycleTheme = () => {
    setThemeIndex((prevIndex) => (prevIndex + 1) % themes.length);
  };

  // Function to set a custom theme
  const setCustomTheme = (customTheme: ThemeConfig) => {
    const existingThemeIndex = themes.findIndex((theme) => theme.name === customTheme.name);

    if (existingThemeIndex >= 0) {
      // Update existing theme
      const newThemes = [...themes];
      newThemes[existingThemeIndex] = customTheme;
      setThemes(newThemes);
      setThemeIndex(existingThemeIndex);
    } else {
      // Add new theme
      setThemes([...themes, customTheme]);
      setThemeIndex(themes.length);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        currentTheme: themes[themeIndex],
        themeIndex,
        cycleTheme,
        setCustomTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

// Hook to use the theme context
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

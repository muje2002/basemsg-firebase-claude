/**
 * Always returns 'light' to enforce pastel-toned UI as per design spec.
 * The app uses bright pastel colors throughout all components.
 */
export function useColorScheme(): 'light' | 'dark' {
  return 'light';
}

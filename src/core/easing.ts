// Curvas de easing, en módulo neutral (sin deps) para reusar en humanoide y rig.

export type EasingKind = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';

// Aplica la curva de easing a un factor lineal k (0..1).
export const applyEasing = (k: number, easing: EasingKind | undefined): number => {
  switch (easing) {
    case 'easeIn':
      return k * k;
    case 'easeOut':
      return 1 - (1 - k) * (1 - k);
    case 'easeInOut':
      return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    default:
      return k;
  }
};

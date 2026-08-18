import { useProjectStore } from '@store/useProjectStore';
import type { AnimationClip } from '@core/poses';

// Devuelve el clip activo (o undefined si no hay). Referencia estable entre renders.
export const useActiveClip = (): AnimationClip | undefined =>
  useProjectStore((s) => s.project.animations.find((c) => c.id === s.activeAnimationId));

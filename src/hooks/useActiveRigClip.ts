import { useProjectStore } from '@store/useProjectStore';
import type { RigClip } from '@core/customRig';

// Clip de animación activo del rig personalizado (o undefined).
export const useActiveRigClip = (): RigClip | undefined =>
  useProjectStore((s) => s.project.customRig.animations.find((c) => c.id === s.activeRigClipId));

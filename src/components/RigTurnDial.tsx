import type { ReactElement } from 'react';
import { useProjectStore } from '@store/useProjectStore';
import { Dial } from '@components/Dial';

// Giro 3D del rig sobre su eje vertical (mismo escorzo que el humanoide, en grados).
// Exportar "las 8 direcciones" genera _d0.._d7.
export const RigTurnDial = (): ReactElement => {
  const facing = useProjectStore((s) => s.project.render.facing);
  const setFacing = useProjectStore((s) => s.setFacing);
  return <Dial label="Giro 3D (dirección)" value={facing} onChange={setFacing} resetTitle="De frente (0°)" />;
};

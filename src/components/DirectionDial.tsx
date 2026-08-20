import type { ReactElement } from 'react';
import { useProjectStore } from '@store/useProjectStore';
import { Dial } from '@components/Dial';

// Giro 3D en 8 direcciones (facing): abajo = de frente (0), derecha = perfil (90),
// arriba = de espaldas (180), izquierda = perfil (270), sentido horario.
export const DirectionDial = (): ReactElement => {
  const facing = useProjectStore((s) => s.project.render.facing);
  const setFacing = useProjectStore((s) => s.setFacing);
  return <Dial label="Giro 3D (dirección)" value={facing} onChange={setFacing} resetTitle="De frente (0°)" />;
};

import type { ReactElement } from 'react';
import { useProjectStore } from '@store/useProjectStore';
import { Dial } from '@components/Dial';

// Giro del rig en el plano (top-down). Mismo dial que el humanoide, en grados.
// Exportar "las 8 direcciones" genera _d0.._d7.
export const RigTurnDial = (): ReactElement => {
  const rotation = useProjectStore((s) => s.project.render.rotation);
  const setRenderField = useProjectStore((s) => s.setRenderField);
  return (
    <Dial
      label="Giro (rotación)"
      value={rotation}
      onChange={(deg) => setRenderField('rotation', deg)}
      resetTitle="Sin giro (0°)"
    />
  );
};

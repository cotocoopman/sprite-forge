import type { ReactElement } from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Slider from '@mui/material/Slider';
import Button from '@mui/material/Button';
import { useProjectStore } from '@store/useProjectStore';
import { NumberInput } from '@components/NumberInput';
import { useT } from '@/i18n';

// Giro del rig en el plano (útil para top-down). El export "8 direcciones"
// genera _d0.._d7 rotando 45° cada uno.
export const RigRotationControl = (): ReactElement => {
  const rotation = useProjectStore((s) => s.project.render.rotation);
  const setRenderField = useProjectStore((s) => s.setRenderField);
  const t = useT();

  return (
    <Stack spacing={1}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="subtitle2">{t('Giro (rotación)')}</Typography>
        <NumberInput
          value={rotation}
          step={45}
          onChange={(v) => setRenderField('rotation', ((v % 360) + 360) % 360)}
          inputStyle={{ width: 64, padding: '2px 6px' }}
        />
      </Stack>
      <Slider
        size="small"
        value={rotation}
        min={0}
        max={360}
        step={1}
        marks={[0, 45, 90, 135, 180, 225, 270, 315].map((v) => ({ value: v }))}
        onChange={(_, v) => setRenderField('rotation', v as number)}
      />
      <Stack direction="row" spacing={1}>
        <Button size="small" variant="outlined" fullWidth onClick={() => setRenderField('rotation', (rotation + 45) % 360)}>
          {t('Girar 45°')}
        </Button>
        <Button size="small" variant="text" onClick={() => setRenderField('rotation', 0)}>
          {t('Reset')}
        </Button>
      </Stack>
      <Typography variant="caption" color="text.secondary">
        {t('Exportá "las 8 direcciones" para generar _d0.._d7 automáticamente.')}
      </Typography>
    </Stack>
  );
};

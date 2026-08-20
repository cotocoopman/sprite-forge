import type { ReactElement } from 'react';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useProjectStore } from '@store/useProjectStore';
import { ColorField } from '@components/ColorField';
import { SectionAccordion } from '@components/SectionAccordion';
import { useT } from '@/i18n';
import { PART_NAMES, PART_LABELS } from '@core/rig';
import type { PartName } from '@core/rig';

const PartRow = ({ part }: { part: PartName }): ReactElement => {
  const style = useProjectStore((s) => s.project.parts[part]);
  const baseColor = useProjectStore((s) => s.project.character.color);
  const togglePartVisible = useProjectStore((s) => s.togglePartVisible);
  const setPartColor = useProjectStore((s) => s.setPartColor);
  const resetPartColor = useProjectStore((s) => s.resetPartColor);
  const t = useT();

  const custom = style.color !== null;

  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <Tooltip title={style.visible ? t('Ocultar (no se exporta)') : t('Mostrar')}>
        <IconButton size="small" onClick={() => togglePartVisible(part)}>
          {style.visible ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
        </IconButton>
      </Tooltip>

      <Typography
        variant="body2"
        sx={{ flexGrow: 1, opacity: style.visible ? 1 : 0.5 }}
      >
        {t(PART_LABELS[part])}
      </Typography>

      <ColorField
        value={style.color ?? baseColor}
        onChange={(v) => setPartColor(part, v)}
        onReset={() => resetPartColor(part)}
        canReset={custom}
      />
    </Stack>
  );
};

export const PartsPanel = (): ReactElement => {
  const t = useT();
  return (
    <SectionAccordion title="Partes">
      <Stack spacing={1}>
        <Typography variant="caption" color="text.secondary">
          {t('Ocultá partes (grisáceas acá, excluidas del export) o pintalas por separado.')}
        </Typography>
        <Box>
          {PART_NAMES.map((p) => (
            <PartRow key={p} part={p} />
          ))}
        </Box>
      </Stack>
    </SectionAccordion>
  );
};

import type { ReactElement } from 'react';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import ButtonBase from '@mui/material/ButtonBase';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CasinoIcon from '@mui/icons-material/Casino';
import { useProjectStore } from '@store/useProjectStore';
import { CHARACTER_TEMPLATES } from '@core/templates';
import { RIG_TEMPLATES } from '@core/customRig';
import { WEAPON_RIG_TEMPLATES } from '@core/weaponRigs';
import { SectionAccordion } from '@components/SectionAccordion';
import { useT } from '@/i18n';

type Item = { readonly id: string; readonly name: string; readonly emoji: string; readonly apply: () => void };

const ItemGrid = ({ items }: { items: readonly Item[] }): ReactElement => (
  <Box
    sx={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))',
      gap: 1,
    }}
  >
    {items.map((it) => (
      <ButtonBase
        key={it.id}
        onClick={it.apply}
        focusRipple
        sx={{
          flexDirection: 'column',
          gap: 0.25,
          p: 1,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          transition: 'all .15s',
          '&:hover': { borderColor: 'primary.main', transform: 'translateY(-2px)' },
        }}
      >
        <Box sx={{ fontSize: 30, lineHeight: 1 }}>{it.emoji}</Box>
        <Typography variant="caption" sx={{ fontWeight: 600, textAlign: 'center' }}>
          {it.name}
        </Typography>
      </ButtonBase>
    ))}
  </Box>
);

export const TemplateGallery = (): ReactElement => {
  const mode = useProjectStore((s) => s.project.mode);
  const applyHumanoidTemplate = useProjectStore((s) => s.applyHumanoidTemplate);
  const loadRigPreset = useProjectStore((s) => s.loadRigPreset);
  const randomizeCharacter = useProjectStore((s) => s.randomizeCharacter);
  const notify = useProjectStore((s) => s.notify);
  const t = useT();

  const rigItem = (r: (typeof RIG_TEMPLATES)[number]): Item => ({
    id: r.id,
    name: r.name,
    emoji: r.emoji,
    apply: () => {
      loadRigPreset(r.build());
      notify('Plantilla aplicada', 'success');
    },
  });

  const creatureItems: readonly Item[] = RIG_TEMPLATES.map(rigItem);
  const weaponItems: readonly Item[] = WEAPON_RIG_TEMPLATES.map(rigItem);
  const characterItems: readonly Item[] = CHARACTER_TEMPLATES.map((c) => ({
    id: c.id,
    name: c.name,
    emoji: c.emoji,
    apply: () => applyHumanoidTemplate(c.id),
  }));

  return (
    <SectionAccordion title="Plantillas" defaultExpanded icon={<AutoAwesomeIcon fontSize="small" color="secondary" />}>
    <Stack spacing={1.25}>
      <Typography variant="caption" color="text.secondary">
        {t('Elegí una plantilla como punto de partida. Después ajustá todo a gusto.')}
      </Typography>

      {mode !== 'custom' && (
        <Button variant="contained" color="primary" startIcon={<CasinoIcon />} onClick={randomizeCharacter}>
          {t('Personaje aleatorio')}
        </Button>
      )}

      {mode === 'custom' ? (
        <>
          <ItemGrid items={creatureItems} />
          <Typography variant="subtitle2" sx={{ mt: 0.5 }}>{t('Armas / props')}</Typography>
          <Typography variant="caption" color="text.secondary">
            {t('Las mismas armas del humanoide, como rig suelto para crear/animar/exportar por separado.')}
          </Typography>
          <ItemGrid items={weaponItems} />
        </>
      ) : (
        <ItemGrid items={characterItems} />
      )}
    </Stack>
    </SectionAccordion>
  );
};

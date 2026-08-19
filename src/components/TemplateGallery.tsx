import type { ReactElement } from 'react';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import ButtonBase from '@mui/material/ButtonBase';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useProjectStore } from '@store/useProjectStore';
import { CHARACTER_TEMPLATES } from '@core/templates';
import { RIG_TEMPLATES } from '@core/customRig';
import { useT } from '@/i18n';

type Item = { readonly id: string; readonly name: string; readonly emoji: string; readonly apply: () => void };

export const TemplateGallery = (): ReactElement => {
  const mode = useProjectStore((s) => s.project.mode);
  const applyHumanoidTemplate = useProjectStore((s) => s.applyHumanoidTemplate);
  const loadRigPreset = useProjectStore((s) => s.loadRigPreset);
  const notify = useProjectStore((s) => s.notify);
  const t = useT();

  const items: readonly Item[] =
    mode === 'custom'
      ? RIG_TEMPLATES.map((r) => ({
          id: r.id,
          name: r.name,
          emoji: r.emoji,
          apply: () => {
            loadRigPreset(r.build());
            notify('Plantilla aplicada', 'success');
          },
        }))
      : CHARACTER_TEMPLATES.map((c) => ({
          id: c.id,
          name: c.name,
          emoji: c.emoji,
          apply: () => applyHumanoidTemplate(c.id),
        }));

  return (
    <Stack spacing={1.25}>
      <Stack direction="row" spacing={0.75} alignItems="center">
        <AutoAwesomeIcon fontSize="small" color="secondary" />
        <Typography variant="h6">{t('Plantillas')}</Typography>
        <Chip size="small" color="secondary" variant="outlined" label={t('listas para usar')} />
      </Stack>
      <Typography variant="caption" color="text.secondary">
        {t('Elegí una plantilla como punto de partida. Después ajustá todo a gusto.')}
      </Typography>

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
              position: 'relative',
              flexDirection: 'column',
              gap: 0.25,
              p: 1,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'action.hover',
              transition: 'all .15s',
              '&:hover': { borderColor: 'secondary.main', transform: 'translateY(-2px)' },
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: 4,
                right: 4,
                fontSize: 9,
                lineHeight: 1,
                px: 0.5,
                py: '2px',
                borderRadius: 1,
                bgcolor: 'secondary.main',
                color: 'secondary.contrastText',
                fontWeight: 700,
                letterSpacing: 0.3,
              }}
            >
              {t('PLANTILLA')}
            </Box>
            <Box sx={{ fontSize: 30, lineHeight: 1, mt: 0.5 }}>{it.emoji}</Box>
            <Typography variant="caption" sx={{ fontWeight: 600, textAlign: 'center' }}>
              {it.name}
            </Typography>
          </ButtonBase>
        ))}
      </Box>
    </Stack>
  );
};

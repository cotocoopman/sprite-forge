import { useState } from 'react';
import type { ReactElement } from 'react';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import Slider from '@mui/material/Slider';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import { useProjectStore } from '@store/useProjectStore';
import { ColorField } from '@components/ColorField';
import { SectionAccordion } from '@components/SectionAccordion';
import { useT } from '@/i18n';
import { ANCHOR_NAMES, ANCHOR_LABELS } from '@core/rig';
import type { AnchorName } from '@core/rig';
import type { Accessory, AccessoryShape } from '@core/poses';
import { PROP_TEMPLATES } from '@core/props';

// Galería de props/armas compuestas (mini-rigs) ancladas a una mano.
const PropGallery = (): ReactElement => {
  const addProp = useProjectStore((s) => s.addProp);
  const [hand, setHand] = useState<AnchorName>('handNear');
  const t = useT();

  return (
    <Stack spacing={1}>
      <Typography variant="subtitle2">{t('Armas / props')}</Typography>
      <ToggleButtonGroup size="small" exclusive fullWidth value={hand} onChange={(_, v) => v && setHand(v as AnchorName)}>
        <ToggleButton value="handNear">{t('Mano derecha')}</ToggleButton>
        <ToggleButton value="handFar">{t('Mano izquierda')}</ToggleButton>
      </ToggleButtonGroup>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))', gap: 0.75 }}>
        {PROP_TEMPLATES.map((p) => (
          <ButtonBase
            key={p.id}
            onClick={() => addProp(p.id, hand)}
            focusRipple
            sx={{
              flexDirection: 'column',
              gap: 0.25,
              p: 0.75,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'action.hover',
              '&:hover': { borderColor: 'primary.main' },
            }}
          >
            <Box sx={{ fontSize: 22, lineHeight: 1 }}>{p.emoji}</Box>
            <Typography variant="caption" sx={{ fontWeight: 600 }}>{p.name}</Typography>
          </ButtonBase>
        ))}
      </Box>
      <Typography variant="caption" color="text.secondary">
        {t('Cada prop es un mini-rig: se compone de varias piezas y sigue la animación de la mano.')}
      </Typography>
    </Stack>
  );
};

const Row = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}): ReactElement => (
  <Box>
    <Stack direction="row" justifyContent="space-between">
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="caption">{value}</Typography>
    </Stack>
    <Slider size="small" value={value} min={min} max={max} step={step} onChange={(_, v) => onChange(v as number)} />
  </Box>
);

const Editor = ({ acc }: { acc: Accessory }): ReactElement => {
  const update = useProjectStore((s) => s.updateAccessory);
  const set = (patch: Partial<Accessory>): void => update(acc.id, patch);
  const t = useT();

  return (
    <Stack spacing={1}>
      <TextField
        size="small"
        label={t('Nombre')}
        value={acc.name}
        onChange={(e) => set({ name: e.target.value })}
        fullWidth
      />
      <TextField
        select
        size="small"
        label={t('Anclado a')}
        value={acc.anchor}
        onChange={(e) => set({ anchor: e.target.value as Accessory['anchor'] })}
        fullWidth
      >
        {ANCHOR_NAMES.map((a) => (
          <MenuItem key={a} value={a}>
            {t(ANCHOR_LABELS[a])}
          </MenuItem>
        ))}
      </TextField>

      <ToggleButtonGroup
        size="small"
        exclusive
        fullWidth
        value={acc.shape}
        onChange={(_, v) => v && set({ shape: v as AccessoryShape })}
      >
        <ToggleButton value="capsule">{t('Barra')}</ToggleButton>
        <ToggleButton value="circle">{t('Círculo')}</ToggleButton>
        <ToggleButton value="rect">{t('Rect')}</ToggleButton>
      </ToggleButtonGroup>

      <Row label={t('Desplazar sobre el hueso')} value={acc.offsetAlong} min={-30} max={30} step={0.5} onChange={(v) => set({ offsetAlong: v })} />
      <Row label={t('Desplazar perpendicular')} value={acc.offsetPerp} min={-30} max={30} step={0.5} onChange={(v) => set({ offsetPerp: v })} />
      <Row label={t('Ángulo')} value={acc.angle} min={-180} max={180} step={1} onChange={(v) => set({ angle: v })} />
      {acc.shape !== 'circle' && (
        <Row label={t('Largo')} value={acc.length} min={0} max={40} step={0.5} onChange={(v) => set({ length: v })} />
      )}
      <Row label={acc.shape === 'circle' ? t('Diámetro') : t('Grosor')} value={acc.width} min={0.5} max={20} step={0.5} onChange={(v) => set({ width: v })} />
      <Row label={t('Opacidad')} value={acc.opacity} min={0} max={1} step={0.05} onChange={(v) => set({ opacity: v })} />

      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="caption" color="text.secondary">
            {t('Color')}
          </Typography>
          <ColorField value={acc.color} onChange={(v) => set({ color: v })} />
        </Stack>
        <FormControlLabel
          control={<Switch size="small" checked={acc.front} onChange={(e) => set({ front: e.target.checked })} />}
          label={<Typography variant="caption">{t('Delante')}</Typography>}
        />
      </Stack>
    </Stack>
  );
};

export const AccessoriesPanel = (): ReactElement => {
  const accessories = useProjectStore((s) => s.project.accessories);
  const activeId = useProjectStore((s) => s.activeAccessoryId);
  const addAccessory = useProjectStore((s) => s.addAccessory);
  const duplicateAccessory = useProjectStore((s) => s.duplicateAccessory);
  const removeAccessory = useProjectStore((s) => s.removeAccessory);
  const selectAccessory = useProjectStore((s) => s.selectAccessory);
  const t = useT();

  const active = accessories.find((a) => a.id === activeId);

  return (
    <SectionAccordion title="Accesorios">
    <Stack spacing={1}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="caption" color="text.secondary">
          {t('Armas, sombreros, capas… anclados a un hueso y siguen la animación.')}
        </Typography>
        <Tooltip title={t('Agregar accesorio')}>
          <IconButton size="small" color="primary" onClick={addAccessory}>
            <AddIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      <PropGallery />

      {accessories.length === 0 ? (
        <Typography variant="caption" color="text.secondary">
          {t('Sin accesorios. Agregá uno (arma, sombrero, capa, escudo…) anclado a un hueso.')}
        </Typography>
      ) : (
        <List dense disablePadding sx={{ maxHeight: 160, overflowY: 'auto' }}>
          {accessories.map((a) => (
            <ListItemButton
              key={a.id}
              selected={a.id === activeId}
              onClick={() => selectAccessory(a.id)}
              sx={{ borderRadius: 1 }}
            >
              <ListItemText primary={a.name} secondary={t(ANCHOR_LABELS[a.anchor])} />
              <Tooltip title={t('Duplicar')}>
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); duplicateAccessory(a.id); }}>
                  <ContentCopyIcon fontSize="inherit" />
                </IconButton>
              </Tooltip>
              <Tooltip title={t('Eliminar')}>
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); removeAccessory(a.id); }}>
                  <DeleteIcon fontSize="inherit" />
                </IconButton>
              </Tooltip>
            </ListItemButton>
          ))}
        </List>
      )}

      {active ? (
        <Editor acc={active} />
      ) : accessories.length > 0 ? (
        <Button size="small" onClick={() => selectAccessory(accessories[0].id)}>
          {t('Editar un accesorio')}
        </Button>
      ) : null}
    </Stack>
    </SectionAccordion>
  );
};

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
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useProjectStore } from '@store/useProjectStore';
import { ColorField } from '@components/ColorField';
import { NumberInput } from '@components/NumberInput';
import { SectionAccordion } from '@components/SectionAccordion';
import { useT } from '@/i18n';
import { ANCHOR_NAMES, ANCHOR_LABELS } from '@core/rig';
import type { AnchorName } from '@core/rig';
import type { Accessory, AccessoryShape } from '@core/poses';
import { PROP_TEMPLATES } from '@core/props';

// Galería de props/armas compuestas (mini-rigs) ancladas a una mano.
const PropGallery = (): ReactElement => {
  const toggleProp = useProjectStore((s) => s.toggleProp);
  const accessories = useProjectStore((s) => s.project.accessories);
  const [hand, setHand] = useState<AnchorName>('handNear');
  const t = useT();

  // Estado por prop: 'off' (no está), 'on' (visible), 'hidden' (translúcido).
  const stateOf = (id: string): 'off' | 'on' | 'hidden' => {
    const g = accessories.filter((a) => a.propId === id);
    if (g.length === 0) return 'off';
    return g[0].hidden ? 'hidden' : 'on';
  };

  return (
    <Stack spacing={1}>
      <Typography variant="subtitle2">{t('Armas / props')}</Typography>
      <ToggleButtonGroup size="small" exclusive fullWidth value={hand} onChange={(_, v) => v && setHand(v as AnchorName)}>
        <ToggleButton value="handNear">{t('Mano derecha')}</ToggleButton>
        <ToggleButton value="handFar">{t('Mano izquierda')}</ToggleButton>
      </ToggleButtonGroup>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))', gap: 0.75 }}>
        {PROP_TEMPLATES.map((p) => {
          const st = stateOf(p.id);
          return (
            <ButtonBase
              key={p.id}
              onClick={() => toggleProp(p.id, hand)}
              focusRipple
              sx={{
                flexDirection: 'column',
                gap: 0.25,
                p: 0.75,
                borderRadius: 2,
                border: '1px solid',
                borderColor: st === 'on' ? 'primary.main' : 'divider',
                bgcolor: st === 'on' ? 'action.selected' : 'action.hover',
                opacity: st === 'hidden' ? 0.45 : 1,
                '&:hover': { borderColor: 'primary.main' },
              }}
            >
              <Box sx={{ fontSize: 22, lineHeight: 1 }}>{p.emoji}</Box>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>{p.name}</Typography>
            </ButtonBase>
          );
        })}
      </Box>
      <Typography variant="caption" color="text.secondary">
        {t('Un click agrega el arma; otro la apaga (translúcida); otro la vuelve a mostrar. Para tener 2, usá “Duplicar”.')}
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
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Stack direction="row" spacing={1} alignItems="center">
      <Slider size="small" value={value} min={min} max={max} step={step} onChange={(_, v) => onChange(v as number)} sx={{ flex: 1 }} />
      <NumberInput value={value} step={step} min={min} onChange={onChange} inputStyle={{ width: 56, padding: '2px 6px' }} />
    </Stack>
  </Box>
);

const Editor = ({ acc }: { acc: Accessory }): ReactElement => {
  const update = useProjectStore((s) => s.updateAccessory);
  const accessories = useProjectStore((s) => s.project.accessories);
  const set = (patch: Partial<Accessory>): void => update(acc.id, patch);
  const t = useT();

  // Otros objetos a los que se puede anclar (evita a sí mismo).
  const others = accessories.filter((a) => a.id !== acc.id);
  const anchorValue = acc.anchorTo ? `obj:${acc.anchorTo.id}` : acc.anchor;

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
        value={anchorValue}
        onChange={(e) => {
          const v = e.target.value;
          if (v.startsWith('obj:')) set({ anchorTo: { id: v.slice(4), part: acc.anchorTo?.part ?? 'center' } });
          else set({ anchor: v as Accessory['anchor'], anchorTo: undefined });
        }}
        fullWidth
      >
        {ANCHOR_NAMES.map((a) => (
          <MenuItem key={a} value={a}>
            {t(ANCHOR_LABELS[a])}
          </MenuItem>
        ))}
        {others.length > 0 && <MenuItem disabled value="__sep">— {t('Otro objeto')} —</MenuItem>}
        {others.map((o) => (
          <MenuItem key={o.id} value={`obj:${o.id}`}>
            {t('Objeto')}: {o.name}
          </MenuItem>
        ))}
      </TextField>
      {acc.anchorTo && (
        <TextField
          select
          size="small"
          label={t('En qué parte del objeto')}
          value={acc.anchorTo.part}
          onChange={(e) => set({ anchorTo: { id: acc.anchorTo!.id, part: e.target.value as 'base' | 'tip' | 'center' } })}
          fullWidth
        >
          <MenuItem value="base">{t('Base')}</MenuItem>
          <MenuItem value="center">{t('Centro')}</MenuItem>
          <MenuItem value="tip">{t('Punta')}</MenuItem>
        </TextField>
      )}

      <ToggleButtonGroup
        size="small"
        exclusive
        fullWidth
        value={acc.shape}
        onChange={(_, v) => v && set({ shape: v as AccessoryShape })}
      >
        <ToggleButton value="capsule">{t('Barra')}</ToggleButton>
        <ToggleButton value="arc">{t('Arco')}</ToggleButton>
        <ToggleButton value="circle">{t('Círculo')}</ToggleButton>
        <ToggleButton value="rect">{t('Rect')}</ToggleButton>
        <ToggleButton value="triangle">{t('Tri')}</ToggleButton>
      </ToggleButtonGroup>

      <Row label={t('Desplazar sobre el hueso')} value={acc.offsetAlong} min={-30} max={30} step={0.5} onChange={(v) => set({ offsetAlong: v })} />
      <Row label={t('Desplazar perpendicular')} value={acc.offsetPerp} min={-30} max={30} step={0.5} onChange={(v) => set({ offsetPerp: v })} />
      <Row label={t('Ángulo')} value={acc.angle} min={-180} max={180} step={1} onChange={(v) => set({ angle: v })} />
      {acc.shape !== 'circle' && (
        <Row label={t('Largo')} value={acc.length} min={0} max={40} step={0.5} onChange={(v) => set({ length: v })} />
      )}
      {acc.shape === 'arc' && (
        <Row label={t('Inclinación del arco')} value={acc.bend ?? 0.5} min={-1.5} max={1.5} step={0.05} onChange={(v) => set({ bend: v })} />
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
  const duplicateActiveProp = useProjectStore((s) => s.duplicateActiveProp);
  const selectAccessory = useProjectStore((s) => s.selectAccessory);
  const t = useT();

  const active = accessories.find((a) => a.id === activeId);

  return (
    <SectionAccordion title="Accesorios / Armas">
    <Stack spacing={1}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="caption" color="text.secondary">
          {t('Armas, sombreros, capas… anclados a un hueso y siguen la animación.')}
        </Typography>
        <Tooltip title={t('Agregar accesorio suelto')}>
          <IconButton size="small" color="primary" onClick={addAccessory}>
            <AddIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      <PropGallery />

      <Typography variant="caption" color="text.secondary">
        {accessories.length === 0
          ? t('Sin accesorios. Agregá uno o dibujá algo; se listan y editan en la pestaña "Capas".')
          : t('Seleccioná una capa en "Capas" (panel derecho) para editarla acá.')}
      </Typography>

      {accessories.length > 0 && (
        <Button size="small" variant="outlined" startIcon={<ContentCopyIcon />} onClick={duplicateActiveProp} disabled={!active}>
          {t('Duplicar arma/accesorio seleccionado')}
        </Button>
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

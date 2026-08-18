import type { ReactElement } from 'react';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
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
import { ANCHOR_NAMES, ANCHOR_LABELS } from '@core/rig';
import type { Accessory, AccessoryShape } from '@core/poses';

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

  return (
    <Stack spacing={1}>
      <TextField
        size="small"
        label="Nombre"
        value={acc.name}
        onChange={(e) => set({ name: e.target.value })}
        fullWidth
      />
      <TextField
        select
        size="small"
        label="Anclado a"
        value={acc.anchor}
        onChange={(e) => set({ anchor: e.target.value as Accessory['anchor'] })}
        fullWidth
      >
        {ANCHOR_NAMES.map((a) => (
          <MenuItem key={a} value={a}>
            {ANCHOR_LABELS[a]}
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
        <ToggleButton value="capsule">Barra</ToggleButton>
        <ToggleButton value="circle">Círculo</ToggleButton>
        <ToggleButton value="rect">Rect</ToggleButton>
      </ToggleButtonGroup>

      <Row label="Desplazar sobre el hueso" value={acc.offsetAlong} min={-30} max={30} step={0.5} onChange={(v) => set({ offsetAlong: v })} />
      <Row label="Desplazar perpendicular" value={acc.offsetPerp} min={-30} max={30} step={0.5} onChange={(v) => set({ offsetPerp: v })} />
      <Row label="Ángulo" value={acc.angle} min={-180} max={180} step={1} onChange={(v) => set({ angle: v })} />
      {acc.shape !== 'circle' && (
        <Row label="Largo" value={acc.length} min={0} max={40} step={0.5} onChange={(v) => set({ length: v })} />
      )}
      <Row label={acc.shape === 'circle' ? 'Diámetro' : 'Grosor'} value={acc.width} min={0.5} max={20} step={0.5} onChange={(v) => set({ width: v })} />
      <Row label="Opacidad" value={acc.opacity} min={0} max={1} step={0.05} onChange={(v) => set({ opacity: v })} />

      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="caption" color="text.secondary">
            Color
          </Typography>
          <input
            type="color"
            value={acc.color}
            onChange={(e) => set({ color: e.target.value })}
            style={{ width: 36, height: 26, border: 'none', background: 'none', cursor: 'pointer' }}
          />
        </Stack>
        <FormControlLabel
          control={<Switch size="small" checked={acc.front} onChange={(e) => set({ front: e.target.checked })} />}
          label={<Typography variant="caption">Delante</Typography>}
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

  const active = accessories.find((a) => a.id === activeId);

  return (
    <Stack spacing={1}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h6">Accesorios</Typography>
        <Tooltip title="Agregar accesorio">
          <IconButton size="small" color="primary" onClick={addAccessory}>
            <AddIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      {accessories.length === 0 ? (
        <Typography variant="caption" color="text.secondary">
          Sin accesorios. Agregá uno (arma, sombrero, capa, escudo…) anclado a un hueso.
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
              <ListItemText primary={a.name} secondary={ANCHOR_LABELS[a.anchor]} />
              <Tooltip title="Duplicar">
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); duplicateAccessory(a.id); }}>
                  <ContentCopyIcon fontSize="inherit" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Eliminar">
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
          Editar un accesorio
        </Button>
      ) : null}
    </Stack>
  );
};

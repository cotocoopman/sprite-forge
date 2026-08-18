import type { ReactElement } from 'react';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Slider from '@mui/material/Slider';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import ImageIcon from '@mui/icons-material/Image';
import { useProjectStore } from '@store/useProjectStore';
import { NumberInput } from '@components/NumberInput';
import { renderCustomSvg } from '@core/svg';
import { downloadBlob, svgToPngBlob } from '@core/export';
import { RIG_PRESETS } from '@core/customRig';
import type { Bone, BoneShape } from '@core/customRig';

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
    <Typography variant="caption" color="text.secondary">{label}</Typography>
    <Stack direction="row" spacing={1} alignItems="center">
      <Slider size="small" value={value} min={min} max={max} step={step} onChange={(_, v) => onChange(v as number)} sx={{ flex: 1 }} />
      <NumberInput value={value} step={step} onChange={onChange} inputStyle={{ width: 56, padding: '2px 6px' }} />
    </Stack>
  </Box>
);

const BoneEditor = ({ bone, others }: { bone: Bone; others: readonly Bone[] }): ReactElement => {
  const update = useProjectStore((s) => s.updateBone);
  const rigColor = useProjectStore((s) => s.project.customRig.color);
  const set = (patch: Partial<Bone>): void => update(bone.id, patch);

  return (
    <Stack spacing={1}>
      <TextField size="small" label="Nombre" value={bone.name} onChange={(e) => set({ name: e.target.value })} fullWidth />
      <TextField
        select
        size="small"
        label="Padre"
        value={bone.parentId ?? ''}
        onChange={(e) => set({ parentId: e.target.value || null })}
        fullWidth
      >
        <MenuItem value="">(raíz — sin padre)</MenuItem>
        {others.map((b) => (
          <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
        ))}
      </TextField>

      <ToggleButtonGroup size="small" exclusive fullWidth value={bone.shape} onChange={(_, v) => v && set({ shape: v as BoneShape })}>
        <ToggleButton value="capsule">Barra</ToggleButton>
        <ToggleButton value="circle">Círculo</ToggleButton>
        <ToggleButton value="rect">Rect</ToggleButton>
      </ToggleButtonGroup>

      {bone.parentId && (
        <Row label="Nace sobre el padre (0=base, 1=punta)" value={bone.attach} min={0} max={1} step={0.02} onChange={(v) => set({ attach: v })} />
      )}
      <Row label="Ángulo (relativo al padre)" value={bone.angle} min={-180} max={180} step={1} onChange={(v) => set({ angle: v })} />
      <Row label={bone.shape === 'circle' ? 'Largo (para hijos)' : 'Largo'} value={bone.length} min={0} max={70} step={0.5} onChange={(v) => set({ length: v })} />
      <Row label={bone.shape === 'circle' ? 'Diámetro' : 'Grosor'} value={bone.width} min={0.5} max={40} step={0.5} onChange={(v) => set({ width: v })} />
      {bone.shape === 'capsule' && (
        <Row label="Curvatura" value={bone.curve} min={-0.6} max={0.6} step={0.02} onChange={(v) => set({ curve: v })} />
      )}
      <Row label="Orden (z)" value={bone.z} min={0} max={10} step={1} onChange={(v) => set({ z: v })} />

      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography variant="caption" color="text.secondary">Color</Typography>
        <input
          type="color"
          value={bone.color ?? rigColor}
          onChange={(e) => set({ color: e.target.value })}
          style={{ width: 36, height: 26, border: 'none', background: 'none', cursor: 'pointer' }}
        />
        <Tooltip title="Volver al color base">
          <span>
            <IconButton size="small" disabled={bone.color === null} onClick={() => set({ color: null })}>
              <RestartAltIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
    </Stack>
  );
};

export const RigEditor = (): ReactElement => {
  const rig = useProjectStore((s) => s.project.customRig);
  const render = useProjectStore((s) => s.project.render);
  const activeBoneId = useProjectStore((s) => s.activeBoneId);
  const selectBone = useProjectStore((s) => s.selectBone);
  const addBone = useProjectStore((s) => s.addBone);
  const removeBone = useProjectStore((s) => s.removeBone);
  const setRigField = useProjectStore((s) => s.setRigField);
  const resetAllBoneColors = useProjectStore((s) => s.resetAllBoneColors);
  const loadRigPreset = useProjectStore((s) => s.loadRigPreset);
  const notify = useProjectStore((s) => s.notify);

  const active = rig.bones.find((b) => b.id === activeBoneId);
  const safe = (rig.name.trim() || 'rig').replace(/[^a-zA-Z0-9_-]+/g, '_');

  const exportPng = async (): Promise<void> => {
    try {
      const blob = await svgToPngBlob(renderCustomSvg(rig, render), render.cellSize, render.cellSize);
      downloadBlob(blob, `${safe}.png`);
    } catch (e) {
      notify(`Error al exportar: ${e instanceof Error ? e.message : 'desconocido'}`, 'error');
    }
  };
  const exportSvg = (): void => {
    downloadBlob(new Blob([renderCustomSvg(rig, render)], { type: 'image/svg+xml' }), `${safe}.svg`);
  };

  return (
    <Stack spacing={1.5}>
      <Typography variant="h6">Rig personalizado</Typography>

      <TextField
        select
        size="small"
        label="Cargar preset"
        value=""
        onChange={(e) => {
          const p = RIG_PRESETS.find((r) => r.id === e.target.value);
          if (p) loadRigPreset(p.build());
        }}
        fullWidth
      >
        {RIG_PRESETS.map((p) => (
          <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
        ))}
      </TextField>

      <Stack direction="row" spacing={1} alignItems="center">
        <TextField size="small" label="Nombre" value={rig.name} onChange={(e) => setRigField({ name: e.target.value })} fullWidth />
        <input
          type="color"
          value={rig.color}
          onChange={(e) => setRigField({ color: e.target.value })}
          style={{ width: 40, height: 30, border: 'none', background: 'none', cursor: 'pointer' }}
        />
        <Tooltip title="Resetear todos los huesos al color base">
          <IconButton size="small" onClick={resetAllBoneColors}>
            <RestartAltIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
      <Stack direction="row" spacing={1}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" color="text.secondary">Origen X</Typography>
          <NumberInput value={rig.origin.x} step={1} onChange={(v) => setRigField({ originX: v })} fullWidth />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" color="text.secondary">Origen Y</Typography>
          <NumberInput value={rig.origin.y} step={1} onChange={(v) => setRigField({ originY: v })} fullWidth />
        </Box>
      </Stack>

      <Divider />

      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="subtitle2">Huesos ({rig.bones.length})</Typography>
        <Tooltip title="Agregar hueso (hijo del seleccionado)">
          <IconButton size="small" color="primary" onClick={addBone}>
            <AddIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      <List dense disablePadding sx={{ maxHeight: 180, overflowY: 'auto' }}>
        {rig.bones.map((b) => (
          <ListItemButton key={b.id} selected={b.id === activeBoneId} onClick={() => selectBone(b.id)} sx={{ borderRadius: 1 }}>
            <ListItemText
              primary={b.name}
              secondary={b.parentId ? rig.bones.find((p) => p.id === b.parentId)?.name ?? '—' : 'raíz'}
            />
            <Tooltip title="Eliminar (y sus hijos)">
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); removeBone(b.id); }}>
                <DeleteIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>
          </ListItemButton>
        ))}
      </List>

      {active && (
        <>
          <Divider />
          <BoneEditor bone={active} others={rig.bones.filter((b) => b.id !== active.id)} />
        </>
      )}

      <Divider />
      <Stack direction="row" spacing={1}>
        <Button size="small" variant="outlined" startIcon={<ImageIcon />} onClick={exportPng}>PNG</Button>
        <Button size="small" variant="outlined" onClick={exportSvg}>SVG</Button>
      </Stack>
      <Typography variant="caption" color="text.secondary">
        Fase 1: rig estático. Animación por keyframes y presets (cuadrúpedo/ave) vienen después.
      </Typography>
    </Stack>
  );
};

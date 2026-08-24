import { useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import LayersIcon from '@mui/icons-material/Layers';
import { useProjectStore } from '@store/useProjectStore';
import { ColorField } from '@components/ColorField';
import { SectionAccordion } from '@components/SectionAccordion';
import { useT } from '@/i18n';
import { PART_NAMES, PART_LABELS } from '@core/rig';

// Fila genérica de capa: ojo · color · nombre (selecciona) · subir/bajar · borrar.
const LayerRow = ({
  name,
  visible,
  selected,
  color,
  onToggle,
  onColor,
  onColorReset,
  canReset,
  onSelect,
  onUp,
  onDown,
  onDelete,
  onDuplicate,
  onRename,
  dragId,
  onDropReorder,
  indent,
}: {
  name: string;
  visible: boolean;
  selected?: boolean;
  color: string;
  onToggle: () => void;
  onColor: (v: string) => void;
  onColorReset?: () => void;
  canReset?: boolean;
  onSelect?: () => void;
  onUp?: () => void;
  onDown?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onRename?: (v: string) => void;
  dragId?: string;
  onDropReorder?: (fromId: string) => void;
  indent?: boolean;
}): ReactElement => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [over, setOver] = useState(false);
  const commit = (): void => {
    setEditing(false);
    const v = draft.trim();
    if (v && v !== name) onRename?.(v);
  };
  return (
  <Stack
    direction="row"
    alignItems="center"
    spacing={0.25}
    onDragOver={onDropReorder ? (e) => { e.preventDefault(); setOver(true); } : undefined}
    onDragLeave={onDropReorder ? () => setOver(false) : undefined}
    onDrop={onDropReorder ? (e) => {
      e.preventDefault();
      setOver(false);
      const from = e.dataTransfer.getData('text/plain');
      if (from) onDropReorder(from);
    } : undefined}
    sx={{
      pl: indent ? 0.25 : 0.25,
      pr: 0.25,
      py: 0.25,
      borderRadius: 1,
      bgcolor: selected ? 'action.selected' : 'transparent',
      borderTop: '2px solid',
      borderColor: over ? 'primary.main' : 'transparent',
      '&:hover': { bgcolor: selected ? 'action.selected' : 'action.hover' },
    }}
  >
    {dragId && (
      <Box
        component="span"
        draggable
        onDragStart={(e) => e.dataTransfer.setData('text/plain', dragId)}
        sx={{ display: 'flex', cursor: 'grab', color: 'text.disabled', '&:active': { cursor: 'grabbing' } }}
      >
        <DragIndicatorIcon fontSize="inherit" />
      </Box>
    )}
    <Tooltip title={visible ? 'Ocultar' : 'Mostrar'}>
      <IconButton size="small" onClick={onToggle} sx={{ opacity: visible ? 1 : 0.4 }}>
        {visible ? <VisibilityIcon fontSize="inherit" /> : <VisibilityOffIcon fontSize="inherit" />}
      </IconButton>
    </Tooltip>
    <ColorField value={color} onChange={onColor} onReset={onColorReset} canReset={canReset} size={22} />
    <Box
      onClick={onSelect}
      onDoubleClick={() => { if (onRename) { setDraft(name); setEditing(true); } }}
      sx={{
        flex: 1,
        minWidth: 0,
        cursor: onSelect ? 'pointer' : 'default',
        opacity: visible ? 1 : 0.5,
      }}
    >
      {editing ? (
        <InputBase
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
          sx={{ fontSize: 12, px: 0.5, py: 0, border: '1px solid', borderColor: 'primary.main', borderRadius: 0.5, width: '100%' }}
        />
      ) : (
        <Tooltip title={onRename ? 'Doble clic para renombrar' : ''}>
          <Typography variant="caption" noWrap sx={{ fontWeight: selected ? 700 : 400 }}>
            {name}
          </Typography>
        </Tooltip>
      )}
    </Box>
    {onUp && (
      <IconButton size="small" onClick={onUp}>
        <KeyboardArrowUpIcon fontSize="inherit" />
      </IconButton>
    )}
    {onDown && (
      <IconButton size="small" onClick={onDown}>
        <KeyboardArrowDownIcon fontSize="inherit" />
      </IconButton>
    )}
    {onDuplicate && (
      <Tooltip title="Duplicar">
        <IconButton size="small" onClick={onDuplicate}>
          <ContentCopyIcon fontSize="inherit" />
        </IconButton>
      </Tooltip>
    )}
    {onDelete && (
      <IconButton size="small" onClick={onDelete}>
        <DeleteIcon fontSize="inherit" />
      </IconButton>
    )}
  </Stack>
  );
};

const GroupLabel = ({ children }: { children: ReactNode }): ReactElement => (
  <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 2 }}>
    {children}
  </Typography>
);

// Modo humanoide: partes del cuerpo + accesorios.
const HumanoidLayers = (): ReactElement => {
  const character = useProjectStore((s) => s.project.character);
  const parts = useProjectStore((s) => s.project.parts);
  const accessories = useProjectStore((s) => s.project.accessories);
  const activeId = useProjectStore((s) => s.activeAccessoryId);
  const togglePartVisible = useProjectStore((s) => s.togglePartVisible);
  const setPartColor = useProjectStore((s) => s.setPartColor);
  const resetPartColor = useProjectStore((s) => s.resetPartColor);
  const setPartName = useProjectStore((s) => s.setPartName);
  const updateAccessory = useProjectStore((s) => s.updateAccessory);
  const removeAccessory = useProjectStore((s) => s.removeAccessory);
  const reorderAccessory = useProjectStore((s) => s.reorderAccessory);
  const moveAccessoryToIndex = useProjectStore((s) => s.moveAccessoryToIndex);
  const duplicateAccessory = useProjectStore((s) => s.duplicateAccessory);
  const selectAccessory = useProjectStore((s) => s.selectAccessory);
  const t = useT();

  // Frente arriba: accesorios en orden inverso al array (último = más al frente).
  const accFrontFirst = [...accessories].reverse();

  return (
    <Stack spacing={0.25}>
      <GroupLabel>{t('Cuerpo')}</GroupLabel>
      {PART_NAMES.map((p) => (
        <LayerRow
          key={p}
          indent
          name={parts[p].name ?? t(PART_LABELS[p])}
          visible={parts[p].visible}
          color={parts[p].color ?? character.color}
          onToggle={() => togglePartVisible(p)}
          onColor={(v) => setPartColor(p, v)}
          onColorReset={() => resetPartColor(p)}
          canReset={parts[p].color !== null}
          onRename={(v) => setPartName(p, v)}
        />
      ))}

      <GroupLabel>{t('Accesorios')}</GroupLabel>
      {accessories.length === 0 ? (
        <Typography variant="caption" color="text.secondary" sx={{ pl: 1 }}>
          {t('Sin accesorios.')}
        </Typography>
      ) : (
        accFrontFirst.map((a, i) => (
          <LayerRow
            key={a.id}
            indent
            name={a.name}
            visible={!a.hidden}
            selected={a.id === activeId}
            color={a.color}
            dragId={a.id}
            onDropReorder={(from) => moveAccessoryToIndex(from, i)}
            onToggle={() => updateAccessory(a.id, { hidden: !a.hidden })}
            onColor={(v) => updateAccessory(a.id, { color: v })}
            onSelect={() => selectAccessory(a.id)}
            onRename={(v) => updateAccessory(a.id, { name: v })}
            onUp={() => reorderAccessory(a.id, 1)}
            onDown={() => reorderAccessory(a.id, -1)}
            onDuplicate={() => duplicateAccessory(a.id)}
            onDelete={() => removeAccessory(a.id)}
          />
        ))
      )}
    </Stack>
  );
};

// Modo rig personalizado: huesos, del frente (z alto) hacia atrás.
const BoneLayers = (): ReactElement => {
  const rig = useProjectStore((s) => s.project.customRig);
  const activeBoneId = useProjectStore((s) => s.activeBoneId);
  const selectBone = useProjectStore((s) => s.selectBone);
  const updateBone = useProjectStore((s) => s.updateBone);
  const removeBone = useProjectStore((s) => s.removeBone);
  const toggleBoneVisible = useProjectStore((s) => s.toggleBoneVisible);
  const reorderBone = useProjectStore((s) => s.reorderBone);
  const moveBoneToIndex = useProjectStore((s) => s.moveBoneToIndex);
  const duplicateBone = useProjectStore((s) => s.duplicateBone);

  const frontFirst = [...rig.bones].sort((a, b) => b.z - a.z);

  return (
    <Stack spacing={0.25}>
      {frontFirst.map((b, i) => (
        <LayerRow
          key={b.id}
          name={b.name}
          visible={!b.hidden}
          selected={b.id === activeBoneId}
          color={b.color ?? rig.color}
          dragId={b.id}
          onDropReorder={(from) => moveBoneToIndex(from, i)}
          onToggle={() => toggleBoneVisible(b.id)}
          onColor={(v) => updateBone(b.id, { color: v })}
          onColorReset={() => updateBone(b.id, { color: null })}
          canReset={b.color !== null}
          onSelect={() => selectBone(b.id)}
          onRename={(v) => updateBone(b.id, { name: v })}
          onUp={() => reorderBone(b.id, 1)}
          onDown={() => reorderBone(b.id, -1)}
          onDuplicate={() => duplicateBone(b.id)}
          onDelete={() => removeBone(b.id)}
        />
      ))}
    </Stack>
  );
};

export const LayersPanel = ({ bare }: { bare?: boolean } = {}): ReactElement => {
  const mode = useProjectStore((s) => s.project.mode);
  const content = mode === 'custom' ? <BoneLayers /> : <HumanoidLayers />;
  if (bare) return content;
  return (
    <SectionAccordion title="Capas" defaultExpanded icon={<LayersIcon fontSize="small" color="secondary" />}>
      {content}
    </SectionAccordion>
  );
};

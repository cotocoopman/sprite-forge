import type { ReactElement } from 'react';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import NearMeIcon from '@mui/icons-material/NearMe';
import GestureIcon from '@mui/icons-material/Gesture';
import CategoryIcon from '@mui/icons-material/Category';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import CropSquareIcon from '@mui/icons-material/CropSquare';
import CircleIcon from '@mui/icons-material/Circle';
import ChangeHistoryIcon from '@mui/icons-material/ChangeHistory';
import RemoveIcon from '@mui/icons-material/Remove';
import StarIcon from '@mui/icons-material/Star';
import BoltIcon from '@mui/icons-material/Bolt';
import Crop75Icon from '@mui/icons-material/Crop75';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import DeleteIcon from '@mui/icons-material/Delete';
import { useProjectStore } from '@store/useProjectStore';
import { NumberInput } from '@components/NumberInput';
import { useT } from '@/i18n';
import type { DrawTool } from '@store/useProjectStore';
import type { AccessoryShape } from '@core/poses';

export const CanvasToolbar = (): ReactElement => {
  const tool = useProjectStore((s) => s.tool);
  const shapeKind = useProjectStore((s) => s.shapeKind);
  const brushWidth = useProjectStore((s) => s.brushWidth);
  const setTool = useProjectStore((s) => s.setTool);
  const setShapeKind = useProjectStore((s) => s.setShapeKind);
  const setBrushWidth = useProjectStore((s) => s.setBrushWidth);
  const duplicateSelected = useProjectStore((s) => s.duplicateSelected);
  const pasteClipboard = useProjectStore((s) => s.pasteClipboard);
  const flipSelected = useProjectStore((s) => s.flipSelected);
  const deleteSelected = useProjectStore((s) => s.deleteSelected);
  const t = useT();

  return (
    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
      <ToggleButtonGroup
        size="small"
        exclusive
        value={tool}
        onChange={(_, v: DrawTool | null) => v && setTool(v)}
      >
        <ToggleButton value="select" aria-label="select">
          <Tooltip title={t('Seleccionar / mover')}><NearMeIcon fontSize="small" /></Tooltip>
        </ToggleButton>
        <ToggleButton value="pencil" aria-label="pencil">
          <Tooltip title={t('Lápiz (dibujo libre)')}><GestureIcon fontSize="small" /></Tooltip>
        </ToggleButton>
        <ToggleButton value="shape" aria-label="shape">
          <Tooltip title={t('Dibujar forma')}><CategoryIcon fontSize="small" /></Tooltip>
        </ToggleButton>
        <ToggleButton value="eraser" aria-label="eraser">
          <Tooltip title={t('Goma (borrar objeto)')}><CleaningServicesIcon fontSize="small" /></Tooltip>
        </ToggleButton>
      </ToggleButtonGroup>

      {tool === 'shape' && (
        <ToggleButtonGroup
          size="small"
          exclusive
          value={shapeKind}
          onChange={(_, v: AccessoryShape | null) => v && setShapeKind(v)}
        >
          <ToggleButton value="rect" aria-label="rect"><Tooltip title={t('Rectángulo')}><CropSquareIcon fontSize="small" /></Tooltip></ToggleButton>
          <ToggleButton value="circle" aria-label="circle"><Tooltip title={t('Círculo')}><CircleIcon fontSize="small" /></Tooltip></ToggleButton>
          <ToggleButton value="triangle" aria-label="triangle"><Tooltip title={t('Triángulo')}><ChangeHistoryIcon fontSize="small" /></Tooltip></ToggleButton>
          <ToggleButton value="trapezoid" aria-label="trapezoid"><Tooltip title={t('Trapecio')}><Crop75Icon fontSize="small" /></Tooltip></ToggleButton>
          <ToggleButton value="star" aria-label="star"><Tooltip title={t('Estrella')}><StarIcon fontSize="small" /></Tooltip></ToggleButton>
          <ToggleButton value="bolt" aria-label="bolt"><Tooltip title={t('Rayo')}><BoltIcon fontSize="small" /></Tooltip></ToggleButton>
          <ToggleButton value="capsule" aria-label="capsule"><Tooltip title={t('Barra')}><RemoveIcon fontSize="small" /></Tooltip></ToggleButton>
        </ToggleButtonGroup>
      )}
      {(tool === 'shape' || tool === 'pencil') && (
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Typography variant="caption" color="text.secondary">{t('Grosor')}</Typography>
          <NumberInput value={brushWidth} step={1} min={1} onChange={setBrushWidth} inputStyle={{ width: 46, padding: '2px 6px' }} />
        </Stack>
      )}
      {tool !== 'select' && (
        <Typography variant="caption" color="text.secondary">
          {tool === 'eraser'
            ? t('Clic sobre un objeto para borrarlo.')
            : t('Clic y arrastrá para dibujar.')}
        </Typography>
      )}

      <Divider orientation="vertical" flexItem />
      <Stack direction="row" spacing={0}>
        <Tooltip title={t('Duplicar (Ctrl+D)')}>
          <IconButton size="small" onClick={duplicateSelected}><ContentCopyIcon fontSize="small" /></IconButton>
        </Tooltip>
        <Tooltip title={t('Pegar (Ctrl+V)')}>
          <IconButton size="small" onClick={pasteClipboard}><ContentPasteIcon fontSize="small" /></IconButton>
        </Tooltip>
        <Tooltip title={t('Voltear horizontal (H)')}>
          <IconButton size="small" onClick={() => flipSelected('h')}><SwapHorizIcon fontSize="small" /></IconButton>
        </Tooltip>
        <Tooltip title={t('Voltear vertical (V)')}>
          <IconButton size="small" onClick={() => flipSelected('v')}><SwapVertIcon fontSize="small" /></IconButton>
        </Tooltip>
        <Tooltip title={t('Borrar (Supr)')}>
          <IconButton size="small" onClick={deleteSelected}><DeleteIcon fontSize="small" /></IconButton>
        </Tooltip>
      </Stack>
    </Stack>
  );
};

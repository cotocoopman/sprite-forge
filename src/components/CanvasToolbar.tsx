import type { ReactElement } from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import NearMeIcon from '@mui/icons-material/NearMe';
import CategoryIcon from '@mui/icons-material/Category';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import CropSquareIcon from '@mui/icons-material/CropSquare';
import CircleIcon from '@mui/icons-material/Circle';
import ChangeHistoryIcon from '@mui/icons-material/ChangeHistory';
import RemoveIcon from '@mui/icons-material/Remove';
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
        <ToggleButton value="shape" aria-label="shape">
          <Tooltip title={t('Dibujar forma')}><CategoryIcon fontSize="small" /></Tooltip>
        </ToggleButton>
        <ToggleButton value="eraser" aria-label="eraser">
          <Tooltip title={t('Goma (borrar objeto)')}><CleaningServicesIcon fontSize="small" /></Tooltip>
        </ToggleButton>
      </ToggleButtonGroup>

      {tool === 'shape' && (
        <>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={shapeKind}
            onChange={(_, v: AccessoryShape | null) => v && setShapeKind(v)}
          >
            <ToggleButton value="rect" aria-label="rect"><Tooltip title={t('Rectángulo')}><CropSquareIcon fontSize="small" /></Tooltip></ToggleButton>
            <ToggleButton value="circle" aria-label="circle"><Tooltip title={t('Círculo')}><CircleIcon fontSize="small" /></Tooltip></ToggleButton>
            <ToggleButton value="triangle" aria-label="triangle"><Tooltip title={t('Triángulo')}><ChangeHistoryIcon fontSize="small" /></Tooltip></ToggleButton>
            <ToggleButton value="capsule" aria-label="capsule"><Tooltip title={t('Barra')}><RemoveIcon fontSize="small" /></Tooltip></ToggleButton>
          </ToggleButtonGroup>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Typography variant="caption" color="text.secondary">{t('Grosor')}</Typography>
            <NumberInput value={brushWidth} step={1} min={1} onChange={setBrushWidth} inputStyle={{ width: 46, padding: '2px 6px' }} />
          </Stack>
        </>
      )}
      {tool !== 'select' && (
        <Typography variant="caption" color="text.secondary">
          {tool === 'shape' ? t('Clic y arrastrá para dibujar.') : t('Clic sobre un objeto para borrarlo.')}
        </Typography>
      )}
    </Stack>
  );
};

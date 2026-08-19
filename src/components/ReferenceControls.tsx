import { useRef } from 'react';
import type { ReactElement, ChangeEvent } from 'react';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Slider from '@mui/material/Slider';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import ImageIcon from '@mui/icons-material/Image';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import DeleteIcon from '@mui/icons-material/Delete';
import { useProjectStore } from '@store/useProjectStore';
import { useT } from '@/i18n';

export const ReferenceControls = (): ReactElement => {
  const refImage = useProjectStore((s) => s.refImage);
  const refOpacity = useProjectStore((s) => s.refOpacity);
  const refScale = useProjectStore((s) => s.refScale);
  const refVisible = useProjectStore((s) => s.refVisible);
  const setRefImage = useProjectStore((s) => s.setRefImage);
  const setRefOpacity = useProjectStore((s) => s.setRefOpacity);
  const setRefScale = useProjectStore((s) => s.setRefScale);
  const toggleRefVisible = useProjectStore((s) => s.toggleRefVisible);
  const notify = useProjectStore((s) => s.notify);
  const t = useT();

  const inputRef = useRef<HTMLInputElement>(null);

  const onFile = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setRefImage(String(reader.result));
    reader.onerror = () => notify(t('No se pudo leer la imagen'), 'error');
    reader.readAsDataURL(file);
  };

  return (
    <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={onFile} />
      <Button size="small" variant="outlined" startIcon={<ImageIcon />} onClick={() => inputRef.current?.click()}>
        {t('Referencia')}
      </Button>

      {refImage && (
        <>
          <Tooltip title={refVisible ? t('Ocultar') : t('Mostrar')}>
            <IconButton size="small" onClick={toggleRefVisible}>
              {refVisible ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
          <Box sx={{ width: 90 }}>
            <Typography variant="caption" color="text.secondary">
              {t('Opacidad')}
            </Typography>
            <Slider size="small" value={refOpacity} min={0} max={1} step={0.05} onChange={(_, v) => setRefOpacity(v as number)} />
          </Box>
          <Box sx={{ width: 90 }}>
            <Typography variant="caption" color="text.secondary">
              {t('Escala')}
            </Typography>
            <Slider size="small" value={refScale} min={0.2} max={3} step={0.05} onChange={(_, v) => setRefScale(v as number)} />
          </Box>
          <Tooltip title={t('Quitar referencia')}>
            <IconButton size="small" onClick={() => setRefImage(null)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </>
      )}
    </Stack>
  );
};

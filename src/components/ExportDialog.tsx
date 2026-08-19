import { useState } from 'react';
import type { ReactElement } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Switch from '@mui/material/Switch';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';
import { useProjectStore } from '@store/useProjectStore';
import { NumberInput } from '@components/NumberInput';
import { useT } from '@/i18n';
import type { ExportOptions } from '@core/export';
import { buildRigZip, buildZip, downloadBlob } from '@core/export';

type Props = { readonly open: boolean; readonly onClose: () => void };

const RENDER_FIELDS: readonly {
  key: 'cellSize' | 'characterHeightRatio' | 'groundRatio';
  label: string;
  step: number;
}[] = [
  { key: 'cellSize', label: 'Cell size (px)', step: 1 },
  { key: 'characterHeightRatio', label: 'Alto personaje / celda', step: 0.01 },
  { key: 'groundRatio', label: 'Y del suelo / celda', step: 0.01 },
];

export const ExportDialog = ({ open, onClose }: Props): ReactElement => {
  const project = useProjectStore((s) => s.project);
  const mode = useProjectStore((s) => s.project.mode);
  const render = useProjectStore((s) => s.project.render);
  const setRenderField = useProjectStore((s) => s.setRenderField);
  const toggleFlip = useProjectStore((s) => s.toggleFlip);
  const notify = useProjectStore((s) => s.notify);
  const t = useT();

  const [options, setOptions] = useState<ExportOptions>({
    sheets: true,
    frames: true,
    svg: false,
    manifest: true,
    projectJson: true,
    directions8: false,
    godot: false,
  });
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  const toggle = (key: keyof ExportOptions) => (): void =>
    setOptions((o) => ({ ...o, [key]: !o[key] }));

  const nothingSelected = !Object.values(options).some(Boolean);

  const handleExport = async (): Promise<void> => {
    setBusy(true);
    setProgress(0);
    try {
      const onProg = (done: number, total: number): void => setProgress(Math.round((done / total) * 100));
      const blob =
        mode === 'custom'
          ? await buildRigZip(project.customRig, render, options, onProg)
          : await buildZip(project, options, onProg);
      const name = mode === 'custom' ? project.customRig.name : project.character.name;
      const filename = `${name.trim() || 'sprite'}.zip`;
      downloadBlob(blob, filename);
      notify('Export completado', 'success');
      onClose();
    } catch (e) {
      notify(`${t('Error al exportar')}: ${e instanceof Error ? e.message : '?'}`, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('Exportar sprites')}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography variant="subtitle2">{t('Tamaño de celda (px)')}</Typography>
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            {[16, 32, 48, 64, 96, 128, 256, 512, 1024].map((size) => (
              <Button
                key={size}
                size="small"
                variant={render.cellSize === size ? 'contained' : 'outlined'}
                onClick={() => setRenderField('cellSize', size)}
                sx={{ minWidth: 52 }}
              >
                {size}
              </Button>
            ))}
          </Stack>

          <Typography variant="subtitle2">{t('Configuración de render')}</Typography>
          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
            {RENDER_FIELDS.map((f) => (
              <Box key={f.key} sx={{ width: 170 }}>
                <NumberInput
                  label={t(f.label)}
                  value={render[f.key]}
                  step={f.step}
                  onChange={(v) => setRenderField(f.key, v)}
                  fullWidth
                />
              </Box>
            ))}
            <FormControlLabel
              control={<Switch checked={render.flip} onChange={toggleFlip} />}
              label={t('Espejo horizontal')}
            />
          </Stack>

          <Divider />

          <Typography variant="subtitle2">{t('Qué incluir')}</Typography>
          <Stack>
            <FormControlLabel
              control={<Checkbox checked={options.sheets} onChange={toggle('sheets')} />}
              label={t('Sprite sheet por animación (tira horizontal)')}
            />
            <FormControlLabel
              control={<Checkbox checked={options.frames} onChange={toggle('frames')} />}
              label={t('Frames sueltos (un PNG por frame)')}
            />
            <FormControlLabel
              control={<Checkbox checked={options.svg} onChange={toggle('svg')} />}
              label={t('SVG por animación')}
            />
            <FormControlLabel
              control={<Checkbox checked={options.manifest} onChange={toggle('manifest')} />}
              label="manifest.json"
            />
            <FormControlLabel
              control={<Checkbox checked={options.projectJson} onChange={toggle('projectJson')} />}
              label="project.json"
            />
            <FormControlLabel
              control={<Checkbox checked={options.directions8} onChange={toggle('directions8')} />}
              label={t('Las 8 direcciones (giro cada 45°) — sufijo _d0.._d7')}
            />
            <FormControlLabel
              control={<Checkbox checked={options.godot} onChange={toggle('godot')} />}
              label={t('Recurso Godot 4 (SpriteFrames .tres, usa los sheets)')}
            />
          </Stack>

          <Typography variant="caption" color="text.secondary">
            {render.cellSize}×{render.cellSize}px · {project.animations.length} {t('animaciones')}
            {options.directions8 ? ' · ×8' : ''}
          </Typography>

          {busy && (
            <Stack spacing={0.5}>
              <LinearProgress variant="determinate" value={progress} />
              <Typography variant="caption" align="center">
                {progress}%
              </Typography>
            </Stack>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>
          {t('Cancelar')}
        </Button>
        <Button variant="contained" onClick={handleExport} disabled={busy || nothingSelected}>
          {t('Exportar ZIP')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

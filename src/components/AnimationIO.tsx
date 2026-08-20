import { useRef } from 'react';
import type { ReactElement } from 'react';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import { useProjectStore } from '@store/useProjectStore';
import { downloadBlob } from '@core/export';
import type { AnimationClip } from '@core/poses';
import type { RigClip } from '@core/customRig';
import { useT } from '@/i18n';

type Bundle = {
  readonly kind: 'sprite-forge-animations';
  readonly mode: 'humanoid' | 'rig';
  readonly clips: readonly (AnimationClip | RigClip)[];
};

// Exportar/importar el set de animaciones para copiarlas entre personajes o rigs
// (del mismo tipo). Las poses son independientes del personaje, así que un walk
// hecho para uno sirve para cualquier otro humanoide.
export const AnimationIO = (): ReactElement => {
  const mode = useProjectStore((s) => s.project.mode);
  const humanoidClips = useProjectStore((s) => s.project.animations);
  const rigClips = useProjectStore((s) => s.project.customRig.animations);
  const importAnimations = useProjectStore((s) => s.importAnimations);
  const importRigClips = useProjectStore((s) => s.importRigClips);
  const notify = useProjectStore((s) => s.notify);
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);

  const isRig = mode === 'custom';

  const handleExport = (): void => {
    const bundle: Bundle = {
      kind: 'sprite-forge-animations',
      mode: isRig ? 'rig' : 'humanoid',
      clips: isRig ? rigClips : humanoidClips,
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `animations-${isRig ? 'rig' : 'humanoid'}.json`);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as Partial<Bundle>;
      if (parsed.kind !== 'sprite-forge-animations' || !Array.isArray(parsed.clips)) {
        notify('Archivo de animaciones inválido', 'error');
        return;
      }
      const wantMode: Bundle['mode'] = isRig ? 'rig' : 'humanoid';
      if (parsed.mode !== wantMode) {
        notify(
          isRig
            ? 'Ese archivo es de un personaje humanoide, no de un rig'
            : 'Ese archivo es de un rig, no de un personaje humanoide',
          'error',
        );
        return;
      }
      if (isRig) importRigClips(parsed.clips as RigClip[]);
      else importAnimations(parsed.clips as AnimationClip[]);
    } catch {
      notify('No se pudo leer el archivo', 'error');
    }
  };

  return (
    <Stack spacing={1}>
      <Typography variant="subtitle2">{t('Copiar animaciones')}</Typography>
      <Typography variant="caption" color="text.secondary">
        {t('Exportá tus animaciones a un archivo y importalas en otro personaje o rig.')}
      </Typography>
      <Stack direction="row" spacing={1}>
        <Tooltip title={t('Descargar las animaciones actuales como archivo')}>
          <Button size="small" variant="outlined" startIcon={<DownloadIcon />} onClick={handleExport} fullWidth>
            {t('Exportar')}
          </Button>
        </Tooltip>
        <Tooltip title={t('Cargar animaciones desde un archivo y agregarlas a este personaje/rig')}>
          <Button size="small" variant="outlined" startIcon={<UploadIcon />} onClick={() => inputRef.current?.click()} fullWidth>
            {t('Importar')}
          </Button>
        </Tooltip>
      </Stack>
      <input ref={inputRef} type="file" accept="application/json" hidden onChange={handleFile} />
    </Stack>
  );
};

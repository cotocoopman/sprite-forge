import { useEffect, useRef, useState } from 'react';
import type { ReactElement, ChangeEvent } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import TranslateIcon from '@mui/icons-material/Translate';
import { useProjectStore } from '@store/useProjectStore';
import { useT } from '@/i18n';
import { useActiveClip } from '@/hooks/useActiveClip';
import { useActiveRigClip } from '@/hooks/useActiveRigClip';
import { parseProjectJson } from '@core/validation';
import { exportProjectJson } from '@core/export';
import { CharacterPanel } from '@components/CharacterPanel';
import { PartsPanel } from '@components/PartsPanel';
import { AccessoriesPanel } from '@components/AccessoriesPanel';
import { EffectsPanel } from '@components/EffectsPanel';
import { PresetLibrary } from '@components/PresetLibrary';
import { PreviewCanvas } from '@components/PreviewCanvas';
import { DirectionDial } from '@components/DirectionDial';
import { ReferenceControls } from '@components/ReferenceControls';
import { PlaybackControls } from '@components/PlaybackControls';
import { KeyboardShortcuts } from '@components/KeyboardShortcuts';
import { RigEditor } from '@components/RigEditor';
import { TemplateGallery } from '@components/TemplateGallery';
import { AnimationIO } from '@components/AnimationIO';
import { CustomPreview } from '@components/CustomPreview';
import { RigAnimationPanel } from '@components/RigAnimationPanel';
import { RigFrameStrip } from '@components/RigFrameStrip';
import { FrameStrip } from '@components/FrameStrip';
import { AnimationList } from '@components/AnimationList';
import { KeyframeTimeline } from '@components/KeyframeTimeline';
import { PoseEditor } from '@components/PoseEditor';
import { ExportDialog } from '@components/ExportDialog';

// Columnas: en desktop scrollean internas a altura de viewport; en móvil se
// apilan con altura automática y scrollea la página.
const columnSx = {
  p: 2,
  height: { xs: 'auto', md: 'calc(100vh - 64px)' },
  overflowY: { xs: 'visible', md: 'auto' },
  borderRadius: 0,
};

const usePlayback = (): void => {
  const isPlaying = useProjectStore((s) => s.isPlaying);
  const mode = useProjectStore((s) => s.project.mode);
  const humanoidClip = useActiveClip();
  const rigClip = useActiveRigClip();
  const clip = mode === 'custom' ? rigClip : humanoidClip;

  useEffect(() => {
    if (!isPlaying || !clip) return;
    const frameDur = 1000 / Math.max(1, clip.fps);
    let raf = 0;
    let last = performance.now();
    let acc = 0;

    const step = (now: number): void => {
      acc += now - last;
      last = now;
      while (acc >= frameDur) {
        acc -= frameDur;
        const cur = useProjectStore.getState().currentFrame;
        const next = cur + 1;
        if (next >= clip.frames) {
          if (clip.loop) {
            useProjectStore.setState({ currentFrame: 0 });
          } else {
            useProjectStore.setState({ currentFrame: clip.frames - 1, isPlaying: false });
            return;
          }
        } else {
          useProjectStore.setState({ currentFrame: next });
        }
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, clip]);
};

export const App = (): ReactElement => {
  const project = useProjectStore((s) => s.project);
  const importProject = useProjectStore((s) => s.importProject);
  const notification = useProjectStore((s) => s.notification);
  const notify = useProjectStore((s) => s.notify);
  const hideNotification = useProjectStore((s) => s.hideNotification);

  const t = useT();
  const mode = useProjectStore((s) => s.project.mode);
  const setMode = useProjectStore((s) => s.setMode);
  const lang = useProjectStore((s) => s.lang);
  const setLang = useProjectStore((s) => s.setLang);
  const canUndo = useProjectStore((s) => s.canUndo);
  const canRedo = useProjectStore((s) => s.canRedo);
  const undo = useProjectStore((s) => s.undo);
  const redo = useProjectStore((s) => s.redo);

  const [exportOpen, setExportOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  usePlayback();

  // Atajos: Ctrl+Z/Y = undo/redo · Espacio = play/pausa · ←/→ = frame ant./sig.
  useEffect(() => {
    // Solo tipos de texto real cuentan como "editable" — un <input type="range">
    // (el thumb de un Slider MUI) NO, para que Ctrl+Z aplique al historial global.
    const TEXT_INPUT_TYPES = new Set(['text', 'number', 'search', 'email', 'url', 'password', 'tel']);
    const onKeyDown = (e: KeyboardEvent): void => {
      const target = e.target as HTMLElement | null;
      const editable =
        !!target &&
        (target.tagName === 'TEXTAREA' ||
          target.isContentEditable ||
          (target.tagName === 'INPUT' && TEXT_INPUT_TYPES.has((target as HTMLInputElement).type)));

      if (e.ctrlKey || e.metaKey) {
        const key = e.key.toLowerCase();
        if (key === 'z' && !e.shiftKey) {
          if (editable) return; // dejá el undo nativo del campo de texto
          e.preventDefault();
          useProjectStore.getState().undo();
        } else if (key === 'y' || (key === 'z' && e.shiftKey)) {
          if (editable) return;
          e.preventDefault();
          useProjectStore.getState().redo();
        }
        return;
      }

      // Reproducción (sin modificadores) — ignorar si hay un control con foco.
      const onControl =
        editable ||
        (!!target && (target.tagName === 'BUTTON' || target.tagName === 'SELECT' || !!target.closest('[role="slider"]')));
      if (onControl) return;
      if (e.key === ' ') {
        e.preventDefault();
        useProjectStore.getState().togglePlay();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        useProjectStore.getState().prevFrame();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        useProjectStore.getState().nextFrame();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleImportFile = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = parseProjectJson(String(reader.result));
      if (result.ok) {
        importProject(result.project);
        notify(t('Proyecto importado'), 'success');
      } else {
        notify(`${t('Importar')}: ${result.error}`, 'error');
      }
    };
    reader.onerror = () => notify(t('No se pudo leer el archivo'), 'error');
    reader.readAsText(file);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar variant="dense" sx={{ flexWrap: 'wrap', gap: 1, py: { xs: 1, md: 0 } }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mr: 0.75 }}>
            Sprite Forge
          </Typography>
          <Typography
            component="a"
            href="https://github.com/cotocoopman/sprite-forge/releases"
            target="_blank"
            rel="noopener noreferrer"
            variant="caption"
            sx={{ color: 'text.secondary', textDecoration: 'none', mr: 2, '&:hover': { color: 'primary.main' } }}
          >
            v{__APP_VERSION__}
          </Typography>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={mode}
            onChange={(_, v) => v && setMode(v)}
          >
            <ToggleButton value="humanoid">{t('Humanoide')}</ToggleButton>
            <ToggleButton value="custom">{t('Rig personalizado')}</ToggleButton>
          </ToggleButtonGroup>
          <Box sx={{ flexGrow: 1 }} />
          <Tooltip title={t('Idioma / Language')}>
            <ToggleButtonGroup size="small" exclusive value={lang} onChange={(_, v) => v && setLang(v)} sx={{ mr: 1 }}>
              <ToggleButton value="es"><TranslateIcon fontSize="small" sx={{ mr: 0.5 }} />ES</ToggleButton>
              <ToggleButton value="en">EN</ToggleButton>
            </ToggleButtonGroup>
          </Tooltip>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={handleImportFile}
          />
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Tooltip title={t('Deshacer (Ctrl+Z)')}>
              <span>
                <IconButton size="small" onClick={undo} disabled={!canUndo}>
                  <UndoIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={t('Rehacer (Ctrl+Y)')}>
              <span>
                <IconButton size="small" onClick={redo} disabled={!canRedo}>
                  <RedoIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={t('Atajos de teclado')}>
              <IconButton size="small" onClick={() => setShortcutsOpen(true)}>
                <KeyboardIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Button startIcon={<UploadIcon />} onClick={() => fileInputRef.current?.click()}>
              {t('Importar')}
            </Button>
            <Button startIcon={<SaveAltIcon />} onClick={() => exportProjectJson(project)}>
              {t('Exportar proyecto')}
            </Button>
            <Button variant="contained" startIcon={<DownloadIcon />} onClick={() => setExportOpen(true)}>
              {t('Exportar sprites')}
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      {mode === 'custom' ? (
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, flexGrow: 1, minHeight: 0 }}>
          {/* Izquierda — Editor de huesos */}
          <Paper square sx={{ ...columnSx, width: { xs: '100%', md: 340 }, flexShrink: { md: 0 } }}>
            <Stack spacing={3}>
              <TemplateGallery />
              <Divider />
              <RigEditor />
            </Stack>
          </Paper>
          {/* Centro — Preview animado del rig */}
          <Box sx={{ flexGrow: 1, minWidth: 0, p: 2, display: 'flex', flexDirection: 'column', gap: 1.5, minHeight: { xs: '70vh', md: 0 } }}>
            <Box sx={{ flexGrow: 1, minHeight: 0 }}>
              <CustomPreview />
            </Box>
            <PlaybackControls />
            <RigFrameStrip />
          </Box>
          {/* Derecha — Animación del rig */}
          <Paper square sx={{ ...columnSx, width: { xs: '100%', md: 360 }, flexShrink: { md: 0 } }}>
            <Stack spacing={2}>
              <RigAnimationPanel />
              <Divider />
              <AnimationIO />
            </Stack>
          </Paper>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, flexGrow: 1, minHeight: 0 }}>
          {/* Izquierda — Personaje */}
          <Paper square sx={{ ...columnSx, width: { xs: '100%', md: 320 }, flexShrink: { md: 0 } }}>
            <Stack spacing={3}>
              <TemplateGallery />
              <Divider />
              <CharacterPanel />
              <Divider />
              <PartsPanel />
              <Divider />
              <AccessoriesPanel />
              <Divider />
              <EffectsPanel />
              <Divider />
              <PresetLibrary />
            </Stack>
          </Paper>

          {/* Centro — Preview */}
          <Box sx={{ flexGrow: 1, minWidth: 0, p: 2, display: 'flex', flexDirection: 'column', gap: 1.5, minHeight: { xs: '70vh', md: 0 } }}>
            <Box sx={{ flexGrow: 1, minHeight: 0, display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              <Box sx={{ flexGrow: 1, minWidth: 220 }}>
                <PreviewCanvas />
              </Box>
              <DirectionDial />
            </Box>
            <ReferenceControls />
            <PlaybackControls />
            <FrameStrip />
          </Box>

          {/* Derecha — Animación y pose */}
          <Paper square sx={{ ...columnSx, width: { xs: '100%', md: 360 }, flexShrink: { md: 0 } }}>
            <Stack spacing={2}>
              <AnimationList />
              <Divider />
              <KeyframeTimeline />
              <Divider />
              <PoseEditor />
              <Divider />
              <AnimationIO />
            </Stack>
          </Paper>
        </Box>
      )}

      <ExportDialog open={exportOpen} onClose={() => setExportOpen(false)} />
      <KeyboardShortcuts open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={hideNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={hideNotification} severity={notification.type} variant="filled">
          {t(notification.message)}
        </Alert>
      </Snackbar>
    </Box>
  );
};

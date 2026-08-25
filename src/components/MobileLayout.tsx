import { useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import TuneIcon from '@mui/icons-material/Tune';
import LayersIcon from '@mui/icons-material/Layers';
import MovieIcon from '@mui/icons-material/Movie';
import ThreeSixtyIcon from '@mui/icons-material/ThreeSixty';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import GitHubIcon from '@mui/icons-material/GitHub';
import TranslateIcon from '@mui/icons-material/Translate';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import { useProjectStore } from '@store/useProjectStore';
import { useT } from '@/i18n';
import { CharacterPanel } from '@components/CharacterPanel';
import { AccessoriesPanel } from '@components/AccessoriesPanel';
import { EffectsPanel } from '@components/EffectsPanel';
import { PresetLibrary } from '@components/PresetLibrary';
import { PreviewCanvas } from '@components/PreviewCanvas';
import { DirectionDial } from '@components/DirectionDial';
import { ReferenceControls } from '@components/ReferenceControls';
import { PlaybackControls } from '@components/PlaybackControls';
import { RigEditor } from '@components/RigEditor';
import { LayersPanel } from '@components/LayersPanel';
import { TemplateGallery } from '@components/TemplateGallery';
import { AnimationIO } from '@components/AnimationIO';
import { RigTurnDial } from '@components/RigTurnDial';
import { CenterName } from '@components/CenterName';
import { CustomPreview } from '@components/CustomPreview';
import { RigAnimationPanel } from '@components/RigAnimationPanel';
import { RigFrameStrip } from '@components/RigFrameStrip';
import { FrameStrip } from '@components/FrameStrip';
import { AnimationList } from '@components/AnimationList';
import { KeyframeTimeline } from '@components/KeyframeTimeline';
import { PoseEditor } from '@components/PoseEditor';

// Acciones globales que viven en App (diálogos + input de archivo).
export type MobileActions = {
  readonly onImportClick: () => void;
  readonly onExportProject: () => void;
  readonly onExportSprites: () => void;
  readonly onGuide: () => void;
  readonly onShortcuts: () => void;
  readonly onReset: () => void;
};

type SheetKey = 'design' | 'layers' | 'anim' | 'turn';

const SHEET_TITLE: Record<SheetKey, string> = {
  design: 'Diseño',
  layers: 'Capas',
  anim: 'Animación',
  turn: 'Giro 3D',
};

// Layout 100% mobile: canvas a pantalla casi completa, paneles en bottom sheets
// lanzadas desde una barra inferior, y las acciones globales en un menú desplegable.
export const MobileLayout = (props: MobileActions): ReactElement => {
  const t = useT();
  const mode = useProjectStore((s) => s.project.mode);
  const setMode = useProjectStore((s) => s.setMode);
  const lang = useProjectStore((s) => s.lang);
  const setLang = useProjectStore((s) => s.setLang);
  const canUndo = useProjectStore((s) => s.canUndo);
  const canRedo = useProjectStore((s) => s.canRedo);
  const undo = useProjectStore((s) => s.undo);
  const redo = useProjectStore((s) => s.redo);

  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [sheet, setSheet] = useState<SheetKey | null>(null);
  const closeMenu = (): void => setMenuAnchor(null);
  const run = (fn: () => void) => (): void => {
    closeMenu();
    fn();
  };

  const sheetContent = (key: SheetKey): ReactNode => {
    if (key === 'design') {
      return mode === 'custom' ? (
        <Stack spacing={2}>
          <TemplateGallery />
          <Divider />
          <RigEditor />
          <Divider />
          <EffectsPanel />
        </Stack>
      ) : (
        <Stack spacing={2}>
          <TemplateGallery />
          <Divider />
          <CharacterPanel />
          <Divider />
          <AccessoriesPanel />
          <Divider />
          <EffectsPanel />
          <Divider />
          <PresetLibrary />
        </Stack>
      );
    }
    if (key === 'layers') return <LayersPanel bare />;
    if (key === 'anim') {
      return mode === 'custom' ? (
        <Stack spacing={2}>
          <RigAnimationPanel />
          <Divider />
          <RigFrameStrip />
          <Divider />
          <AnimationIO />
        </Stack>
      ) : (
        <Stack spacing={2}>
          <AnimationList />
          <Divider />
          <KeyframeTimeline />
          <Divider />
          <FrameStrip />
          <Divider />
          <PoseEditor />
          <Divider />
          <AnimationIO />
        </Stack>
      );
    }
    // turn
    return mode === 'custom' ? (
      <Stack spacing={2} alignItems="center">
        <RigTurnDial />
      </Stack>
    ) : (
      <Stack spacing={2}>
        <DirectionDial />
        <Divider />
        <ReferenceControls />
      </Stack>
    );
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      {/* Barra superior compacta */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar variant="dense" sx={{ gap: 0.5, minHeight: 52 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mr: 0.5 }}>
            Sprite Forge
          </Typography>
          <ToggleButtonGroup size="small" exclusive value={mode} onChange={(_, v) => v && setMode(v)}>
            <ToggleButton value="humanoid" sx={{ px: 1 }}>{t('Humano')}</ToggleButton>
            <ToggleButton value="custom" sx={{ px: 1 }}>{t('Rig')}</ToggleButton>
          </ToggleButtonGroup>
          <Box sx={{ flexGrow: 1 }} />
          <Tooltip title={t('Exportar sprites')}>
            <IconButton color="primary" onClick={props.onExportSprites} aria-label={t('Exportar sprites')}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)} aria-label={t('Más acciones')}>
            <MoreVertIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Área de trabajo: canvas maximizado + controles de reproducción */}
      <Box sx={{ flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column', p: 1, gap: 1, overflow: 'hidden' }}>
        <CenterName />
        <Box sx={{ flexGrow: 1, minHeight: 0, display: 'flex' }}>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>{mode === 'custom' ? <CustomPreview /> : <PreviewCanvas />}</Box>
        </Box>
        <PlaybackControls />
      </Box>

      {/* Navegación inferior: cada botón abre una bottom sheet */}
      <BottomNavigation
        showLabels
        value={sheet ?? false}
        onChange={(_, v) => setSheet(v as SheetKey)}
        sx={{ borderTop: '1px solid', borderColor: 'divider', flexShrink: 0 }}
      >
        <BottomNavigationAction value="design" label={t('Diseño')} icon={<TuneIcon />} />
        <BottomNavigationAction value="layers" label={t('Capas')} icon={<LayersIcon />} />
        <BottomNavigationAction value="anim" label={t('Animar')} icon={<MovieIcon />} />
        <BottomNavigationAction value="turn" label={t('Girar')} icon={<ThreeSixtyIcon />} />
      </BottomNavigation>

      {/* Menú desplegable con acciones globales */}
      <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={closeMenu}>
        <MenuItem onClick={() => undo()} disabled={!canUndo}>
          <ListItemIcon><UndoIcon fontSize="small" /></ListItemIcon>
          <ListItemText>{t('Deshacer')}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => redo()} disabled={!canRedo}>
          <ListItemIcon><RedoIcon fontSize="small" /></ListItemIcon>
          <ListItemText>{t('Rehacer')}</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={run(props.onImportClick)}>
          <ListItemIcon><UploadIcon fontSize="small" /></ListItemIcon>
          <ListItemText>{t('Importar')}</ListItemText>
        </MenuItem>
        <MenuItem onClick={run(props.onExportProject)}>
          <ListItemIcon><SaveAltIcon fontSize="small" /></ListItemIcon>
          <ListItemText>{t('Exportar proyecto')}</ListItemText>
        </MenuItem>
        <MenuItem onClick={run(props.onExportSprites)}>
          <ListItemIcon><DownloadIcon fontSize="small" /></ListItemIcon>
          <ListItemText>{t('Exportar sprites')}</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => setLang(lang === 'es' ? 'en' : 'es')}>
          <ListItemIcon><TranslateIcon fontSize="small" /></ListItemIcon>
          <ListItemText>{t('Idioma')}: {lang.toUpperCase()}</ListItemText>
        </MenuItem>
        <MenuItem onClick={run(props.onGuide)}>
          <ListItemIcon><MenuBookIcon fontSize="small" /></ListItemIcon>
          <ListItemText>{t('Guía rápida')}</ListItemText>
        </MenuItem>
        <MenuItem onClick={run(props.onShortcuts)}>
          <ListItemIcon><KeyboardIcon fontSize="small" /></ListItemIcon>
          <ListItemText>{t('Atajos de teclado')}</ListItemText>
        </MenuItem>
        <MenuItem
          component="a"
          href="https://github.com/cotocoopman/sprite-forge"
          target="_blank"
          rel="noopener noreferrer"
          onClick={closeMenu}
        >
          <ListItemIcon><GitHubIcon fontSize="small" /></ListItemIcon>
          <ListItemText>GitHub</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={run(props.onReset)} sx={{ color: 'error.main' }}>
          <ListItemIcon><DeleteSweepIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>{t('Reiniciar todo')}</ListItemText>
        </MenuItem>
      </Menu>

      {/* Bottom sheet con el panel activo */}
      <SwipeableDrawer
        anchor="bottom"
        open={sheet !== null}
        onClose={() => setSheet(null)}
        onOpen={() => undefined}
        disableSwipeToOpen
        slotProps={{ paper: { sx: { height: '82vh', borderTopLeftRadius: 14, borderTopRightRadius: 14 } } }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1 }}>
            <Box sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: 'divider' }} />
          </Box>
          <Stack direction="row" alignItems="center" sx={{ px: 2, py: 1 }}>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              {sheet ? t(SHEET_TITLE[sheet]) : ''}
            </Typography>
            <IconButton onClick={() => setSheet(null)} aria-label={t('Cerrar')}>
              <CloseIcon />
            </IconButton>
          </Stack>
          <Divider />
          <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>{sheet ? sheetContent(sheet) : null}</Box>
        </Box>
      </SwipeableDrawer>
    </Box>
  );
};

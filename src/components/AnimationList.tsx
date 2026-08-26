import { useState } from 'react';
import type { ReactElement } from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { useProjectStore } from '@store/useProjectStore';
import { NumberInput } from '@components/NumberInput';
import { useT } from '@/i18n';
import { useActiveClip } from '@/hooks/useActiveClip';

export const AnimationList = (): ReactElement => {
  const animations = useProjectStore((s) => s.project.animations);
  const activeId = useProjectStore((s) => s.activeAnimationId);
  const selectAnimation = useProjectStore((s) => s.selectAnimation);
  const addAnimation = useProjectStore((s) => s.addAnimation);
  const duplicateAnimation = useProjectStore((s) => s.duplicateAnimation);
  const deleteAnimation = useProjectStore((s) => s.deleteAnimation);
  const renameAnimation = useProjectStore((s) => s.renameAnimation);
  const moveAnimationToIndex = useProjectStore((s) => s.moveAnimationToIndex);
  const setClipFrames = useProjectStore((s) => s.setClipFrames);
  const setClipFps = useProjectStore((s) => s.setClipFps);
  const setClipLoop = useProjectStore((s) => s.setClipLoop);
  const clip = useActiveClip();

  const t = useT();
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [overId, setOverId] = useState<string | null>(null);

  const startRename = (id: string, name: string): void => {
    setRenamingId(id);
    setDraft(name);
  };
  const commitRename = (): void => {
    if (renamingId && draft.trim()) renameAnimation(renamingId, draft.trim());
    setRenamingId(null);
  };

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="subtitle1" fontWeight={700}>{t('Animaciones')}</Typography>
        <Tooltip title={t('Agregar clip')}>
          <IconButton size="small" color="primary" onClick={addAnimation}>
            <AddIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      <List dense disablePadding sx={{ maxHeight: 220, overflowY: 'auto' }}>
        {animations.map((c, i) => (
          <ListItemButton
            key={c.id}
            selected={c.id === activeId}
            onClick={() => selectAnimation(c.id)}
            onDragOver={(e) => {
              e.preventDefault();
              if (overId !== c.id) setOverId(c.id);
            }}
            onDragLeave={() => setOverId((cur) => (cur === c.id ? null : cur))}
            onDrop={(e) => {
              e.preventDefault();
              setOverId(null);
              const from = e.dataTransfer.getData('text/plain');
              if (from && from !== c.id) moveAnimationToIndex(from, i);
            }}
            sx={{
              borderRadius: 1,
              borderTop: '2px solid',
              borderColor: overId === c.id ? 'primary.main' : 'transparent',
            }}
          >
            <Box
              component="span"
              draggable
              onClick={(e) => e.stopPropagation()}
              onDragStart={(e) => e.dataTransfer.setData('text/plain', c.id)}
              onDragEnd={() => setOverId(null)}
              sx={{ display: 'flex', alignItems: 'center', cursor: 'grab', color: 'text.disabled', mr: 0.25, '&:active': { cursor: 'grabbing' } }}
            >
              <DragIndicatorIcon fontSize="small" />
            </Box>
            {renamingId === c.id ? (
              <TextField
                size="small"
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitRename();
                  if (e.key === 'Escape') setRenamingId(null);
                }}
                onClick={(e) => e.stopPropagation()}
                fullWidth
              />
            ) : (
              <ListItemText primary={c.name} secondary={`${c.frames}f · ${c.fps}fps${c.loop ? ' · loop' : ''}`} />
            )}
            <Stack direction="row">
              <Tooltip title={t('Renombrar')}>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    startRename(c.id, c.name);
                  }}
                >
                  <EditIcon fontSize="inherit" />
                </IconButton>
              </Tooltip>
              <Tooltip title={t('Duplicar')}>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    duplicateAnimation(c.id);
                  }}
                >
                  <ContentCopyIcon fontSize="inherit" />
                </IconButton>
              </Tooltip>
              <Tooltip title={t('Eliminar')}>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteAnimation(c.id);
                  }}
                >
                  <DeleteIcon fontSize="inherit" />
                </IconButton>
              </Tooltip>
            </Stack>
          </ListItemButton>
        ))}
      </List>

      <Divider />

      {clip && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            {t('Ajustes')}: {clip.name}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Box sx={{ width: 90 }}>
              <NumberInput label={t('Frames')} value={clip.frames} step={1} min={1} onChange={setClipFrames} fullWidth />
            </Box>
            <Box sx={{ width: 90 }}>
              <NumberInput label={t('FPS')} value={clip.fps} step={1} min={1} onChange={setClipFps} fullWidth />
            </Box>
            <FormControlLabel
              control={<Switch checked={clip.loop} onChange={(e) => setClipLoop(e.target.checked)} />}
              label={t('Loop')}
            />
          </Stack>
        </Box>
      )}
    </Stack>
  );
};

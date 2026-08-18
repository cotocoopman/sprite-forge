import { useState } from 'react';
import type { ReactElement } from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Tooltip from '@mui/material/Tooltip';
import SaveIcon from '@mui/icons-material/Save';
import CheckIcon from '@mui/icons-material/Check';
import DeleteIcon from '@mui/icons-material/Delete';
import { useProjectStore } from '@store/useProjectStore';

export const PresetLibrary = (): ReactElement => {
  const presets = useProjectStore((s) => s.presets);
  const savePreset = useProjectStore((s) => s.savePreset);
  const applyPreset = useProjectStore((s) => s.applyPreset);
  const deletePreset = useProjectStore((s) => s.deletePreset);

  const [name, setName] = useState('');

  const handleSave = (): void => {
    const trimmed = name.trim();
    if (!trimmed) return;
    savePreset(trimmed);
    setName('');
  };

  return (
    <Stack spacing={1.5}>
      <Typography variant="h6">Biblioteca de personajes</Typography>
      <Stack direction="row" spacing={1}>
        <TextField
          size="small"
          placeholder="Nombre del preset"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
          }}
          fullWidth
        />
        <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={!name.trim()}>
          Guardar
        </Button>
      </Stack>

      {presets.length === 0 ? (
        <Typography variant="caption" color="text.secondary">
          Sin presets guardados.
        </Typography>
      ) : (
        <List dense disablePadding>
          {presets.map((p) => (
            <ListItem
              key={p.id}
              disablePadding
              secondaryAction={
                <Stack direction="row">
                  <Tooltip title="Aplicar">
                    <IconButton size="small" onClick={() => applyPreset(p.id)}>
                      <CheckIcon fontSize="inherit" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Eliminar">
                    <IconButton size="small" onClick={() => deletePreset(p.id)}>
                      <DeleteIcon fontSize="inherit" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              }
            >
              <ListItemText primary={p.name} />
            </ListItem>
          ))}
        </List>
      )}
    </Stack>
  );
};

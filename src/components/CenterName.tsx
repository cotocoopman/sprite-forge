import type { ReactElement } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import { useProjectStore } from '@store/useProjectStore';
import { useT } from '@/i18n';

// Nombre del personaje/rig, centrado arriba del preview.
export const CenterName = (): ReactElement => {
  const mode = useProjectStore((s) => s.project.mode);
  const charName = useProjectStore((s) => s.project.character.name);
  const rigName = useProjectStore((s) => s.project.customRig.name);
  const setName = useProjectStore((s) => s.setName);
  const setRigField = useProjectStore((s) => s.setRigField);
  const t = useT();

  const isRig = mode === 'custom';
  const value = isRig ? rigName : charName;

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <TextField
        variant="standard"
        placeholder={t('Nombre')}
        value={value}
        onChange={(e) => (isRig ? setRigField({ name: e.target.value }) : setName(e.target.value))}
        slotProps={{
          input: {
            sx: { fontSize: 20, fontWeight: 700, textAlign: 'center' },
          },
          htmlInput: { style: { textAlign: 'center' } },
        }}
        sx={{ maxWidth: 320, width: '100%' }}
      />
    </Box>
  );
};

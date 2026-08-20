import type { ReactElement } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useT } from '@/i18n';

type Props = { readonly open: boolean; readonly onClose: () => void };

type Entry = { readonly section: string; readonly what: string; readonly example: string };

// Manual rápido: cada sección → para qué sirve + un ejemplo. Todo vía useT (ES/EN).
const ENTRIES: readonly Entry[] = [
  {
    section: 'Plantillas',
    what: 'Puntos de partida listos (héroe, mago, slime, cuadrúpedo…). Traen proporciones, colores y a veces armas.',
    example: 'Elegí "Warrior" y ya tenés espada + escudo; después ajustás lo que quieras.',
  },
  {
    section: 'Personaje',
    what: 'Proporciones del humanoide (cabeza, torso, brazos, piernas) y color base.',
    example: 'Subí "Diámetro cabeza" para un look más cabezón/chibi.',
  },
  {
    section: 'Partes',
    what: 'Prendé/apagá partes del cuerpo o pintalas por separado. Las apagadas no se exportan.',
    example: 'Apagá brazos y piernas para un blob tipo slime.',
  },
  {
    section: 'Accesorios',
    what: 'Armas, sombreros, capas… anclados a un hueso (mano, cabeza) que siguen la animación.',
    example: 'Sumá una "Espada" a la mano derecha: en el clip "attack" se blande sola.',
  },
  {
    section: 'Efectos',
    what: 'Sombra, brillo y contorno de la silueta.',
    example: 'Activá "Sombra → Piso" para que el personaje proyecte sombra al suelo.',
  },
  {
    section: 'Referencia',
    what: 'Superpone una imagen (arte, un sprite existente) semitransparente detrás para calcarla.',
    example: 'Cargá el arte de tu personaje y ajustá la silueta hasta que calce.',
  },
  {
    section: 'Giro 3D (dirección)',
    what: 'Gira el personaje como una figura 3D para juegos top-down (8 direcciones).',
    example: 'Poné 90° para verlo de perfil; exportá "las 8 direcciones" para todas.',
  },
  {
    section: 'Animaciones',
    what: 'Los clips (idle, walk, attack…). Definí cuadros, FPS y loop.',
    example: 'Seleccioná "walk" y dale play para ver el ciclo de caminata.',
  },
  {
    section: 'Keyframes',
    what: 'Los cuadros clave de la animación en una línea de tiempo arrastrable.',
    example: 'Agregá un keyframe a la mitad y cambiá la pose para crear el movimiento.',
  },
  {
    section: 'Pose',
    what: 'Ángulos de cada articulación en el keyframe seleccionado.',
    example: 'Copiá una pose, espejala y pegala en otro keyframe para un paso simétrico.',
  },
  {
    section: 'Copiar animaciones',
    what: 'Exportá/importá tus clips como archivo para reusarlos en otro personaje o rig.',
    example: 'Exportá el "walk" de un personaje e importalo en otro humanoide.',
  },
  {
    section: 'Biblioteca de personajes',
    what: 'Guarda el personaje actual con un nombre (en tu navegador) para reaplicarlo luego.',
    example: 'Ajustás un héroe, lo guardás como "MiHéroe" y lo recuperás cuando quieras.',
  },
  {
    section: 'Importar / Exportar',
    what: '"Exportar proyecto" guarda todo editable (.json). "Importar" lo vuelve a cargar. "Exportar sprites" genera los PNG/Godot finales.',
    example: 'Antes de cerrar, "Exportar proyecto" para no perder tu trabajo.',
  },
  {
    section: 'Rig personalizado',
    what: 'Modo para criaturas/objetos: armás un esqueleto de huesos propio y lo animás.',
    example: 'Cargá "Spider" y animá sus patas cuadro a cuadro.',
  },
];

export const QuickGuide = ({ open, onClose }: Props): ReactElement => {
  const t = useT();
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth scroll="paper">
      <DialogTitle>{t('Guía rápida — qué es cada sección')}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          {ENTRIES.map((e) => (
            <Box key={e.section}>
              <Typography variant="subtitle2" color="primary">
                {t(e.section)}
              </Typography>
              <Typography variant="body2">{t(e.what)}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                <b>{t('Ejemplo')}:</b> {t(e.example)}
              </Typography>
            </Box>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('Cerrar')}</Button>
      </DialogActions>
    </Dialog>
  );
};

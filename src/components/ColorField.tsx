import { useEffect, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { useT } from '@/i18n';

type Props = {
  readonly value: string;
  readonly onChange: (v: string) => void;
  readonly onReset?: () => void;
  readonly canReset?: boolean;
  readonly size?: number;
};

// Input de color con commit "throttled": mientras arrastrás el picker, el swatch
// se actualiza al instante pero el store se toca a lo sumo cada ~90ms (y al soltar),
// evitando el lag de re-renderizar el preview 60 veces por segundo.
export const ColorField = ({ value, onChange, onReset, canReset, size = 34 }: Props): ReactElement => {
  const [local, setLocal] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<string | null>(null);
  const t = useT();

  // Si el valor externo cambia (reset, undo, otra parte), sincronizar el local.
  useEffect(() => {
    setLocal(value);
  }, [value]);

  const flush = (): void => {
    if (pending.current !== null) {
      onChange(pending.current);
      pending.current = null;
    }
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  const handleChange = (v: string): void => {
    setLocal(v);
    pending.current = v;
    if (!timer.current) {
      timer.current = setTimeout(() => {
        timer.current = null;
        flush();
      }, 90);
    }
  };

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      <input
        type="color"
        value={local}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={flush}
        style={{ width: size, height: 26, border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
      />
      {onReset && (
        <Tooltip title={t('Restablecer')}>
          <span>
            <IconButton size="small" disabled={canReset === false} onClick={onReset}>
              <RestartAltIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      )}
    </span>
  );
};

import { useState } from 'react';
import type { ReactElement, CSSProperties, KeyboardEvent } from 'react';
import TextField from '@mui/material/TextField';

type Props = {
  readonly value: number;
  readonly onChange: (value: number) => void;
  readonly step?: number;
  readonly label?: string;
  readonly fullWidth?: boolean;
  readonly inputStyle?: CSSProperties;
  readonly min?: number;
};

// Input numérico que acepta coma O punto como separador decimal, y permite
// estados intermedios al tipear ("12," / "12.") sin resetear el cursor.
export const NumberInput = ({
  value,
  onChange,
  step,
  label,
  fullWidth,
  inputStyle,
  min,
}: Props): ReactElement => {
  const [buffer, setBuffer] = useState<string | null>(null);
  const display = buffer ?? String(value);

  const commit = (raw: string): void => {
    setBuffer(raw);
    if (raw.trim() === '' || raw === '-' || raw === ',' || raw === '.') return;
    const n = Number(raw.replace(',', '.'));
    if (Number.isFinite(n)) onChange(n);
  };

  // Restaura el incremento con flechas ↑/↓ (que el input de texto no trae).
  const onKeyDown = (e: KeyboardEvent): void => {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault();
    const s = step ?? 1;
    const cur = Number((buffer ?? String(value)).replace(',', '.'));
    const base = Number.isFinite(cur) ? cur : value;
    let next = base + (e.key === 'ArrowUp' ? s : -s);
    next = Math.round(next / s) * s; // evita ruido de coma flotante
    next = Math.round(next * 1e6) / 1e6;
    if (min !== undefined && next < min) next = min;
    setBuffer(null);
    onChange(next);
  };

  return (
    <TextField
      type="text"
      size="small"
      label={label}
      value={display}
      onChange={(e) => commit(e.target.value)}
      onKeyDown={onKeyDown}
      onBlur={() => setBuffer(null)}
      fullWidth={fullWidth}
      slotProps={{
        htmlInput: {
          inputMode: 'decimal',
          step,
          min,
          style: inputStyle,
        },
      }}
      variant="outlined"
    />
  );
};

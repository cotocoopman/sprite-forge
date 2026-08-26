import { useCallback, useState } from 'react';

// Estado abierto/cerrado de un acordeón (o panel) persistido en localStorage, para
// que la UI recuerde lo último que el usuario abrió o cerró entre sesiones.
const PREFIX = 'sprite-forge_ui_expanded_';

export const usePersistedExpanded = (
  key: string,
  fallback: boolean,
): [boolean, (v: boolean) => void] => {
  const storageKey = PREFIX + key;
  const [expanded, setExpanded] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw === '1') return true;
      if (raw === '0') return false;
    } catch {
      /* ignora */
    }
    return fallback;
  });
  const set = useCallback(
    (v: boolean) => {
      setExpanded(v);
      try {
        localStorage.setItem(storageKey, v ? '1' : '0');
      } catch {
        /* ignora */
      }
    },
    [storageKey],
  );
  return [expanded, set];
};

// Variante para un valor de string (p. ej. la pestaña activa Animaciones/Capas).
export const usePersistedChoice = <T extends string>(
  key: string,
  fallback: T,
  allowed: readonly T[],
): [T, (v: T) => void] => {
  const storageKey = PREFIX + key;
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw && (allowed as readonly string[]).includes(raw)) return raw as T;
    } catch {
      /* ignora */
    }
    return fallback;
  });
  const set = useCallback(
    (v: T) => {
      setValue(v);
      try {
        localStorage.setItem(storageKey, v);
      } catch {
        /* ignora */
      }
    },
    [storageKey],
  );
  return [value, set];
};

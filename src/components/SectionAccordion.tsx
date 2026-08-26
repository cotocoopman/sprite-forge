import type { ReactElement, ReactNode } from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useT } from '@/i18n';
import { usePersistedExpanded } from '@/hooks/usePersistedExpanded';

type Props = {
  readonly title: string;
  readonly defaultExpanded?: boolean;
  readonly icon?: ReactNode;
  readonly children: ReactNode;
};

// Sección colapsable estándar (título como summary). Título en h6 traducido.
// Recuerda su estado abierto/cerrado entre sesiones (keyed por título).
export const SectionAccordion = ({ title, defaultExpanded = false, icon, children }: Props): ReactElement => {
  const t = useT();
  const [expanded, setExpanded] = usePersistedExpanded(`section:${title}`, defaultExpanded);
  return (
    <Accordion disableGutters expanded={expanded} onChange={(_, v) => setExpanded(v)}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack direction="row" spacing={0.75} alignItems="center">
          {icon}
          <Typography variant="subtitle1" fontWeight={700}>{t(title)}</Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>{children}</AccordionDetails>
    </Accordion>
  );
};

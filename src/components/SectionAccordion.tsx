import type { ReactElement, ReactNode } from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useT } from '@/i18n';

type Props = {
  readonly title: string;
  readonly defaultExpanded?: boolean;
  readonly icon?: ReactNode;
  readonly children: ReactNode;
};

// Sección colapsable estándar (título como summary). Título en h6 traducido.
export const SectionAccordion = ({ title, defaultExpanded = false, icon, children }: Props): ReactElement => {
  const t = useT();
  return (
    <Accordion disableGutters defaultExpanded={defaultExpanded}>
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

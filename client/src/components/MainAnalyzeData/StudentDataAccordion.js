import { Accordion, AccordionSummary, AccordionDetails, Typography, Box } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export default function StudentDataAccordion({ dataTypes }) {
  if (!Array.isArray(dataTypes)) return null; // Defensive: don't render if not an array

  return (
    <Box>
      {dataTypes.map((type) => (
        <Accordion key={type.id}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">{type.label}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {type.content}
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}



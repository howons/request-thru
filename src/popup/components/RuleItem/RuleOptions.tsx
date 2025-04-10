import { useState } from 'react';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Stack,
  Switch,
  TextField,
  Typography
} from '@mui/material';

import './RuleOptions.css';

export default function RuleOptions() {
  const [isAutoUpdate, setIsAutoUpdate] = useState(false);

  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />} className="rule-options-accordian-summary">
        <Typography variant="caption" margin="0 0 0 auto">
          rule options
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Stack direction="row">
          <Typography variant="caption" margin="0 0 0 auto">
            value 자동 업데이트
          </Typography>
          <Switch
            checked={isAutoUpdate}
            onChange={e => {
              setIsAutoUpdate(e.target.checked);
            }}
          />
        </Stack>
        <TextField />
      </AccordionDetails>
    </Accordion>
  );
}

import { useState } from 'react';

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Stack,
  Switch,
  TextField
} from '@mui/material';

type Props = {
  url: string;
  updateUrl: (newUrl: string) => void;
  initRules: chrome.declarativeNetRequest.Rule[];
};

export default function Ruleset({ url, updateUrl, initRules }: Props) {
  const [ruleList, setRuleList] = useState(initRules);

  return (
    <Accordion>
      <AccordionSummary>
        <Switch />
        <TextField
          variant="standard"
          label="target URL"
          type="url"
          defaultValue={url}
          onChange={e => {
            updateUrl(e.target.value);
          }}
        />
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2}>{<></>}</Stack>
      </AccordionDetails>
    </Accordion>
  );
}

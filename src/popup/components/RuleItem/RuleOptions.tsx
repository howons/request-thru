import { useState } from 'react';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  IconButton,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography
} from '@mui/material';

import { fetchData } from '../../utils/fetch';

import './RuleOptions.css';

const HOUR_LIST = [1, 3, 6, 12, 24] as const;

type Props = {
  updateValue: (value: string) => void;
};

export default function RuleOptions({ updateValue }: Props) {
  const [isAutoUpdate, setIsAutoUpdate] = useState(false);
  const [revalidationInterval, setRevalidationInterval] = useState(24);

  const [apiUrl, setApiUrl] = useState<string>('');
  const [apiResult, setApiResult] = useState('');
  const [isApiLoading, setIsApiLoading] = useState(false);

  const handleApiRefresh = async () => {
    setIsApiLoading(true);

    const result = await fetchData(apiUrl);
    setApiResult(result);
    updateValue(result);

    setIsApiLoading(false);
  };

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
        <TextField
          type="text"
          label="api url"
          variant="outlined"
          disabled={!isAutoUpdate}
          onChange={e => {
            setApiUrl(e.target.value);
          }}
        />
        <Select
          label="갱신 간격"
          value={revalidationInterval}
          disabled={!isAutoUpdate}
          onChange={e => {
            setRevalidationInterval(Number(e.target.value));
          }}
        >
          {HOUR_LIST.map(hour => (
            <MenuItem key={hour} value={3600 * hour}>
              {hour}시간
            </MenuItem>
          ))}
        </Select>
        {apiResult}
        <IconButton
          aria-label="refresh"
          disabled={!isAutoUpdate || isApiLoading}
          onClick={handleApiRefresh}
        >
          <RefreshIcon />
        </IconButton>
      </AccordionDetails>
    </Accordion>
  );
}

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
  Tooltip,
  Typography
} from '@mui/material';

import { fetchData, matchResult } from '../../utils/fetch';

import './RuleOptions.css';

const HOUR_LIST = [1, 3, 6, 12, 24] as const;
const REG_FLAG_LIST = ['g', 'i', 'm'] as const;

type Props = {
  updateValue: (value: string) => void;
};

export default function RuleOptions({ updateValue }: Props) {
  const [isAutoUpdate, setIsAutoUpdate] = useState(false);
  const [revalidationInterval, setRevalidationInterval] = useState(24);

  const [apiUrl, setApiUrl] = useState<string>('');
  const [isApiLoading, setIsApiLoading] = useState(false);

  const [regMatcher, setRegMatcher] = useState('');
  const [regFlag, setRegFlag] = useState('g');
  const [regPlacer, setRegPlacer] = useState('');

  const handleApiRefresh = async () => {
    setIsApiLoading(true);

    const result = await fetchData(apiUrl);
    const regResult = matchResult(result, regMatcher, regFlag, regPlacer);
    updateValue(regResult);

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
          value={apiUrl}
          variant="outlined"
          disabled={!isAutoUpdate}
          onChange={e => {
            setApiUrl(e.target.value);
          }}
        />
        <TextField
          type="text"
          label="reg matcher"
          value={regMatcher}
          variant="outlined"
          disabled={!isAutoUpdate}
          onChange={e => {
            setRegMatcher(e.target.value);
          }}
        />
        <Select
          label="reg flag"
          value={regFlag}
          disabled={!isAutoUpdate}
          onChange={e => {
            setRegFlag(e.target.value);
          }}
        >
          {REG_FLAG_LIST.map(flag => (
            <MenuItem key={flag} value={flag}>
              {flag}
            </MenuItem>
          ))}
        </Select>
        <Tooltip title="reg 매칭그룹을 $[숫자]로 가져와 위치시키기. 기본 $1으로 시작.">
          <TextField
            type="text"
            label="reg placer"
            value={regPlacer}
            variant="outlined"
            disabled={!isAutoUpdate}
            placeholder="추가텍스트 $1"
            onChange={e => {
              setRegPlacer(e.target.value);
            }}
          />
        </Tooltip>
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

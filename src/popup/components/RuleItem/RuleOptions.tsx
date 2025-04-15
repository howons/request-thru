import { useEffect, useMemo, useState } from 'react';

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
import useDebounce from '../../utils/useDebounce';

import './RuleOptions.css';

const HOUR_LIST = [1, 3, 6, 12, 24] as const;
const REG_FLAG_LIST = ['g', 'i', 'm'] as const;

const LOCAL_KEYS = [
  'isAutoUpdate',
  'apiUrl',
  'regMatcher',
  'regFlag',
  'regPlacer',
  'revalidationInterval'
] as const;

type Props = {
  ruleItemId: string;
  updateValue: (value: string) => void;
};

export default function RuleOptions({ ruleItemId, updateValue }: Props) {
  const [isAutoUpdate, setIsAutoUpdate] = useState(false);

  const [apiUrl, setApiUrl] = useState('');

  const [regMatcher, setRegMatcher] = useState('');
  const [regFlag, setRegFlag] = useState('g');
  const [regPlacer, setRegPlacer] = useState('');

  const [revalidationInterval, setRevalidationInterval] = useState(24);

  const [isApiLoading, setIsApiLoading] = useState(false);

  const localKeys = useMemo(() => LOCAL_KEYS.map(key => `${ruleItemId}_${key}`), []);

  useEffect(() => {
    const setterList = [
      setIsAutoUpdate,
      setApiUrl,
      setRegMatcher,
      setRegFlag,
      setRegPlacer,
      setRevalidationInterval
    ];
    const getLocalData = async () => {
      const data = await chrome.storage.local.get(localKeys);
      localKeys.forEach((key, i) => {
        const value = data?.[key];
        if (value !== undefined) {
          setterList[i](value);
        }
      });
    };

    getLocalData();
  }, []);

  const handleAutoUpdateChange = useDebounce((value: boolean) => {
    chrome.storage.local.set({ [localKeys[0]]: value });
  }, 300);

  const handleApiUrlChange = useDebounce((value: string) => {
    chrome.storage.local.set({ [localKeys[1]]: value });
  }, 300);

  const handleRegMatcherChange = useDebounce((value: string) => {
    chrome.storage.local.set({ [localKeys[2]]: value });
  }, 300);

  const handleRegFlagChange = useDebounce((value: string) => {
    chrome.storage.local.set({ [localKeys[3]]: value });
  }, 300);

  const handleRegPlacerChange = useDebounce((value: string) => {
    chrome.storage.local.set({ [localKeys[4]]: value });
  }, 300);

  const handleRevalidationIntervalChange = useDebounce((value: number) => {
    chrome.storage.local.set({ [localKeys[5]]: value });
  }, 300);

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
              handleAutoUpdateChange(e.target.checked);
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
            handleApiUrlChange(e.target.value);
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
            handleRegMatcherChange(e.target.value);
          }}
        />
        <Select
          label="reg flag"
          value={regFlag}
          disabled={!isAutoUpdate}
          onChange={e => {
            setRegFlag(e.target.value);
            handleRegFlagChange(e.target.value);
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
              handleRegPlacerChange(e.target.value);
            }}
          />
        </Tooltip>
        <Select
          label="갱신 간격"
          value={revalidationInterval}
          disabled={!isAutoUpdate}
          onChange={e => {
            const value = Number(e.target.value);
            setRevalidationInterval(value);
            handleRevalidationIntervalChange(value);
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

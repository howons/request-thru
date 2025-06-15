import { type ChangeEvent, type MouseEvent, useEffect, useState } from 'react';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Stack,
  Switch,
  Tooltip,
  Typography
} from '@mui/material';

import { setBlock, setBlockUrl } from '../../messages/rule';
import useDebounce from '../../utils/useDebounce';
import ExpandableTextFields from '../ExpandableTextFields/ExpandableTextFields';

import './InfRequest.css';

type InfRequestProps = {
  onCatch?: (error: Error) => void;
};

export default function InfRequest({ onCatch }: InfRequestProps) {
  const [enableBlock, setEnableBlock] = useState(true);
  const [urlFilter, setUrlFilter] = useState<string[]>([]);

  // load initial block state from storage
  useEffect(() => {
    chrome.storage.local.get(['reqThru_block']).then(res => {
      const isBlock = res.reqThru_block;
      if (isBlock !== undefined) {
        setEnableBlock(isBlock);
        setBlock(isBlock);
      }
    });

    chrome.storage.local.get(['reqThru_blockUrl']).then(res => {
      const blockUrls = res.reqThru_blockUrl?.length
        ? res.reqThru_blockUrl
        : ['http://localhost/*'];
      setUrlFilter(blockUrls);
    });
  }, []);

  const toggleBlocking = (e: ChangeEvent<HTMLInputElement>, checked: boolean) => {
    setEnableBlock(checked);
    setBlock(checked);
    chrome.storage.local.set({ reqThru_block: checked });
  };

  const saveBlockUrls = useDebounce(async (newUrls: string[]) => {
    chrome.storage.local.set({ reqThru_blockUrl: newUrls });
    const message = await setBlockUrl(newUrls);
    onCatch?.(message);
  }, 1000);

  const handleUrlChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { value: newUrl, id } = e.target;
    const index = Number(id.split('-')[1]);
    const newUrlFilter = [...urlFilter];
    newUrlFilter[index] = newUrl;
    setUrlFilter(newUrlFilter);
    saveBlockUrls(newUrlFilter);
  };

  const handleUrlAppend = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const newUrl = '';
    setUrlFilter([...urlFilter, newUrl]);
    saveBlockUrls([...urlFilter, newUrl]);
  };

  const handleUrlDelete = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const newUrlFilter = urlFilter.filter(url => url !== '');
    setUrlFilter(newUrlFilter);
    saveBlockUrls(newUrlFilter);
  };

  return (
    <Accordion style={{ width: '90%' }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />} className="inf-request-accordian-summary">
        <Stack direction="row" alignSelf="stretch" alignItems={'center'}>
          <Typography variant="caption" sx={{ marginLeft: 'auto' }}>
            무한 네트워크 요청 자동 차단
          </Typography>
          <Tooltip title="분당 1000회 이상의 요청을 보내는 도메인을 차단합니다.">
            <Switch
              checked={enableBlock}
              onChange={toggleBlocking}
              onClick={e => e.stopPropagation()}
            />
          </Tooltip>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <ExpandableTextFields
          list={urlFilter}
          tooltip="과도한 요청을 차단할 URL을 입력합니다. ex) https://*/*, http://localhost:8080/*"
          label="url filter"
          disabled={!enableBlock}
          onChange={handleUrlChange}
          handleAppend={handleUrlAppend}
          handleDelete={handleUrlDelete}
        />
      </AccordionDetails>
    </Accordion>
  );
}

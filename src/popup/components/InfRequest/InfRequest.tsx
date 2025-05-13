import { useEffect, useState } from 'react';

import { Stack, Switch, Tooltip, Typography } from '@mui/material';

import { setBlock } from '../../messages/rule';

export default function InfRequest() {
  const [enableBlock, setEnableBlock] = useState(true);

  useEffect(() => {
    chrome.storage.local.get(['reqThru_block']).then(res => {
      const isBlock = res.reqThru_block;
      if (isBlock !== undefined) {
        setEnableBlock(isBlock);
        setBlock(isBlock);
      }
    });
  }, []);

  const toggleBlocking: (event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => void = (
    event,
    checked
  ) => {
    setEnableBlock(checked);
    setBlock(checked);
    chrome.storage.local.set({ reqThru_block: checked });
  };
  return (
    <Stack direction="row" alignSelf="stretch" padding="16px" alignItems={'center'}>
      <Typography variant="caption" sx={{ marginLeft: 'auto' }}>
        무한 네트워크 요청 자동 차단
      </Typography>
      <Tooltip title="분당 300회 이상의 요청을 보내는 사이트를 차단합니다.">
        <Switch checked={enableBlock} onChange={toggleBlocking} />
      </Tooltip>
    </Stack>
  );
}

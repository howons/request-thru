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
      <Tooltip title="Rule이 하나라도 존재하는 url만 차단합니다.">
        <Switch checked={enableBlock} onChange={toggleBlocking} />
      </Tooltip>
    </Stack>
  );
}

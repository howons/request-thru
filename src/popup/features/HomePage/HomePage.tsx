import { ReactElement, useEffect, useState } from 'react';

import { Alert, Button, Snackbar, Stack } from '@mui/material';
import Box from '@mui/material/Box';

import PopupContent from '../../components/PopupContent/PopupContent';
import PopupHeader from '../../components/PopupHeader/PopupHeader';

import './HomePage.css';

export default function HomePage(): ReactElement {
  const [reqList, setReqList] = useState<chrome.declarativeNetRequest.Rule[]>([]);
  const [disableAppendButton, setDisableAppendButton] = useState<boolean>(false);

  const [showErrorSnackbar, setShowErrorSnackbar] = useState(false);
  const [errorSnackbarMessage, setErrorSnackbarMessage] = useState('');

  useEffect(() => {
    setDisableAppendButton(true);
    chrome.declarativeNetRequest
      .getDynamicRules()
      .then(rules => {
        setReqList(rules);
      })
      .catch(reasen => {
        console.error(reasen);
        setErrorSnackbarMessage('잠시 후 다시 시도해주세요');
      })
      .finally(() => {
        setDisableAppendButton(false);
      });
  }, []);

  function handleSnackbarClose() {
    setShowErrorSnackbar(false);
  }

  function appendRuleset() {
    setDisableAppendButton(true);
  }

  return (
    <>
      <PopupHeader />
      <PopupContent>
        <Stack alignItems="center" spacing={1}>
          <Box alignItems="center">
            <h1>추가할 헤더 목록</h1>
          </Box>

          <Button
            className="append-button"
            variant="contained"
            disabled={disableAppendButton}
            onClick={appendRuleset}
          >
            Append Ruleset
          </Button>
        </Stack>
      </PopupContent>
      <Snackbar open={showErrorSnackbar} autoHideDuration={5000} onClose={handleSnackbarClose}>
        <Alert className="alert-snackbar-alert" severity="error" onClose={handleSnackbarClose}>
          {errorSnackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}

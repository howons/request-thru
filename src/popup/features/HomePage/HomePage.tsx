import { ReactElement, useState } from 'react';

import { Alert, Button, Snackbar, Stack } from '@mui/material';
import Box from '@mui/material/Box';

import PopupContent from '../../components/PopupContent/PopupContent';
import PopupHeader from '../../components/PopupHeader/PopupHeader';
import Ruleset from '../../components/Ruleset/Ruleset';

import './HomePage.css';
import { useRuleList } from './useRuleList';

export default function HomePage(): ReactElement {
  const [disableAppendButton, setDisableAppendButton] = useState<boolean>(false);

  const [showErrorSnackbar, setShowErrorSnackbar] = useState(false);
  const [errorSnackbarMessage, setErrorSnackbarMessage] = useState('');

  const { initUrlRuleRef, urlList, setUrlList, newRuleId, setNewRuleId } = useRuleList({
    onBeforeInit() {
      setDisableAppendButton(true);
    },
    onCatch(reason) {
      console.error(reason);
      setErrorSnackbarMessage('확장 프로그램을 다시 실행해주세요');
    },
    onAfterInit() {
      setDisableAppendButton(false);
    }
  });

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
          {urlList.map((url, index) => (
            <Ruleset
              key={url}
              url={url}
              updateUrl={(newUrl: string) => {
                setUrlList(prevUrlList =>
                  prevUrlList.map((prevUrl, i) => (i === index ? newUrl : prevUrl))
                );
              }}
              initRules={initUrlRuleRef.current[url] ?? []}
            />
          ))}
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

import { ReactElement, useState } from 'react';

import { Alert, Button, Snackbar, Stack } from '@mui/material';
import Box from '@mui/material/Box';

import PopupContent from '../../components/PopupContent/PopupContent';
import PopupHeader from '../../components/PopupHeader/PopupHeader';
import Ruleset from '../../components/Ruleset/Ruleset';

import './HomePage.css';
import { useLoadRule } from './useLoadRule';

export default function HomePage(): ReactElement {
  const [disableAppendButton, setDisableAppendButton] = useState<boolean>(false);

  const [showErrorSnackbar, setShowErrorSnackbar] = useState(false);
  const [errorSnackbarMessage, setErrorSnackbarMessage] = useState('');

  const chromeApiHandlers = {
    onBefore() {
      setDisableAppendButton(true);
    },
    onCatch(reason: any) {
      console.error(reason);
      setErrorSnackbarMessage('확장 프로그램을 다시 실행해주세요');
    },
    onAfter() {
      setDisableAppendButton(false);
    }
  };
  const { ruleList, setRuleList, newRuleId, setNewRuleId } = useLoadRule(chromeApiHandlers);

  function handleSnackbarClose() {
    setShowErrorSnackbar(false);
  }

  function appendRule() {
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
          {ruleList.map(rule => (
            <Ruleset
              key={rule.id}
              rule={rule}
              updateRule={(newRule: chrome.declarativeNetRequest.Rule) => {
                chromeApiHandlers.onBefore();
                setRuleList(prevRuleList =>
                  prevRuleList.map(prevRule => (prevRule.id === newRule.id ? newRule : prevRule))
                );
                chrome.declarativeNetRequest
                  .updateDynamicRules({
                    addRules: [newRule]
                  })
                  .catch(chromeApiHandlers.onCatch)
                  .finally(chromeApiHandlers.onAfter);
              }}
            />
          ))}
          <Button
            className="append-button"
            variant="contained"
            disabled={disableAppendButton}
            onClick={appendRule}
          >
            Append Rule
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

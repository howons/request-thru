import { CheckBox } from '@mui/icons-material';
import { ListItem, TextField } from '@mui/material';

type Props = {
  headerInfo: chrome.declarativeNetRequest.ModifyHeaderInfo;
  updateRule: (newRule: chrome.declarativeNetRequest.Rule) => void;
};

export default function RuleItem({ headerInfo, updateRule }: Props) {
  const { header, value } = headerInfo;

  return (
    <ListItem>
      <CheckBox />
      <TextField variant="outlined" label="key" type="text" defaultValue={header} />
      <TextField variant="outlined" label="value" type="text" defaultValue={value} />
    </ListItem>
  );
}

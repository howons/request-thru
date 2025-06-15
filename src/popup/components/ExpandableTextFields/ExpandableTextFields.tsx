import type { MouseEvent } from 'react';

import { Button, Stack, TextField, type TextFieldProps, Tooltip } from '@mui/material';

import './ExpandableTextFields.css';

type ExpandableTextFieldsProps = {
  list: string[];
  tooltip?: string;
  handleAppend: (e: MouseEvent<HTMLButtonElement>) => void;
  handleDelete: (e: MouseEvent<HTMLButtonElement>) => void;
} & TextFieldProps;

export default function ExpandableTextFields({
  list,
  tooltip,
  handleAppend,
  handleDelete,
  ...textFieldsProps
}: ExpandableTextFieldsProps) {
  return (
    <Stack
      direction="row"
      gap={2}
      alignItems="center"
      justifyContent="space-between"
      marginBottom={2}
    >
      <Stack direction="row" gap={2} alignItems="center">
        {list.map((value, index) => (
          <Tooltip key={index} title={tooltip}>
            <TextField
              id={`${textFieldsProps.id ?? 'item'}-${index}`}
              variant="standard"
              value={value}
              className="input"
              onClick={e => {
                e.stopPropagation();
              }}
              {...textFieldsProps}
            />
          </Tooltip>
        ))}
      </Stack>
      <Stack direction="row" gap={0.5} alignItems="center">
        <Button
          variant="outlined"
          color="primary"
          sx={{ minWidth: 0, padding: '2px 7px', margin: '7px 0' }}
          onClick={handleAppend}
        >
          +
        </Button>
        <Tooltip title="빈 칸을W 삭제합니다.">
          <Button
            variant="outlined"
            color="error"
            sx={{ minWidth: 0, padding: '2px 7px', margin: '7px 0' }}
            onClick={handleDelete}
          >
            -
          </Button>
        </Tooltip>
      </Stack>
    </Stack>
  );
}

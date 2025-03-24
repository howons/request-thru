import { ReactElement, ReactNode } from 'react';

import Box from '@mui/material/Box';

import './PopupContent.css';

export default function PopupContent({ children }: { children?: ReactNode }): ReactElement {
  return (
    <Box className="popup-content" display="flex" justifyContent="center" alignItems="center">
      {children}
    </Box>
  );
}

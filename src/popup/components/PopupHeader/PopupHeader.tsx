import { ReactElement, ReactNode } from 'react';

import { Toolbar } from '@mui/material';

import './PopupHeader.css';

export default function PopupHeader({ children }: { children?: ReactNode }): ReactElement {
  return (
    <Toolbar className="popup-header" sx={{ boxShadow: 1 }}>
      <img className="popup-logo" src="/assets/icons/icon-32.png" alt="logo" />
      <h1>Request thru</h1>
      {children}
    </Toolbar>
  );
}

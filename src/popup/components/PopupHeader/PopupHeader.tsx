import { ReactElement, ReactNode } from 'react';

import ExtensionRoundedIcon from '@mui/icons-material/ExtensionRounded';
import { Toolbar } from '@mui/material';

import './PopupHeader.css';

export default function PopupHeader({ children }: { children?: ReactNode }): ReactElement {
    return (
        <Toolbar className="popup-header" sx={{ boxShadow: 1 }}>
            <ExtensionRoundedIcon className="popup-logo" />
            <h1>Request thru</h1>
            {children}
        </Toolbar>
    );
}

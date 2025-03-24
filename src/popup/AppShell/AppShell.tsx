import { ReactElement, ReactNode, useEffect } from 'react';

import { useNavigate } from 'react-router-dom';

import './AppShell.css';

export default function AppShell({ children }: { children?: ReactNode }): ReactElement {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/home-page');
  }, [navigate]);

  return <div className="App">{children}</div>;
}

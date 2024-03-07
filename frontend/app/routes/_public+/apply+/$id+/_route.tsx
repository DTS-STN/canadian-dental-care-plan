import { useEffect } from 'react';

import { Outlet, useNavigate } from '@remix-run/react';

/**
 * The parent route of all /apply/{id}/* routes, used to
 * redirect to /apply if the flow has not yet been initialized.
 */
export default function Route() {
  const navigate = useNavigate();

  useEffect(() => {
    // redirect to start if the flow has not yet been initialized
    const flowState = sessionStorage.getItem('flow.state');
    if (flowState !== 'active') navigate('/apply');
  }, [navigate]);

  return <Outlet />;
}

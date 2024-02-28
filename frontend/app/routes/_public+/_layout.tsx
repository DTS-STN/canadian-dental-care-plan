import { Outlet } from '@remix-run/react';

export default function PublicLayout() {
  return (
    <>
      <h1>Public Routes Layout</h1>
      <div>
        <Outlet />
      </div>
    </>
  );
}

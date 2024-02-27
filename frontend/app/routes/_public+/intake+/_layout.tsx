import { Outlet } from '@remix-run/react';

export default function IntakeLayout() {
  return (
    <>
      <h2>Intake Form Layout</h2>
      <div>
        <Outlet />
      </div>
    </>
  );
}

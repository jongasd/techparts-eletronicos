import { Outlet } from 'react-router-dom';

function Layout() {
  return (
    <div>
      <h1>Layout funcionando!</h1>

      <Outlet />
    </div>
  );
}

export default Layout;
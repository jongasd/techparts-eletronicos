
import { useState } from 'react';
import { Outlet } from 'react-router-dom';

import Sidebar from '../Sidebar/Sidebar';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';

import './Layout.css';

function Layout() {
    const [menuAberto, setMenuAberto] = useState(true);

    return (
        <div className={`dashboard-layout ${menuAberto ? '' : 'sidebar-recolhida'}`}>

            <Sidebar
                menuAberto={menuAberto}
                setMenuAberto={setMenuAberto}
            />

            <div className="dashboard-content">

                <Header />

                <main className="dashboard-main">
                    <Outlet />
                </main>

                <Footer />

            </div>
        </div>
    );
}

export default Layout;

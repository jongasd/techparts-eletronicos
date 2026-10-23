import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Dashboard from './pages/Dashboard/Dashboard';
import Login from './pages/Login/Login'
import Register from './pages/Register/Register'
import Home from './pages/Home/Home'
import Perfil from './pages/Perfil/Perfil'

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path='/' element={<Login/>}/>
                <Route path='/register' element={<Register/>}/>
                <Route path='/home' element={<Home/>}/>
                <Route path='/perfil' element={<Perfil/>}/>
                <Route path='/dashboard' element={<Dashboard/>}/>
            </Routes>
        </BrowserRouter>
    )
}

export default App
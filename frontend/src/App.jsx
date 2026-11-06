import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Login from './pages/Login/Login'
import Register from './pages/Register/Register'
import Home from './pages/Home/Home'
import Clientes from './pages/Clients/Clients';
import Employee from './pages/Employee/Employee'

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path='/' element={<Login/>}/>
                <Route path='/register' element={<Register/>}/>
                <Route path='/home' element={<Home/>}/>
                <Route path='/clientes' element={<Clientes/>}/>
                <Route path='/employee' element={<Employee/>}/>
            </Routes>
        </BrowserRouter>
    )
}

export default App;
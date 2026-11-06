import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';

import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Home from './pages/Home/Home';
import Perfil from './pages/Perfil/Perfil';

import Dashboard from './pages/Dashboard/Dashboard';
import System from './pages/System/System';

import Stock from './pages/Stock/Stock';

import Clientes from './pages/Clients/Clients';
import Employee from './pages/Employee/Employee'

function App() {
<<<<<<< HEAD
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
=======
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<Home />} />
        <Route path="/perfil" element={<Perfil />} />

        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/sistema" element={<System />} />
          <Route path="/estoque" element={<Stock />} />
           <Route path='/clientes' element={<Clientes/>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
>>>>>>> c72f84f248c43936b68bc2f64ab7c8df9fceaaf2

export default App;
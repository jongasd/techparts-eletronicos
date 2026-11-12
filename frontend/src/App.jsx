import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import VLibras from './components/VLibras/VLibras';
import Layout from './components/Layout/Layout';

import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Home from './pages/Home/Home';
import Perfil from './pages/Perfil/Perfil';
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword";

import Dashboard from './pages/Dashboard/Dashboard';
import System from './pages/System/System';
import Products from './pages/Products/Products';
import Stock from './pages/Stock/Stock';
import Clientes from './pages/Clients/Clients';
import Employee from './pages/Employee/Employee'

function App() {
  return (
    <BrowserRouter>
      <VLibras />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<Home />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/recuperar-senha" element={<ForgotPassword />} />

        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/sistema" element={<System />} />
          <Route path='/produtos' element={<Products/>} />
          <Route path="/estoque" element={<Stock />} />
          <Route path='/clientes' element={<Clientes/>} />
          <Route path='/funcionarios' element={<Employee/>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App;

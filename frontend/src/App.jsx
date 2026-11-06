import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Home from './pages/Home/Home';
import Perfil from './pages/Perfil/Perfil';

import Dashboard from './pages/Dashboard/Dashboard';
import System from './pages/System/System';
import Stock from './pages/Stock/Stock';

import Layout from './components/Layout/Layout';

function App() {
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
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
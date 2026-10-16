import '../node_modules/bootstrap/dist/css/bootstrap.min.css';

import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Login from './components/Login'
import Register from './components/Register'

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path='/' element={<Login/>}/>
                <Route path='/register' element={<Register/>}/>
            </Routes>
        </BrowserRouter>
    )
}

import '../node_modules/bootstrap/dist/js/bootstrap.bundle.min.js';
export default App
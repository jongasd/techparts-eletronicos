import './ProductCard.css'
import { useState } from 'react';

function ProductCard({produto, onComprar}){
    const [guardar, setGuardar] = useState(false)
    return(
        <div className='product-card card h-100'>
            <div className='card-body'>
                <h2 className='card-title'>{produto.nome}</h2>
                <p className='card-text'>{produto.categoria}</p>
                <p className='card-text product-price'>R${produto.preco}</p>
                <button className='btn mt-3 w-100 product-button' onClick={() => {
                    onComprar(produto)
                    setGuardar(true)
                }} >{guardar ? 'Adicionado' : 'Comprar'}</button>
                {guardar && <p>Produto adicionado ao carrinho!</p>}
            </div>
        </div>
    )
}

export default ProductCard;
import './Footer.css'

function Footer({ano, nomeLoja}){
    return(
        <footer className='autoparts-footer'>
            <p>{nomeLoja} &copy; {ano}</p>
            <p>Sua loja de peças automotivas</p>
        </footer>
    )
}

export default Footer;
import { useEffect } from 'react';

function VLibras() {
    useEffect(() => {
        const script = document.createElement('script');

        script.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
        script.async = true;

        script.onload = () => {
            if (window.VLibras) {
                new window.VLibras.Widget(
                    'https://vlibras.gov.br/app'
                );
            }
        };

        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    return (
        <div vw className="enabled">
            <div vw-access-button className="active"></div>

            <div vw-plugin-wrapper>
                <div className="vw-plugin-top-wrapper"></div>
            </div>
        </div>
    );
}

export default VLibras;

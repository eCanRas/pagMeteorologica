document.addEventListener('DOMContentLoaded', function () { 
    const container = document.getElementById('container');
    const title = document.getElementById('title');

    const baseUrl = 'https://www.el-tiempo.net/api/json/v2';

    async function obtener_codigo_provincia(nombreProvincia) {
        // Obtener código de la provincia
        let response = await fetch(`${baseUrl}/provincias`);
        let data = await response.json();
        let codigoProvincia = data.provincias.find(p => p.NOMBRE_PROVINCIA.toLowerCase().includes(nombreProvincia.toLowerCase())).CODPROV;
        return codigoProvincia;
    }

    async function obtener_codigo_municipio(nombreMunicipio, codigoProvincia) {
        // Obtener código del municipio
        response = await fetch(`${baseUrl}/provincias/${codigoProvincia}/municipios`);
        data = await response.json();
        let codigoMunicipio = data.municipios.find(m => m.NOMBRE.toLowerCase().includes(nombreMunicipio.toLowerCase())).CODIGOINE.slice(0, 5);
        return codigoMunicipio;
    }

    function mostrarTiempo(datos) {
        const { NOMBRE } = datos.municipio;
        const { temperatura_actual, temperaturas, stateSky, humedad, viento } = datos;
        
        title.innerHTML = `
            <h1>El tiempo en ${NOMBRE}</h1>
        `;
        container.innerHTML = `
            <h2>Ciudad: ${NOMBRE}</h2>
            <p>Temperatura actual: ${temperatura_actual}°C</p>
            <p>Temperatura máxima: ${temperaturas.max}°C</p>
            <p>Temperatura mínima: ${temperaturas.min}°C</p>
            <p>Descripción: ${stateSky.description}</p>
            <p>Humedad: ${humedad}%</p>
            <p>Velocidad del viento: ${viento} km/h</p>
        `;
    }

    function obtenerUbicacion() {
        return new Promise((resolve, reject) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(async function (position) {
                    const { latitude, longitude } = position.coords;
                    
                    try {
                        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                        const data = await response.json();
                        const { state, town, city, village } = data.address;
    
                        const municipio = town || city || village;
                        const provincia = state;
    
                        if (provincia && municipio) {
                            resolve({ provincia, municipio });
                        } else {
                            reject('No se pudo determinar la provincia o el municipio.');
                        }
                    } catch (error) {
                        console.error('Error al obtener la ubicación:', error);
                        reject('Error al obtener la ubicación.');
                    }
                }, function (error) {
                    console.error('Error en la geolocalización:', error);
                    reject('Error en la geolocalización.');
                });
            } else {
                reject('La geolocalización no es compatible con este navegador.');
            }
        });
    }

    async function obtenerTiempo() {
        try {
            let { provincia, municipio } = await obtenerUbicacion();
            console.log(`Provincia: ${provincia}, Municipio: ${municipio}`);
        
            // provincia = "Córdoba";
            // municipio =  "Cabra";
            codigoProvincia = await obtener_codigo_provincia(provincia);
            codigoMunicipio = await obtener_codigo_municipio(municipio, codigoProvincia);

            // Obtener datos meteorológicos
            response = await fetch(`${baseUrl}/provincias/${codigoProvincia}/municipios/${codigoMunicipio}`);
            let tiempo = await response.json();

            mostrarTiempo(tiempo);

        } catch (error) {
            console.error('Error al obtener los datos:', error);
            container.innerHTML = '<p>Error al obtener los datos meteorológicos.</p>';
        }
    }

    obtenerTiempo();
});
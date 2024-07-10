document.addEventListener('DOMContentLoaded', function () { 
    const container = document.getElementById('container');
    const title = document.getElementById('title');
    const errorZone = document.getElementById('error');
    const ubicacion = document.getElementById('ubicacion')

    const baseUrl = 'https://www.el-tiempo.net/api/json/v2';

    function obtener_codigo_provincia(nombreProvincia) {
        // Obtener código de la provincia
        return new Promise(async (resolve, reject) => {
            try {
                const response = await fetch(`${baseUrl}/provincias`);
                const data = await response.json();
                let codigoProvincia = data.provincias.find(p => p.NOMBRE_PROVINCIA.toLowerCase().includes(nombreProvincia.toLowerCase())).CODPROV;
                resolve(codigoProvincia);
            } catch (error) {
                console.error('Error al obtener los datos:', error);
                reject(`Error al obtener los datos meteorológicos.`);
            }
        });
    }

    function obtener_codigo_municipio(nombreMunicipio, codigoProvincia) {
        // Obtener código del municipio
        return new Promise(async (resolve, reject) => {
            try {
                const response = await fetch(`${baseUrl}/provincias/${codigoProvincia}/municipios`);
                const data = await response.json();
                let codigoMunicipio = data.municipios.find(m => m.NOMBRE.toLowerCase().includes(nombreMunicipio.toLowerCase())).CODIGOINE.slice(0, 5);
                resolve(codigoMunicipio);
            } catch (error) {
                console.error('Error al obtener los datos:', error);
                reject(`Error al obtener los datos meteorológicos.`);
            }
        });
    }

    function mostrarTiempo(datos) {
        const { NOMBRE } = datos.municipio;
        const { temperatura_actual, temperaturas, stateSky, humedad, viento } = datos;

        const ahora = new Date(); // Crea un objeto Date con la fecha y hora actual
        const horas = ahora.getHours(); // Obtiene la hora (0-23)
        const minutos = ahora.getMinutes(); // Obtiene los minutos (0-59)
        const segundos = ahora.getSeconds(); // Obtiene los segundos (0-59)

        
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
            <p>Ultima actualizacion: ${horas}:${minutos}:${segundos}</p>
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
                        const { county, state_district, town, city, village } = data.address;

                        const municipio = town || city || village;
                        const provincia = county || state_district;
    
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
            try {
                let { provincia, municipio } = await obtenerUbicacion();
                ubicacion.innerHTML = `Provincia: ${provincia}, Municipio: ${municipio}`;
            } catch (error) {
                provincia = "Córdoba";
                municipio =  "Cabra";
            }
            
            codigoProvincia = await obtener_codigo_provincia(provincia);
            codigoMunicipio = await obtener_codigo_municipio(municipio, codigoProvincia);

            // Obtener datos meteorológicos
            response = await fetch(`${baseUrl}/provincias/${codigoProvincia}/municipios/${codigoMunicipio}`);
            let tiempo = await response.json();

            mostrarTiempo(tiempo);

        } catch (error) {
            errorZone.innerHTML = `<p>${error}</p>`;
        }
    }

    obtenerTiempo();
});
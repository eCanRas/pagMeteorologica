document.addEventListener('DOMContentLoaded', async () => { 

    const provinciasSelect = document.getElementById('provincias');
    const municipiosSelect = document.getElementById('municipios');

    const baseUrl = 'https://www.el-tiempo.net/api/json/v2';

    function eliminarDiacriticos(texto) {
        return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }

    function obtener_codigo_provincia(nombreProvincia) {
        // Obtener código de la provincia
        return new Promise(async (resolve, reject) => {
            try {
                nombreProvincia = eliminarDiacriticos(nombreProvincia.toLowerCase());
                const response = await fetch(`${baseUrl}/provincias`);
                const data = await response.json();
            
                let codigoProvincia = data.provincias.find(p => {
                    p = eliminarDiacriticos(p.NOMBRE_PROVINCIA.toLowerCase());

                    return p === nombreProvincia
                        || p.includes(`\/${nombreProvincia}`)
                        || p.includes(`${nombreProvincia}\/`);
                }).CODPROV;
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
                nombreMunicipio = eliminarDiacriticos(nombreMunicipio.toLowerCase());
                const response = await fetch(`${baseUrl}/provincias/${codigoProvincia}/municipios`);
                const data = await response.json();
                let codigoMunicipio = data.municipios.find(m => {
                    m = eliminarDiacriticos(m.NOMBRE.toLowerCase());

                    return m === nombreMunicipio
                        || m.includes(`\/${nombreMunicipio}`)
                        || m.includes(`${nombreMunicipio}\/`);
                }).CODIGOINE.slice(0, 5);
                resolve(codigoMunicipio);
            } catch (error) {
                console.error('Error al obtener los datos:', error);
                reject(`Error al obtener los datos meteorológicos.`);
            }
        });
    }

    /**
     * Funcion para muestrar los datos meteorologicos a partir de un json
     * @param datos 
     */
    function mostrarTiempo(datos, container, title) {
        const { NOMBRE } = datos.municipio;
        const { temperatura_actual, temperaturas, stateSky, humedad, viento } = datos;

        const ahora = new Date(); // Crea un objeto Date con la fecha y hora actual
        const horas = ahora.getHours(); // Obtiene la hora (0-23)
        const minutos = ahora.getMinutes(); // Obtiene los minutos (0-59)
        const segundos = ahora.getSeconds(); // Obtiene los segundos (0-59)

        
        title.innerHTML = `
            <h1>El tiempo en ${NOMBRE}</h1>
        `;
        container.innerHTML = 
            //<h2>Ciudad: ${NOMBRE}</h2>
            `<p>Temperatura actual: ${temperatura_actual}°C</p>
            <p>Temperatura máxima: ${temperaturas.max}°C</p>
            <p>Temperatura mínima: ${temperaturas.min}°C</p>
            <p>Descripción: ${stateSky.description}</p>
            <p>Humedad: ${humedad}%</p>
            <p>Velocidad del viento: ${viento} km/h</p>
            <p>Ultima actualizacion: ${horas}:${minutos}:${segundos}</p>
        `;
    }

    /**
     * Funcion para obtener la ubicacion del dispositivo
     * @returns municipio y provincia en la que se encuentra el dispositivo
     */
    function obtenerUbicacion() {
        return new Promise((resolve, reject) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(async function (position) {
                    const { latitude, longitude } = position.coords;
                    
                    try {
                        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                        const data = await response.json();
                        const { province, town, city, village } = data.address;

                        const municipio = town || city || village;
                        const provincia = province;

    
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

    async function obtenerTiempo(provincia, municipio) {
        const container = document.getElementById(`container`);
        const title = document.getElementById(`title`);
        const errorZone = document.getElementById(`error`);
        const ubicacion = document.getElementById(`ubicacion`);

        try {
            if (provincia === undefined && municipio === undefined) {
                var { provincia, municipio } = await obtenerUbicacion();
                
                ubicacion.innerHTML = `<h1>Provincia: ${provincia}, Municipio: ${municipio}</h1>`;
            } else {
                ubicacion.innerHTML = `<h1>Provincia: ${provincia}, Municipio: ${municipio}</h1>`;
            }

            codigoProvincia = await obtener_codigo_provincia(provincia);
            codigoMunicipio = await obtener_codigo_municipio(municipio, codigoProvincia);

            // Obtener datos meteorológicos
            response = await fetch(`${baseUrl}/provincias/${codigoProvincia}/municipios/${codigoMunicipio}`);
            let tiempo = await response.json();

            mostrarTiempo(tiempo, container, title);

        } catch (error) {
            errorZone.innerHTML = `<p>${error}</p>`;
        }
    }

    obtenerTiempo();



    async function obtenerProvincias() {
        return new Promise(async (resolve, reject) => {
            try {
                const response = await fetch(`${baseUrl}/provincias`);
                const data = await response.json();
                resolve (data.provincias);
            } catch (error) {
                console.error('Error al mostrar las provincias: ', error);
                reject(`Error al mostrar las provincias.`);
            }
        });        
    }

    async function obtenerMunicipios(codigoProvincia) {
        return new Promise(async (resolve, reject) => {
            try {
                const response = await fetch(`${baseUrl}/provincias/${codigoProvincia}/municipios`);
                const data = await response.json();
                resolve (data.municipios);
            } catch (error) {
                console.error('Error al mostrar los municipios: ', error);
                reject(`Error al mostrar los municipios.`);
            }
        });
    }

    try {
        const provincias = await obtenerProvincias();
        provincias.forEach(provincia => {
            const option = document.createElement('option');
            option.value = provincia.CODPROV;
            option.textContent = provincia.NOMBRE_PROVINCIA;
            provinciasSelect.appendChild(option);
        });

        provinciasSelect.addEventListener('change', async () => {
            //document.getElementById('selectorMunicipio').style.visibility = 'visible'
            municipiosSelect.innerHTML = '<option value="">Seleccione un municipio</option>'; // Limpiar municipios
            const codigoProvincia = provinciasSelect.value;

            if (codigoProvincia) {
                const municipios = await obtenerMunicipios(codigoProvincia);
                
                municipios.forEach(municipio => {
                    const option = document.createElement('option');
                    option.value = municipio.CODPROV;
                    option.textContent = municipio.NOMBRE;
                    municipiosSelect.appendChild(option);
                });
            }
        });

        municipiosSelect.addEventListener('change', () => {
            const municipioNombre = municipiosSelect.options[municipiosSelect.selectedIndex].text;
            const provinciaNombre = provinciasSelect.options[provinciasSelect.selectedIndex].text;

            if(codigoProvincia && codigoMunicipio) {
                obtenerTiempo(provinciaNombre, municipioNombre)
            }
        });
    } catch (error) {
        console.log(error)
    }

});
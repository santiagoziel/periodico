import { ArticleIdentifier } from "../../symbols/entities"
import { knownError } from "../../symbols/error-models"
import { failure, success } from "../../symbols/functors"
import { NewsSource } from "../source-interface"

export const dummySource: NewsSource = {
    name: "dummy",
    getTitles: async () => {
        return success({titles: [
            {url: "https://dummy1.com/news/1", title: "Terremoto de magnitud 6,5 sacude la costa de Oaxaca"},
            {url: "https://dummy1.com/news/2", title: "El peso mexicano alcanza su mejor nivel en 5 años"},
            {url: "https://dummy1.com/news/3", title: "Inauguran nueva línea del metro en la Ciudad de México"},
            {url: "https://dummy1.com/news/4", title: "Selección mexicana vence 3-1 a Estados Unidos en partido amistoso"},
        ]})
    },

    fetchArticle: async (articleInfo: ArticleIdentifier) => {
        const dummyArticles: Record<string, string> = {
            "https://dummy1.com/news/1": `
Un sismo de magnitud 6.5 en la escala de Richter sacudió la costa de Oaxaca esta madrugada, causando alarma entre los habitantes de la región. Según el Servicio Sismológico Nacional, el epicentro se localizó a 45 kilómetros al sureste de Puerto Escondido, a una profundidad de 10 kilómetros.

Las autoridades de Protección Civil reportaron daños menores en algunas viviendas de comunidades cercanas al epicentro. No se reportaron víctimas mortales ni heridos de gravedad. El gobernador del estado activó los protocolos de emergencia y desplegó brigadas de evaluación en las zonas afectadas.

Residentes de la Ciudad de México también sintieron el movimiento telúrico, aunque con menor intensidad. La alerta sísmica se activó segundos antes del sismo, permitiendo que miles de personas evacuaran edificios de manera ordenada.

Expertos del Instituto de Geofísica de la UNAM indicaron que este sismo es parte de la actividad normal de la zona, considerada una de las más sísmicas del país debido a la interacción de las placas tectónicas de Cocos y Norteamericana.
            `.trim(),

            "https://dummy1.com/news/2": `
El peso mexicano cerró la jornada con una cotización de 16.50 por dólar, su mejor nivel desde 2021, impulsado por el diferencial de tasas de interés y el optimismo de los inversionistas extranjeros sobre la economía nacional.

Analistas de Banco de México atribuyen la fortaleza de la moneda a varios factores: las remesas récord que superaron los 60 mil millones de dólares anuales, la relocalización de empresas manufactureras (nearshoring) y las tasas de interés atractivas que ofrece el país.

"El peso se ha convertido en una de las monedas más rentables para operaciones de carry trade", explicó María González, economista jefe de BBVA México. "Los inversionistas institucionales siguen apostando por activos mexicanos".

Sin embargo, algunos sectores expresaron preocupación por el impacto en las exportaciones. El Consejo Coordinador Empresarial señaló que un peso fuerte encarece los productos mexicanos en el exterior, afectando la competitividad de la industria manufacturera.

El Banco de México mantiene su tasa de referencia en 11%, mientras evalúa el momento apropiado para comenzar un ciclo de recortes graduales.
            `.trim(),

            "https://dummy1.com/news/3": `
Con una inversión de más de 35 mil millones de pesos, la jefa de gobierno inauguró hoy la Línea 13 del Sistema de Transporte Colectivo Metro, que conectará el oriente con el poniente de la capital en tan solo 40 minutos.

La nueva línea cuenta con 15 estaciones y utilizará trenes de última generación con aire acondicionado, sistemas de accesibilidad universal y tecnología anticolisión. Se estima que beneficiará a más de 400 mil usuarios diariamente.

"Esta obra representa el proyecto de infraestructura de transporte más importante de la última década", declaró la mandataria durante la ceremonia de inauguración en la estación Observatorio. "Estamos transformando la movilidad de nuestra ciudad".

La construcción, que tardó cuatro años, enfrentó diversos desafíos incluyendo la pandemia y hallazgos arqueológicos que requirieron la intervención del INAH. En la estación Zócalo se descubrieron vestigios del antiguo Templo Mayor que serán exhibidos en un museo subterráneo.

Los primeros tres días el servicio será gratuito, posteriormente costará el mismo precio que las demás líneas del metro.
            `.trim(),

            "https://dummy1.com/news/4": `
La Selección Mexicana de Fútbol logró una contundente victoria de 3-1 sobre Estados Unidos en el estadio Azteca, en lo que fue el primer partido del nuevo director técnico al frente del equipo nacional.

Los goles mexicanos fueron obra de Santiago Giménez al minuto 23, Hirving Lozano al 56 y Edson Álvarez con un espectacular tiro libre al 78. El descuento estadounidense llegó por conducto de Christian Pulisic al 67.

El Azteca, con un lleno total de más de 85 mil aficionados, vibró con cada jugada del Tri. El ambiente en las gradas recordó las grandes noches de la selección en el coloso de Santa Úrsula.

"Estoy muy contento con la actitud de los jugadores", declaró el técnico en conferencia de prensa. "Este es apenas el inicio de un proyecto que busca recuperar el prestigio de la selección mexicana".

El próximo compromiso del Tri será contra Argentina en Los Ángeles, como parte de la preparación rumbo a la Copa del Mundo. La convocatoria para ese encuentro se dará a conocer la próxima semana.
            `.trim()
        }

        const content = dummyArticles[articleInfo.url]
        if(!content) return failure(knownError("Titulo no encontrado"))
        return success({content, url: articleInfo.url})
    }
}
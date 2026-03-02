import { ArticleIdentifier } from "../../symbols/entities"
import { knownError } from "../../symbols/error-models"
import { failure, success } from "../../symbols/functors"
import { NewsSource } from "../source-interface"

export const dummySource2: NewsSource = {
    name: "dummy2",
    earliestDate: new Date(),
    getTitles: async () => {
        return success({titles: [
            {url: "https://dummy2.com/news/5", title: "Fuerte sismo de 6.5 grados afecta región costera de Oaxaca"},
            {url: "https://dummy2.com/news/6", title: "Lluvias intensas provocan inundaciones en Tabasco"},
            {url: "https://dummy2.com/news/7", title: "México derrota a USA con marcador de 3 a 1 en encuentro de fútbol"},
            {url: "https://dummy2.com/news/8", title: "Científicos mexicanos descubren nueva especie de mariposa"},
        ]})
    },

    fetchArticle: async (articleInfo: ArticleIdentifier) => {
        const dummyArticles: Record<string, string> = {
            "https://dummy2.com/news/5": `
Un terremoto de magnitud 6.5 estremeció las costas de Oaxaca durante las primeras horas de la mañana, generando pánico entre la población local. El Centro Nacional de Prevención de Desastres confirmó que el movimiento tuvo su origen a 50 kilómetros de Huatulco.

Las comunidades pesqueras de la zona reportaron grietas en algunas construcciones y caída de objetos en viviendas. Afortunadamente, no se activó ninguna alerta de tsunami y las playas permanecieron abiertas al público tras las evaluaciones correspondientes.

Equipos de rescate fueron desplegados en las zonas más afectadas para realizar inspecciones estructurales. El presidente municipal de Huatulco informó que se habilitaron tres albergues temporales para las familias cuyas viviendas resultaron dañadas.

Sismólogos advierten que réplicas de menor intensidad podrían sentirse durante las próximas 48 horas y recomiendan a la población mantenerse alerta.
            `.trim(),

            "https://dummy2.com/news/6": `
Las lluvias torrenciales que han azotado Tabasco durante los últimos cinco días han dejado más de 15 mil damnificados y decenas de comunidades incomunicadas en la región de la Chontalpa.

Los ríos Grijalva y Usumacinta alcanzaron niveles críticos, obligando a las autoridades a abrir las compuertas de la presa Peñitas para evitar un desbordamiento mayor. Sin embargo, esta medida incrementó las inundaciones en municipios río abajo.

El gobernador del estado declaró emergencia en 12 de los 17 municipios y solicitó apoyo federal para atender a los afectados. Elementos del Ejército y la Marina ya se encuentran en la zona realizando labores de evacuación con lanchas y helicópteros.

Los cultivos de plátano y cacao, principales productos agrícolas de la región, sufrieron pérdidas millonarias. La Confederación Nacional Campesina estima daños superiores a los 500 millones de pesos en el sector agropecuario.

Protección Civil pronostica que las lluvias continuarán al menos tres días más debido a la presencia de un sistema de baja presión en el Golfo de México.
            `.trim(),

            "https://dummy2.com/news/7": `
En un emocionante encuentro disputado en el Estadio Azteca, la Selección Mexicana se impuso 3-1 a su similar de Estados Unidos, extendiendo su dominio histórico en el recinto de Coapa.

El conjunto tricolor salió con todo desde el silbatazo inicial. A los 23 minutos, Santiago Giménez abrió el marcador tras una brillante jugada colectiva que involucró a cinco jugadores mexicanos.

El segundo tiempo fue aún más intenso. Hirving Lozano amplió la ventaja con un potente disparo desde fuera del área que dejó sin oportunidad al portero rival. Estados Unidos descontó por medio de Pulisic, pero Edson Álvarez sentenció el partido con un magistral tiro libre.

Los más de 85 mil aficionados presentes celebraron cada gol con euforia, creando un ambiente que los jugadores estadounidenses describieron como "intimidante pero inolvidable".

El técnico mexicano se mostró satisfecho con el rendimiento del equipo y adelantó que buscará mantener la misma intensidad en los próximos compromisos eliminatorios.
            `.trim(),

            "https://dummy2.com/news/8": `
Un equipo de investigadores del Instituto de Biología de la UNAM anunció el descubrimiento de una nueva especie de mariposa en la Reserva de la Biosfera de Calakmul, Campeche, un hallazgo que destaca la extraordinaria biodiversidad de las selvas mexicanas.

La nueva especie, bautizada como Morpho calakmulensis, presenta un patrón de coloración único: sus alas combinan tonos azul iridiscente con franjas doradas que no se habían observado en ninguna otra mariposa del género Morpho.

"Este descubrimiento es resultado de más de tres años de trabajo de campo en condiciones muy difíciles", explicó la Dra. Patricia Ramírez, líder del proyecto. "La selva de Calakmul sigue revelándonos secretos que ni siquiera imaginábamos".

Los científicos estiman que la población de esta mariposa es reducida, con no más de 500 individuos adultos, lo que la convierte automáticamente en una especie en riesgo. Ya se prepara una solicitud ante la SEMARNAT para incluirla en la lista de especies protegidas.

El descubrimiento será publicado en la prestigiosa revista Nature Ecology & Evolution y representa el primer registro de una nueva especie de Morpho en México en más de 40 años.
            `.trim()
        }

        const content = dummyArticles[articleInfo.url]
        if(!content) return failure(knownError("Titulo no encontrado"))
        return success({content, url: articleInfo.url})
    }
}
import { Agent } from "./agent/agent"
import { Application } from "./app/application"
import { DSL } from "./app/dsl"
import { NewsEditor } from "./newsEditor/news-editor"
import { Publisher } from "./publisher/publisher"
import { DiarioSource } from "./sources/diario.source"
import { dummySource } from "./sources/dummy/dummy-source"
import { dummySource2 } from "./sources/dummy/dummy-source2"
import { dummySource3 } from "./sources/dummy/dummy-source3"
import { Cloud } from "./storage-managers/cloud"
import { LocalStorage } from "./storage-managers/local-storage"

const main = async () => {
    const agent = new Agent()
    const newsEditor = new NewsEditor(agent)
    const localFiles = new LocalStorage()
    const cloudFiles = new Cloud() 

    const publisher = new Publisher([localFiles, cloudFiles])

    const intoleranciaSource = new DiarioSource()

    const application = new Application([intoleranciaSource], new DSL(), agent, newsEditor, publisher)
    console.log("--------------------Start------------------------------------------")
    const articlesInfo = await application.run()
    console.log(JSON.stringify(articlesInfo, null, 4))
    console.log("--------------------End------------------------------------------")
}

main().catch(console.error)
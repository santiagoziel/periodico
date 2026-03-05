import { chromium } from "playwright"
import { Agent } from "./agent/agent"
import { Application } from "./app/application"
import { DSL } from "./researcher/dsl"
import { NewsEditor } from "./newsEditor/news-editor"
import { Publisher } from "./publisher/publisher"
import { DiarioSource } from "./sources/diario.source"
import { dummySource } from "./sources/dummy/dummy-source"
import { dummySource2 } from "./sources/dummy/dummy-source2"
import { dummySource3 } from "./sources/dummy/dummy-source3"
import { PueblaOnlineSource } from "./sources/puebla-online.source"
import { SintesisSource } from "./sources/sintesis.source"
import { SolSource } from "./sources/sol.source"
import { Cloud } from "./storage-managers/cloud"
import { Researcher } from "./researcher/researcher"
import { LocalStorage } from "./storage-managers/local-storage"

const main = async () => {
    const browser = await chromium.launch({ headless: true })
    
    try {
        const agent = new Agent()
        const newsEditor = new NewsEditor(agent)

        //const localFiles = new LocalStorage()
        const cloudFiles = new Cloud() 
        const publisher = new Publisher([cloudFiles])

        const earliestDate = new Date()
        const intoleranciaSource = new DiarioSource(earliestDate)
        const sintesisSource = new SintesisSource(earliestDate)
        const pueblaOnlineSource = new PueblaOnlineSource(browser, earliestDate)
        const solSource = new SolSource(browser, earliestDate)
        const sources = [intoleranciaSource, sintesisSource, pueblaOnlineSource, solSource]
        const researcher = new Researcher(sources, new DSL())
        
        const application = new Application(
            "production",
            agent, 
            newsEditor, 
            publisher,
            researcher
        )

        await application.run()
    } finally {
        await browser.close()
    }
}

main().catch(console.error)
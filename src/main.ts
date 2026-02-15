import { chromium } from "playwright"
import { Agent } from "./agent/agent"
import { Application } from "./app/application"
import { DSL } from "./app/dsl"
import { NewsEditor } from "./newsEditor/news-editor"
import { Publisher } from "./publisher/publisher"
import { DiarioSource } from "./sources/diario.source"
import { dummySource } from "./sources/dummy/dummy-source"
import { dummySource2 } from "./sources/dummy/dummy-source2"
import { dummySource3 } from "./sources/dummy/dummy-source3"
import { PueblaOnlineSource } from "./sources/puebla-online.source"
import { SintesisSource } from "./sources/sintesis.source"
import { Cloud } from "./storage-managers/cloud"
import { LocalStorage } from "./storage-managers/local-storage"

const main = async () => {
    // Initialize shared browser instance for sources that need it
    const browser = await chromium.launch({ headless: true })
    
    try {
        const agent = new Agent()
        const newsEditor = new NewsEditor(agent)
        const localFiles = new LocalStorage()
        const cloudFiles = new Cloud() 

        const publisher = new Publisher([localFiles, cloudFiles])

        const intoleranciaSource = new DiarioSource()
        const sintesisSource = new SintesisSource()
        const pueblaOnlineSource = new PueblaOnlineSource(browser)

        const sources = [intoleranciaSource, sintesisSource, pueblaOnlineSource]
        
        const application = new Application(
            sources,
            new DSL(), 
            agent, 
            newsEditor, 
            publisher
        )

        console.log("--------------------Start------------------------------------------")
        await application.run()
        console.log("--------------------End------------------------------------------")
    } finally {
        // Always clean up browser, even if an error occurs
        await browser.close()
    }
}

main().catch(console.error)
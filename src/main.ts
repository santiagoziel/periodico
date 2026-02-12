import { Agent } from "./agent/agent"
import { Application } from "./app/application"
import { DSL } from "./app/dsl"
import { NewsEditor } from "./newsEditor/news-editor"
import { dummySource } from "./sources/dummy/dummy-source"
import { dummySource2 } from "./sources/dummy/dummy-source2"
import { dummySource3 } from "./sources/dummy/dummy-source3"

const main = async () => {
    const agent = new Agent()
    const newsEditor = new NewsEditor(agent)
    const application = new Application([dummySource, dummySource2, dummySource3], new DSL(), agent, newsEditor )
    const articlesInfo = await application.run()
    console.log(JSON.stringify(articlesInfo, null, 4))
}

main().catch(console.error)
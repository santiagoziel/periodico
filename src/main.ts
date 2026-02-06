import { Agent } from "./agent/agent"
import { Application } from "./app/application"
import { DSL } from "./app/dsl"
import { dummySource } from "./sources/dummy/dummy-source"
import { dummySource2 } from "./sources/dummy/dummy-source2"
import { dummySource3 } from "./sources/dummy/dummy-source3"

const main = async () => {
    const application = new Application([dummySource, dummySource2, dummySource3], new DSL(), new Agent())
    const articlesInfo = await application.run()
    console.log(JSON.stringify(articlesInfo, null, 4))
}

main().catch(console.error)
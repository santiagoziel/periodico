import { Application } from "./app/application"
import { DSL } from "./app/dsl"
import { dummySource } from "./sources/dummy/dummy-source"
import { dummySource2 } from "./sources/dummy/dummy-source2"

const main = async () => {
    const application = new Application([dummySource, dummySource2], new DSL())
    const articlesInfo = await application.run()
    console.log(articlesInfo)
}

main().catch(console.error)
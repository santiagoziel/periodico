import { Application } from "./app/application"
import { dummySource } from "./sources/dummy/dummy-source"

const main = async () => {
    const application = new Application([dummySource])
    const articlesInfo = await application.run()
    console.log(articlesInfo)
}

main().catch(console.error)
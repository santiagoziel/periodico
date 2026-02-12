export type AgentMessage = {role: "system" | "user", content: string}
export type AgentInput = AgentMessage[]

export const systemMessage = (content: string): AgentMessage => ({role: "system", content})
export const userMessage = (content: string): AgentMessage => ({role: "user", content})
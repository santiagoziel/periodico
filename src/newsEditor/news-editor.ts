import { Agent } from "../agent/agent";
import { DraftArticle, FinalDraftArticle, NoteSections, ProcessArticleInput, ProcessSingleArticleInput, ProcessUnionArticleInput, PublishReadyArticle } from "../symbols/entities";
import { theParsedErrorFromThe } from "../symbols/error-models";
import { Attempt, attemptTo, AttemptToFetch, resolveThe, success, tryTo } from "../symbols/functors";
import {
    BorderStyle,
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
  } from "docx";

export class NewsEditor {
    constructor(private readonly agent: Agent) {}

    private draftSingleArticle = async (uploadArticleInput: ProcessSingleArticleInput): AttemptToFetch<DraftArticle> => {
        const { content, url, relevantPersons } = uploadArticleInput
        const buildDraftFrom = (wrappedFacts: {facts: string[]}) => 
            ({ facts: wrappedFacts.facts, type: "single" as const, relevantPersons, urlSection: url })

        const extractedFactsAttempt = await this.agent.extractFacts(content, relevantPersons)
        return attemptTo(buildDraftFrom, extractedFactsAttempt)
    }

    private draftUnionArticle = async (uploadArticleInput: ProcessUnionArticleInput): AttemptToFetch<DraftArticle> => {
        const {contents, urls, relevantPersons } =  uploadArticleInput

        const factsAttempts = await Promise.all(contents.map(async (content) => this.agent.extractFacts(content)))

        const facts = factsAttempts.reduce<string[]>((acc, attempt) => {
            resolveThe(attempt, 
                (payload) => {acc.push(...payload.facts)},
                (factError) => {console.error(theParsedErrorFromThe(factError))}
            )
            return acc
        }, [])

        return success({ facts, type: "union" as const, relevantPersons, urlSection: urls.join(", ") })
    }
    
    private formatNoteUsingThe = async (sections: NoteSections): Promise<FinalDraftArticle> => {
        const {note, title, urlSection, relevantPersons} = sections
        const paragraphSpacing = { spacing: { after: 240 } }; // One line between paragraphs
        const summaryParagraphs = note
            .split("\n")
            .filter(Boolean)
            .map((line) => new Paragraph({ text: line, ...paragraphSpacing }));

        const articleContainsRelevantPersons = !!(relevantPersons) && relevantPersons.length > 0;

        const metaRunStyle = { size: 20, color: "555555", italics: true };

        const metaParagraphs = [
            new Paragraph({
                children: [new TextRun({ text: `Fuente: ${urlSection}`, ...metaRunStyle })],
                ...paragraphSpacing,
            }),
            ...(articleContainsRelevantPersons
                ? [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `Personas relevantes: ${relevantPersons!.join(", ")}`,
                                ...metaRunStyle,
                            }),
                        ],
                        ...paragraphSpacing,
                    }),
                ]
                : []),
        ];

        const doc = new Document({
            sections: [
                {
                    children: [
                        new Paragraph({
                            children: [new TextRun({ text: title, bold: true, size: 32 })],
                            spacing: { after: 360 },
                        }),
                        ...summaryParagraphs,
                        new Paragraph({
                            text: "",
                            spacing: { after: 120 },
                            border: {
                                bottom: {
                                    style: BorderStyle.SINGLE,
                                    size: 6,
                                    color: "CCCCCC",
                                },
                            },
                        }),
                        ...metaParagraphs,
                    ],
                },
            ],
        });

        return {file: await Packer.toBuffer(doc), ...sections};
    }

    private greenLight = async (draft: DraftArticle): AttemptToFetch<PublishReadyArticle> => {
        const { facts, type, relevantPersons, urlSection } = draft

        const titleNoteFromThe = async (wrappedNote: {note: string}) => {
            const organizeNoteSections = (wrappedTitle: {title: string}): NoteSections => ({
                title: wrappedTitle.title, 
                note: wrappedNote.note, 
                urlSection, 
                relevantPersons
            })
            const titleAttempt = await this.agent.suggestTitle(wrappedNote.note)
            return attemptTo(organizeNoteSections, titleAttempt)
        }

        const buildPublishReadyFrom = (finalDraft: FinalDraftArticle): PublishReadyArticle => {
            const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });
            const section = draft.relevantPersons && draft.relevantPersons.length > 0 ? 
                `personasRelevantes/${draft.relevantPersons[0].toLowerCase()}` : 
                "notasRegulares"
            const filePath = `${today}/${section}`

            return {
                title: finalDraft.title,
                file: finalDraft.file,
                filePath: filePath
            }
        }

        const redactAttempt = await this.agent.redactNote(type, facts, relevantPersons)
        const titledNoteAttempt = await tryTo(titleNoteFromThe, redactAttempt)
        const finalDraftAttempt = await attemptTo(this.formatNoteUsingThe, titledNoteAttempt)
        return attemptTo(buildPublishReadyFrom, finalDraftAttempt)
    }
 
    editArticle = async (uploadArticleInput: ProcessArticleInput): AttemptToFetch<PublishReadyArticle> => {
        const draftAttempt = uploadArticleInput.type === "single" ? 
            await this.draftSingleArticle(uploadArticleInput) : 
            await this.draftUnionArticle(uploadArticleInput)
       
        return tryTo(this.greenLight, draftAttempt) 
    }
}
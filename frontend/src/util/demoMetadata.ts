export interface Prompt {
	prompt: string;
	examples: ContextExample[];
}

export interface ContextExample {
	prompt: string;
	conversationElements: ConversationElement[];
}

export interface ConversationElement {
	agent: number;
	text: string;
}

export const agents = [
	{ id: 0, name: "User" },
	{ id: 1, name: "Assistant" },
];

export function promptToString(prompt: Prompt): string {
	let result = `\n\n${prompt.prompt}`;

	for (const example of prompt.examples) {
		result += `\n\n${example.prompt}`;
		for (const element of example.conversationElements) {
			result += `\n> ${element.agent === 0 ? "User" : "Assistant"}: ${
				element.text
			}`;
		}
	}
	return result;
}

export const textSnippets = [
	"Make sure you introduce yourself appropriately, example:",
	"Hello. Thank you for calling Rivertown Insurance. How can I help you?",
	"When people provide numbers like their security number, make sure that you repeat the number back to them to confirm that you have the correct number, example:",
	"Is the account number eight digit or ten digit?",
	"It is eight digit.",
	"Okay. Four five.",
	"Four five.",
];

export const tasks = [
	{ id: 0, name: "text generation" },
	{ id: 1, name: "code generation" },
	{ id: 2, name: "chatbot" },
	{ id: 3, name: "chat your data" },
];

export const datasets = [
	{
		name: "gneubig/dstc11",
		href: "https://huggingface.co/datasets/gneubig/dstc11",
		description: "",
	},
	{
		name: "empathetic_dialogues",
		href: "https://huggingface.co/datasets/empathetic_dialogues",
		description:
			"Dataset curated for making open-domain conversation models more empathetic.",
	},
	{
		name: "multi_woz_v22",
		href: "https://huggingface.co/datasets/multi_woz_v22",
		description:
			"Multi-Domain Wizard-of-Oz dataset (MultiWOZ), a fully-labeled collection of human-human written conversations spanning over multiple domains and topics.",
	},
	{
		name: "allenai/prosocial-dialog",
		href: "https://huggingface.co/datasets/allenai/prosocial-dialog",
		description:
			"The first large-scale multi-turn English dialogue dataset to teach conversational agents to respond to problematic content following social norms.",
	},
	{
		name: "LL1234/CustomerService",
		href: "https://huggingface.co/datasets/LL1234/CustomerService",
		description: "",
	},
];

export const models = [
	{
		name: "GPT 3.5 Turbo",
		checked: true,
		explanation: "OpenAI model used in the ChatGPT interface.",
	},
	{
		name: "Vicuna",
		checked: true,
		explanation:
			"Open-source chatbot trained by fine-tuning LLaMA on user-shared conversations collected from ShareGPT.",
	},
	{
		name: "GPT 2",
		checked: false,
		explanation: "Smaller chatbot model from OpenAI.",
	},
];
export const featureFunctions = [
	{
		name: "Output length",
		checked: true,
		explanation: "Length of model output.",
	},
	{
		name: "Input length",
		checked: true,
		explanation: "Length of model input.",
	},
	{
		name: "Chat context length",
		checked: true,
		explanation: "Length of the input context (e.g. for chatbots).",
	},
	{
		name: "English number count",
		checked: true,
		explanation: "Number of English number words in the output.",
	},
	{
		name: "Topic clusters",
		checked: true,
		explanation: "Generate topic clusters for the data inputs.",
	},
];

export const metrics = [
	{
		name: "ChrF",
		checked: true,
		explanation:
			"Calculates the similarity between a target and reference text based on similarity of character and word n-grams.",
	},
	{
		name: "Length ratio",
		checked: true,
		explanation:
			"Calculates the ratio of the length of the target text to the length of the reference text.",
	},
	{
		name: "BERT score",
		checked: true,
		explanation:
			"Measures similarity between target and reference text using the similarity between embeddings calculated by the BERT model.",
	},
	{
		name: "Exact match",
		checked: true,
		explanation:
			"Calculates whether the target text exactly matches the reference text.",
	},
];

export const initialPrompt: Prompt = {
	prompt:
		"You are an agent at the Rivertown Insurance helpdesk that helps with resolving insurance claims.",
	examples: [],
};

export const taskDescription =
	"A customer service assistant that can chat with customers who are using our banking software.";

export const progressSteps = [
	"Checking Cache Files...",
	"Loading Model Results...",
	"Loading Functions and Metrics...",
];

export const modelSteps = [
	"Initializing model...",
	"Running inference...",
	"Evaluating feature functions...",
	"Calculating metrics...",
];

export interface DemoReport {
	elements: Array<ReportElement>;
}

export interface ReportTextElement {
	type: ReportTextElementType;
	text: string;
}

export type ReportElement = ReportTextElement | ReportChartElement;

export function isTextElement(
	element: ReportElement
): element is ReportTextElement {
	if ((element as ReportTextElement).text !== undefined) {
		return true;
	}
	return false;
}

export enum ReportTextElementType {
	HEADING = "Heading",
	SUBHEADING = "Subheading",
	TEXT = "Text",
}

export interface ReportChartElement {
	reportIndex: number;
}

export function isChartElement(
	element: ReportElement
): element is ReportChartElement {
	if ((element as ReportChartElement).reportIndex !== undefined) {
		return true;
	}
	return false;
}

export const newModelName = "{old_name}_v2";

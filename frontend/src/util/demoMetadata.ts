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
	{ id: 0, name: "classification" },
	{ id: 1, name: "segmentation" },
	{ id: 2, name: "chatbot" },
	{ id: 3, name: "text-generation" },
];

export const datasets = [
	{
		name: "gneubig/dstc11",
		href: "https://huggingface.co/datasets/gneubig/dstc11",
	},
	{
		name: "empathetic_dialogues",
		href: "https://huggingface.co/datasets/empathetic_dialogues",
	},
	{
		name: "multi_woz_v22",
		href: "https://huggingface.co/datasets/multi_woz_v22",
	},
	{
		name: "allenai/prosocial-dialog",
		href: "https://huggingface.co/datasets/allenai/prosocial-dialog",
	},
	{
		name: "LL1234/CustomerService",
		href: "https://huggingface.co/datasets/LL1234/CustomerService",
	},
];

export const featureFunctions = [
	{
		name: "Output Length",
		checked: true,
		explanation: "Length of model output.",
	},
	{
		name: "Input Length",
		checked: true,
		explanation: "Length of model input.",
	},
	{
		name: "Chat Context Length",
		checked: true,
		explanation: "Length of the input context (e.g. for chatbots).",
	},
	{
		name: "English Number Count",
		checked: true,
		explanation: "Number of English number words in the output.",
	},
	{
		name: "Label Clusters",
		checked: true,
		explanation: "Cluster the labels together to find similar sentences.",
	},
];

export const metrics = [
	{
		name: "ChrF",
		checked: true,
		explanation:
			"Metric for evaluating the similarity between a target and reference text based on similarity of character and word n-grams.",
	},
	{
		name: "length Ratio",
		checked: true,
		explanation:
			"Calculates the ratio of the length of the target text to the length of the closest reference text.",
	},
	{
		name: "BERT Score",
		checked: true,
		explanation:
			"Measuring generated text that measures the similarity between embeddings calculated by the BERT model.",
	},
	{
		name: "Exact Match",
		checked: true,
		explanation:
			"Calculates whether the target text exactly matches any of the references.",
	},
];

export const initialPrompt: Prompt = {
	prompt:
		"You are an agent at the Rivertown Insurance helpdesk that helps with resolving insurance claims.",
	examples: [],
};

export const progressSteps = [
	"Checking Cache Files...",
	"Loading Model Results...",
	"Loading Functions and Metrics...",
];

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

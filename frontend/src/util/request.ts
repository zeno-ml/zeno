interface IRequest {
	url: string;
	payload?: object;
}

export async function getRequest({ url }: { url: string }) {
	const response = await fetch(url, {
		method: "GET",
	});
	const output = await response.json();
	return JSON.parse(output);
}

export async function postRequest({
	url,
	payload = {},
}: {
	url: string;
	payload?: object;
}) {
	const response = await fetch(url, {
		method: "POST",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
		},
		body: JSON.stringify(payload),
	});
	const output = await response.json();
	return JSON.parse(output);
}

export function postEndpointGenerator(endpoint: string) {
	function postFunc({ url, payload = {} }: { url: string; payload?: object }) {
		return postRequest({ url: `${endpoint}/${url}`, payload });
	}
	return postFunc;
}

export function getEndpointGenerator(endpoint: string) {
	function getFunc({ url }: { url: string }) {
		return getRequest({ url: `${endpoint}/${url}` });
	}
	return getFunc;
}

export function requestGenerator(
	request: ({ url, payload }: IRequest) => Promise<object>,
	paramModifier: ({ url, payload }: IRequest) => IRequest,
	afterRequest: () => object
) {
	async function req({ url, payload }: IRequest) {
		const modifiedRequest = paramModifier({ url, payload });
		const output = await request(modifiedRequest);
		const afterOutput = await afterRequest();
		return { ...output, ...afterOutput };
	}
	return req;
}

const request = {
	get: getRequest,
	post: postRequest,
	generator: {
		post: postEndpointGenerator,
		get: getEndpointGenerator,
	},
};

export default request;

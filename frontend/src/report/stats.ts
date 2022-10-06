export const calculateMean = (values: number[]): number => {
	const mean = values.reduce((sum, current) => sum + current) / values.length;
	return mean;
};

export const calculateStd = (values: number[]): number => {
	const average = calculateMean(values);
	const squareDiffs = values.map((value: number): number => {
		const diff = value - average;
		return diff * diff;
	});

	const variance = calculateMean(squareDiffs);
	return Math.sqrt(variance);
};

export function regression(data) {
	let sum_x = 0,
		sum_y = 0,
		sum_xy = 0,
		sum_xx = 0,
		count = 0;

	// calculate sums
	for (let i = 0, len = data.length; i < len; i++) {
		const point = data[i];
		sum_x += point[0];
		sum_y += point[1];
		sum_xx += point[0] * point[0];
		sum_xy += point[0] * point[1];
		count++;
	}

	// calculate slope (m) and y-intercept (b) for f(x) = m * x + b
	const m = (count * sum_xy - sum_x * sum_y) / (count * sum_xx - sum_x * sum_x);
	const b = sum_y / count - (m * sum_x) / count;

	return [m, b];
}

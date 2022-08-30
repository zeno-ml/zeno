import { render } from "@testing-library/svelte";
import SliceDetails from "../src/general/SliceDetails.svelte";

test("renders details", () => {
	const { container } = render(SliceDetails, {
		predicateGroup: {
			predicates: [],
			join: "",
		},
	});

	const div = container.querySelector(".chip");
	expect(div).not.toBeNull();
});

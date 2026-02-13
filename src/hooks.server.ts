import type { Handle } from "@sveltejs/kit";
import type { ResourceType } from "$lib/resource";

export const handle: Handle = async ({ event, resolve }) => {
	const cookie = event.cookies.get("resource");
	event.locals.resource = (cookie === "water" ? "water" : "el") as ResourceType;
	return resolve(event);
};

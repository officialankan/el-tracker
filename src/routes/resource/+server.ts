import { redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, cookies }) => {
	const formData = await request.formData();
	const resource = formData.get("resource") === "water" ? "water" : "el";

	cookies.set("resource", resource, {
		path: "/",
		httpOnly: true,
		sameSite: "lax",
		maxAge: 60 * 60 * 24 * 365
	});

	const redirectTo = formData.get("redirect")?.toString() || "/";
	redirect(303, redirectTo);
};

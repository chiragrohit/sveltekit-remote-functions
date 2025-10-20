import { redirect } from "@sveltejs/kit";
import { form, getRequestEvent, query } from "$app/server";
import { auth } from "$lib/server/auth";
import { signupSchema, loginSchema, updateNameSchema } from "$lib/schema/auth";

export const signup = form(signupSchema, async (user) => {
	await auth.api.signUpEmail({ body: user });
	redirect(307, `/dashboard`);
});

export const login = form(loginSchema, async (user) => {
	const { request } = getRequestEvent();
	await auth.api.signInEmail({ body: user, headers: request.headers });
	redirect(303, "/dashboard");
});

export const signout = form(async () => {
	const { request } = getRequestEvent();
	await auth.api.signOut({ headers: request.headers });
	redirect(303, "/");
});

export const isAuthenticated = query(async () => {
	const { locals } = getRequestEvent();
	console.log("isAuthenticated called");
	return locals.user ? true : false;
});

export const getUser = query(async () => {
	const { locals } = getRequestEvent();
	if (!locals.user) {
		redirect(307, "/auth/login");
	}
	return locals.user;
});

export const updateName = form(updateNameSchema, async (data) => {
	const { request } = getRequestEvent();
	const { locals } = getRequestEvent();

	if (!locals.user) {
		return {
			success: false,
			message: "User not authenticated",
		};
	}

	// Additional check to ensure name is not empty after trimming
	if (!data.name || data.name.trim().length === 0) {
		return {
			success: false,
			message: "Name cannot be empty or contain only spaces",
		};
	}

	try {
		await auth.api.updateUser({
			body: { name: data.name },
			headers: request.headers,
		});

		return {
			success: true,
			message: "Name updated successfully",
		};
	} catch (error) {
		return {
			success: false,
			message:
				error instanceof Error
					? error.message
					: "Failed to update name",
		};
	}
});

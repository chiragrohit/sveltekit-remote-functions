import { svelteKitHandler } from "better-auth/svelte-kit";
import { auth } from "$lib/server/auth";
import { building } from "$app/environment";
import { redirect } from "@sveltejs/kit";
import type { Handle } from "@sveltejs/kit";

// Define protected routes
const protectedRoutes = ["/dashboard", "/admin"];

export const handle: Handle = async ({ event, resolve }) => {
	const session = await auth.api.getSession({
		headers: event.request.headers,
	});

	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;
	}

	// Check if the current route is protected
	const isProtectedRoute = protectedRoutes.some((route) =>
		event.url.pathname.startsWith(route)
	);

	// If it's a protected route and user is not authenticated, redirect to login
	if (isProtectedRoute && !session) {
		throw redirect(303, "/auth/login");
	}

	return svelteKitHandler({ event, resolve, auth, building });
};

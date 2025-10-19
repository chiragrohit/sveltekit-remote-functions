import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { db } from "$lib/server/database";
import { getRequestEvent } from "$app/server";
import { profiles } from "./database/schema";
import { eq } from "drizzle-orm";

export const auth = betterAuth({
	database: drizzleAdapter(db, { provider: "sqlite" }),
	plugins: [sveltekitCookies(getRequestEvent)],
	emailAndPassword: { enabled: true },
	databaseHooks: {
		user: {
			create: {
				after: async (user) => {
					// Create a corresponding profile entry for the new user
					try {
						await db.insert(profiles).values({
							id: user.id,
							fullName: user.name,
							username: user.email.split("@")[0], // Default username from email
						});
					} catch (error) {
						console.error(
							"Failed to create profile for user:",
							error
						);
					}
				},
			},
			update: {
				after: async (userData) => {
					// Update the profile's fullName when the user's name is updated
					// userData contains the updated fields
					if (userData.name) {
						try {
							await db
								.update(profiles)
								.set({ fullName: userData.name })
								.where(eq(profiles.id, userData.id));
						} catch (error) {
							console.error(
								"Failed to update profile name for user:",
								error
							);
						}
					}
				},
			},
		},
	},
});

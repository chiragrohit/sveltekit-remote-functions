import { z } from "zod";

export const signupSchema = z.object({
	name: z.string().min(4),
	email: z.string().email(),
	password: z.string().min(8),
});

export const loginSchema = z.object({
	email: z.string().email(),
	password: z.string().min(8),
});

export const updateNameSchema = z.object({
	name: z
		.string()
		.min(1, "Name is required")
		.max(100, "Name must be less than 100 characters")
		.regex(
			/^[a-zA-Z0-9\s\-_.'"]+$/,
			"Name can only contain letters, numbers, spaces, and -_.'\" characters"
		)
		.refine(
			(val) => val.trim().length > 0,
			"Name cannot be empty or contain only spaces"
		)
		.transform((val) => val.trim().replace(/\s+/g, " ")), // Trim and replace multiple spaces with single space
});

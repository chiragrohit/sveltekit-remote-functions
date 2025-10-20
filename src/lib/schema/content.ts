import { z } from "zod";

export const contentCommentSchema = z.object({
	contentId: z.string(),
	userId: z.string(), // Use userId instead of author
	comment: z.string().min(2),
});

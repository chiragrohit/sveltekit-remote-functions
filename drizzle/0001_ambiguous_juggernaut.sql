CREATE TABLE `content_comments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`content_id` text NOT NULL,
	`user_id` text NOT NULL,
	`comment` text NOT NULL,
	`created_at` integer DEFAULT (current_timestamp) NOT NULL,
	`updated_at` integer DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`content_id`) REFERENCES `contents`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_contents` (
	`id` text PRIMARY KEY DEFAULT (uuid()) NOT NULL,
	`source_type` text NOT NULL,
	`content_hash` text,
	`user_id` text,
	`visibility` text DEFAULT 'private',
	`show_on_profile` integer DEFAULT true,
	`url` text,
	`title` text,
	`author` text,
	`body` text,
	`ai_summary` text,
	`ai_questions` blob,
	`thumbnail` text,
	`published_at` integer,
	`created_at` integer DEFAULT (current_timestamp),
	`updated_at` integer DEFAULT (current_timestamp),
	`views` integer DEFAULT 0,
	`likes_count` integer DEFAULT 0,
	`dislikes_count` integer DEFAULT 0,
	`embedding` blob,
	`raw_data` blob,
	`favicon` text,
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_contents`("id", "source_type", "content_hash", "user_id", "visibility", "show_on_profile", "url", "title", "author", "body", "ai_summary", "ai_questions", "thumbnail", "published_at", "created_at", "updated_at", "views", "likes_count", "dislikes_count", "embedding", "raw_data", "favicon") SELECT "id", "source_type", "content_hash", "user_id", "visibility", "show_on_profile", "url", "title", "author", "body", "ai_summary", "ai_questions", "thumbnail", "published_at", "created_at", "updated_at", "views", "likes_count", "dislikes_count", "embedding", "raw_data", "favicon" FROM `contents`;--> statement-breakpoint
DROP TABLE `contents`;--> statement-breakpoint
ALTER TABLE `__new_contents` RENAME TO `contents`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
-- CREATE UNIQUE INDEX `contents_content_hash_unique` ON `contents` (`content_hash`); -- Commented out as it already exists
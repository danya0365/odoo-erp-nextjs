CREATE TABLE `sequences` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`key` text NOT NULL,
	`next` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sequences_shop_idx` ON `sequences` (`shop_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `sequences_shop_key_uq` ON `sequences` (`shop_id`,`key`);
CREATE TABLE `partners` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text DEFAULT 'customer' NOT NULL,
	`email` text,
	`phone` text,
	`tax_id` text,
	`street` text,
	`city` text,
	`country` text,
	`is_company` integer DEFAULT false NOT NULL,
	`parent_id` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `partners_shop_type_idx` ON `partners` (`shop_id`,`type`);--> statement-breakpoint
CREATE INDEX `partners_shop_name_idx` ON `partners` (`shop_id`,`name`);--> statement-breakpoint
CREATE INDEX `partners_shop_created_idx` ON `partners` (`shop_id`,`created_at`);
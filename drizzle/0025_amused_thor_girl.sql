CREATE TABLE `loyalty_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`points` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`customer_id`) REFERENCES `partners`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `loyalty_accounts_shop_idx` ON `loyalty_accounts` (`shop_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `loyalty_accounts_shop_customer_uq` ON `loyalty_accounts` (`shop_id`,`customer_id`);--> statement-breakpoint
CREATE TABLE `promotions` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`code` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`discount_type` text DEFAULT 'percent' NOT NULL,
	`value` integer DEFAULT 0 NOT NULL,
	`min_spend` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `promotions_shop_code_uq` ON `promotions` (`shop_id`,`code`);
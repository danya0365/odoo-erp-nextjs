CREATE TABLE `crm_stages` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`name` text NOT NULL,
	`sequence` integer DEFAULT 0 NOT NULL,
	`is_won` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `crm_stages_shop_seq_idx` ON `crm_stages` (`shop_id`,`sequence`);--> statement-breakpoint
CREATE TABLE `opportunities` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`name` text NOT NULL,
	`partner_id` text,
	`contact_name` text,
	`email` text,
	`phone` text,
	`expected_revenue` integer DEFAULT 0 NOT NULL,
	`probability` integer DEFAULT 0 NOT NULL,
	`stage_id` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`lost_reason` text,
	`sales_order_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`partner_id`) REFERENCES `partners`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`stage_id`) REFERENCES `crm_stages`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sales_order_id`) REFERENCES `sales_orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `opportunities_shop_status_idx` ON `opportunities` (`shop_id`,`status`);--> statement-breakpoint
CREATE INDEX `opportunities_shop_stage_idx` ON `opportunities` (`shop_id`,`stage_id`);
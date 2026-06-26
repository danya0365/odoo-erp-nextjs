CREATE TABLE `stock_count_lines` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`stock_count_id` text NOT NULL,
	`product_id` text NOT NULL,
	`system_qty` integer DEFAULT 0 NOT NULL,
	`counted_qty` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`stock_count_id`) REFERENCES `stock_counts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `stock_count_lines_shop_count_idx` ON `stock_count_lines` (`shop_id`,`stock_count_id`);--> statement-breakpoint
CREATE TABLE `stock_counts` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`doc_number` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`note` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `stock_counts_shop_status_idx` ON `stock_counts` (`shop_id`,`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `stock_counts_shop_doc_uq` ON `stock_counts` (`shop_id`,`doc_number`);
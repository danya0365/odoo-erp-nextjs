CREATE TABLE `pos_order_lines` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`pos_order_id` text NOT NULL,
	`product_id` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`qty` integer NOT NULL,
	`unit_price` integer NOT NULL,
	`tax_rate_bp` integer DEFAULT 0 NOT NULL,
	`line_subtotal` integer NOT NULL,
	`line_tax` integer NOT NULL,
	`line_total` integer NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`pos_order_id`) REFERENCES `pos_orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `pos_order_lines_shop_order_idx` ON `pos_order_lines` (`shop_id`,`pos_order_id`);--> statement-breakpoint
CREATE TABLE `pos_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`session_id` text NOT NULL,
	`doc_number` text NOT NULL,
	`untaxed_amount` integer DEFAULT 0 NOT NULL,
	`tax_amount` integer DEFAULT 0 NOT NULL,
	`total_amount` integer DEFAULT 0 NOT NULL,
	`payment_method` text DEFAULT 'cash' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`session_id`) REFERENCES `pos_sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `pos_orders_shop_session_idx` ON `pos_orders` (`shop_id`,`session_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `pos_orders_shop_doc_uq` ON `pos_orders` (`shop_id`,`doc_number`);--> statement-breakpoint
CREATE TABLE `pos_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`user_id` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`opening_cash` integer DEFAULT 0 NOT NULL,
	`closing_cash` integer,
	`expected_cash` integer,
	`difference` integer,
	`opened_at` text NOT NULL,
	`closed_at` text,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `pos_sessions_shop_status_idx` ON `pos_sessions` (`shop_id`,`status`);
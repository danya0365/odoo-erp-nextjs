CREATE TABLE `purchase_return_lines` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`purchase_return_id` text NOT NULL,
	`product_id` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`qty` integer NOT NULL,
	`unit_price` integer NOT NULL,
	`tax_rate_bp` integer DEFAULT 0 NOT NULL,
	`line_subtotal` integer NOT NULL,
	`line_tax` integer NOT NULL,
	`line_total` integer NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`purchase_return_id`) REFERENCES `purchase_returns`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `purchase_return_lines_shop_return_idx` ON `purchase_return_lines` (`shop_id`,`purchase_return_id`);--> statement-breakpoint
CREATE TABLE `purchase_returns` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`doc_number` text NOT NULL,
	`vendor_bill_id` text,
	`purchase_order_id` text,
	`vendor_id` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`currency` text DEFAULT 'THB' NOT NULL,
	`untaxed_amount` integer DEFAULT 0 NOT NULL,
	`tax_amount` integer DEFAULT 0 NOT NULL,
	`total_amount` integer DEFAULT 0 NOT NULL,
	`reason` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`vendor_bill_id`) REFERENCES `vendor_bills`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`vendor_id`) REFERENCES `partners`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `purchase_returns_shop_status_idx` ON `purchase_returns` (`shop_id`,`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `purchase_returns_shop_doc_uq` ON `purchase_returns` (`shop_id`,`doc_number`);
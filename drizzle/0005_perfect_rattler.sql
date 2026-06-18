CREATE TABLE `purchase_order_lines` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`purchase_order_id` text NOT NULL,
	`product_id` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`qty_ordered` integer NOT NULL,
	`qty_received` integer DEFAULT 0 NOT NULL,
	`qty_billed` integer DEFAULT 0 NOT NULL,
	`unit_price` integer NOT NULL,
	`tax_rate_bp` integer DEFAULT 0 NOT NULL,
	`line_subtotal` integer NOT NULL,
	`line_tax` integer NOT NULL,
	`line_total` integer NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `purchase_order_lines_shop_order_idx` ON `purchase_order_lines` (`shop_id`,`purchase_order_id`);--> statement-breakpoint
CREATE TABLE `purchase_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`doc_number` text,
	`vendor_id` text NOT NULL,
	`status` text DEFAULT 'rfq' NOT NULL,
	`currency` text DEFAULT 'THB' NOT NULL,
	`untaxed_amount` integer DEFAULT 0 NOT NULL,
	`tax_amount` integer DEFAULT 0 NOT NULL,
	`total_amount` integer DEFAULT 0 NOT NULL,
	`order_date` text NOT NULL,
	`confirmed_at` text,
	`note` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`vendor_id`) REFERENCES `partners`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `purchase_orders_shop_status_idx` ON `purchase_orders` (`shop_id`,`status`);--> statement-breakpoint
CREATE INDEX `purchase_orders_shop_created_idx` ON `purchase_orders` (`shop_id`,`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `purchase_orders_shop_doc_uq` ON `purchase_orders` (`shop_id`,`doc_number`);--> statement-breakpoint
CREATE TABLE `vendor_bill_lines` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`vendor_bill_id` text NOT NULL,
	`product_id` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`qty` integer NOT NULL,
	`unit_price` integer NOT NULL,
	`tax_rate_bp` integer DEFAULT 0 NOT NULL,
	`line_subtotal` integer NOT NULL,
	`line_tax` integer NOT NULL,
	`line_total` integer NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`vendor_bill_id`) REFERENCES `vendor_bills`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `vendor_bill_lines_shop_bill_idx` ON `vendor_bill_lines` (`shop_id`,`vendor_bill_id`);--> statement-breakpoint
CREATE TABLE `vendor_bills` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`doc_number` text NOT NULL,
	`purchase_order_id` text,
	`vendor_id` text NOT NULL,
	`status` text DEFAULT 'posted' NOT NULL,
	`currency` text DEFAULT 'THB' NOT NULL,
	`untaxed_amount` integer DEFAULT 0 NOT NULL,
	`tax_amount` integer DEFAULT 0 NOT NULL,
	`total_amount` integer DEFAULT 0 NOT NULL,
	`amount_paid` integer DEFAULT 0 NOT NULL,
	`due_date` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`vendor_id`) REFERENCES `partners`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `vendor_bills_shop_status_idx` ON `vendor_bills` (`shop_id`,`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `vendor_bills_shop_doc_uq` ON `vendor_bills` (`shop_id`,`doc_number`);
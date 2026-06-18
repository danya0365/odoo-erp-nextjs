CREATE TABLE `sales_order_lines` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`sales_order_id` text NOT NULL,
	`product_id` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`qty_ordered` integer NOT NULL,
	`qty_delivered` integer DEFAULT 0 NOT NULL,
	`qty_invoiced` integer DEFAULT 0 NOT NULL,
	`unit_price` integer NOT NULL,
	`tax_rate_bp` integer DEFAULT 0 NOT NULL,
	`line_subtotal` integer NOT NULL,
	`line_tax` integer NOT NULL,
	`line_total` integer NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sales_order_id`) REFERENCES `sales_orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `sales_order_lines_shop_order_idx` ON `sales_order_lines` (`shop_id`,`sales_order_id`);--> statement-breakpoint
CREATE TABLE `sales_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`doc_number` text,
	`customer_id` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
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
	FOREIGN KEY (`customer_id`) REFERENCES `partners`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `sales_orders_shop_status_idx` ON `sales_orders` (`shop_id`,`status`);--> statement-breakpoint
CREATE INDEX `sales_orders_shop_created_idx` ON `sales_orders` (`shop_id`,`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `sales_orders_shop_doc_uq` ON `sales_orders` (`shop_id`,`doc_number`);--> statement-breakpoint
CREATE TABLE `invoice_lines` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`invoice_id` text NOT NULL,
	`product_id` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`qty` integer NOT NULL,
	`unit_price` integer NOT NULL,
	`tax_rate_bp` integer DEFAULT 0 NOT NULL,
	`line_subtotal` integer NOT NULL,
	`line_tax` integer NOT NULL,
	`line_total` integer NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `invoice_lines_shop_invoice_idx` ON `invoice_lines` (`shop_id`,`invoice_id`);--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`doc_number` text NOT NULL,
	`sales_order_id` text,
	`customer_id` text NOT NULL,
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
	FOREIGN KEY (`sales_order_id`) REFERENCES `sales_orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customer_id`) REFERENCES `partners`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `invoices_shop_status_idx` ON `invoices` (`shop_id`,`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `invoices_shop_doc_uq` ON `invoices` (`shop_id`,`doc_number`);--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`doc_number` text NOT NULL,
	`partner_id` text NOT NULL,
	`direction` text NOT NULL,
	`invoice_id` text,
	`vendor_bill_id` text,
	`amount` integer NOT NULL,
	`method` text DEFAULT 'cash' NOT NULL,
	`paid_at` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`partner_id`) REFERENCES `partners`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `payments_shop_invoice_idx` ON `payments` (`shop_id`,`invoice_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `payments_shop_doc_uq` ON `payments` (`shop_id`,`doc_number`);
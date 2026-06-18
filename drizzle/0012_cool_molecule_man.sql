CREATE TABLE `online_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`order_number` text NOT NULL,
	`customer_name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text,
	`sales_order_id` text NOT NULL,
	`total_amount` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sales_order_id`) REFERENCES `sales_orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `online_orders_shop_idx` ON `online_orders` (`shop_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `online_orders_shop_number_uq` ON `online_orders` (`shop_id`,`order_number`);
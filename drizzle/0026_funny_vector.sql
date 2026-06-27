CREATE TABLE `product_lots` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`product_id` text NOT NULL,
	`lot_number` text DEFAULT '' NOT NULL,
	`expiry_date` text NOT NULL,
	`qty` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `product_lots_shop_product_idx` ON `product_lots` (`shop_id`,`product_id`);--> statement-breakpoint
CREATE INDEX `product_lots_shop_expiry_idx` ON `product_lots` (`shop_id`,`expiry_date`);
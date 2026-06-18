CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`sku` text NOT NULL,
	`name` text NOT NULL,
	`type` text DEFAULT 'stockable' NOT NULL,
	`sale_price` integer DEFAULT 0 NOT NULL,
	`cost_price` integer DEFAULT 0 NOT NULL,
	`tax_rate_bp` integer DEFAULT 0 NOT NULL,
	`uom` text DEFAULT 'หน่วย' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `products_shop_name_idx` ON `products` (`shop_id`,`name`);--> statement-breakpoint
CREATE INDEX `products_shop_created_idx` ON `products` (`shop_id`,`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `products_shop_sku_uq` ON `products` (`shop_id`,`sku`);--> statement-breakpoint
CREATE TABLE `stock_locations` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`name` text NOT NULL,
	`is_default` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `stock_locations_shop_idx` ON `stock_locations` (`shop_id`);--> statement-breakpoint
CREATE TABLE `stock_moves` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`product_id` text NOT NULL,
	`location_id` text NOT NULL,
	`qty_delta` integer NOT NULL,
	`type` text NOT NULL,
	`source_type` text NOT NULL,
	`source_id` text,
	`note` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`location_id`) REFERENCES `stock_locations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `stock_moves_shop_product_idx` ON `stock_moves` (`shop_id`,`product_id`);--> statement-breakpoint
CREATE INDEX `stock_moves_shop_source_idx` ON `stock_moves` (`shop_id`,`source_type`,`source_id`);
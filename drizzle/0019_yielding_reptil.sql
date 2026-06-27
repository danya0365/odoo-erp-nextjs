CREATE TABLE `dunning_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`amount` integer DEFAULT 0 NOT NULL,
	`note` text,
	`sent_at` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`customer_id`) REFERENCES `partners`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `dunning_logs_shop_customer_idx` ON `dunning_logs` (`shop_id`,`customer_id`);--> statement-breakpoint
ALTER TABLE `partners` ADD `credit_term_days` integer;
CREATE TABLE `service_tickets` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`doc_number` text NOT NULL,
	`customer_id` text NOT NULL,
	`subject` text DEFAULT '' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`assignee_id` text,
	`scheduled_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`customer_id`) REFERENCES `partners`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assignee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `service_tickets_shop_status_idx` ON `service_tickets` (`shop_id`,`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `service_tickets_shop_doc_uq` ON `service_tickets` (`shop_id`,`doc_number`);
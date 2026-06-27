CREATE TABLE `installment_lines` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`installment_plan_id` text NOT NULL,
	`seq` integer NOT NULL,
	`due_date` text NOT NULL,
	`amount` integer NOT NULL,
	`paid_amount` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`installment_plan_id`) REFERENCES `installment_plans`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `installment_lines_shop_plan_idx` ON `installment_lines` (`shop_id`,`installment_plan_id`);--> statement-breakpoint
CREATE TABLE `installment_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`invoice_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`total_amount` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customer_id`) REFERENCES `partners`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `installment_plans_shop_status_idx` ON `installment_plans` (`shop_id`,`status`);
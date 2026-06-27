CREATE TABLE `expense_claims` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`doc_number` text NOT NULL,
	`employee_id` text NOT NULL,
	`category` text DEFAULT '' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`amount` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'submitted' NOT NULL,
	`paid_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `expense_claims_shop_status_idx` ON `expense_claims` (`shop_id`,`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `expense_claims_shop_doc_uq` ON `expense_claims` (`shop_id`,`doc_number`);
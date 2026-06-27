CREATE TABLE `bank_statement_lines` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`statement_date` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`amount` integer NOT NULL,
	`reconciled` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `bank_statement_lines_shop_recon_idx` ON `bank_statement_lines` (`shop_id`,`reconciled`);--> statement-breakpoint
CREATE TABLE `period_closes` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`period` text NOT NULL,
	`note` text,
	`closed_at` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `period_closes_shop_period_uq` ON `period_closes` (`shop_id`,`period`);
CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `accounts_shop_type_idx` ON `accounts` (`shop_id`,`type`);--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_shop_code_uq` ON `accounts` (`shop_id`,`code`);--> statement-breakpoint
CREATE TABLE `journals` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `journals_shop_code_uq` ON `journals` (`shop_id`,`code`);--> statement-breakpoint
CREATE TABLE `journal_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`doc_number` text NOT NULL,
	`journal_id` text NOT NULL,
	`date` text NOT NULL,
	`ref` text,
	`source_type` text NOT NULL,
	`source_id` text,
	`status` text DEFAULT 'posted' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`journal_id`) REFERENCES `journals`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `journal_entries_shop_date_idx` ON `journal_entries` (`shop_id`,`date`);--> statement-breakpoint
CREATE INDEX `journal_entries_shop_source_idx` ON `journal_entries` (`shop_id`,`source_type`,`source_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `journal_entries_shop_doc_uq` ON `journal_entries` (`shop_id`,`doc_number`);--> statement-breakpoint
CREATE TABLE `journal_entry_lines` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`entry_id` text NOT NULL,
	`account_id` text NOT NULL,
	`partner_id` text,
	`label` text DEFAULT '' NOT NULL,
	`debit` integer DEFAULT 0 NOT NULL,
	`credit` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`entry_id`) REFERENCES `journal_entries`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`partner_id`) REFERENCES `partners`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `journal_entry_lines_shop_entry_idx` ON `journal_entry_lines` (`shop_id`,`entry_id`);--> statement-breakpoint
CREATE INDEX `journal_entry_lines_shop_account_idx` ON `journal_entry_lines` (`shop_id`,`account_id`);
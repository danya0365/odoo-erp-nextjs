CREATE TABLE `vat_filings` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`period_start` text NOT NULL,
	`period_end` text NOT NULL,
	`output_vat` integer DEFAULT 0 NOT NULL,
	`input_vat` integer DEFAULT 0 NOT NULL,
	`net_payable` integer DEFAULT 0 NOT NULL,
	`filed_at` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `vat_filings_shop_period_uq` ON `vat_filings` (`shop_id`,`period_start`);
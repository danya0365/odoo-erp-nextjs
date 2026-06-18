CREATE TABLE `employees` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`name` text NOT NULL,
	`position` text,
	`base_salary` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `employees_shop_active_idx` ON `employees` (`shop_id`,`is_active`);--> statement-breakpoint
CREATE TABLE `payroll_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`doc_number` text,
	`period` text NOT NULL,
	`wht_rate_bp` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `payroll_runs_shop_status_idx` ON `payroll_runs` (`shop_id`,`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `payroll_runs_shop_doc_uq` ON `payroll_runs` (`shop_id`,`doc_number`);--> statement-breakpoint
CREATE TABLE `payslips` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`run_id` text NOT NULL,
	`employee_id` text NOT NULL,
	`gross` integer NOT NULL,
	`tax` integer NOT NULL,
	`net` integer NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`run_id`) REFERENCES `payroll_runs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `payslips_shop_run_idx` ON `payslips` (`shop_id`,`run_id`);
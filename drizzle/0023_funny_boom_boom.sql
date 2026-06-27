CREATE TABLE `attendance_records` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`employee_id` text NOT NULL,
	`work_date` text NOT NULL,
	`hours_worked` integer DEFAULT 0 NOT NULL,
	`ot_hours` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `attendance_records_shop_emp_idx` ON `attendance_records` (`shop_id`,`employee_id`);--> statement-breakpoint
CREATE TABLE `leave_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`employee_id` text NOT NULL,
	`leave_type` text DEFAULT 'personal' NOT NULL,
	`days` integer DEFAULT 0 NOT NULL,
	`reason` text,
	`status` text DEFAULT 'submitted' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `leave_requests_shop_status_idx` ON `leave_requests` (`shop_id`,`status`);
CREATE TABLE `user` (
	`id` VARCHAR(64) NOT NULL,

	`email` VARCHAR(256),
	`email_verified` BOOLEAN,

	-- audit fields
	`created_by` VARCHAR(64) NOT NULL,
	`created_date` TIMESTAMP WITH TIME ZONE NOT NULL,
	`last_modified_by` VARCHAR(64),
	`last_modified_date` TIMESTAMP WITH TIME ZONE,

	CONSTRAINT `pk_user` PRIMARY KEY (`id`)
);

CREATE INDEX `ix_user_email` ON `user` (`email`);


create TABLE `user_attribute` (
	`id` VARCHAR(64) NOT NULL,

	`name` VARCHAR(256) NOT NULL,
	`value` VARCHAR(2048),
	`user_id` VARCHAR(64) NOT NULL,

	-- audit fields
	`created_by` VARCHAR(64) NOT NULL,
	`created_date` TIMESTAMP WITH TIME ZONE NOT NULL,
	`last_modified_by` VARCHAR(64),
	`last_modified_date` TIMESTAMP WITH TIME ZONE,

	CONSTRAINT `pk_user_attribute` PRIMARY KEY (`id`),
	CONSTRAINT `fk_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`),
	CONSTRAINT `uq_user_attribute` UNIQUE (`name`, `user_id`)
);

CREATE INDEX `ix_user_attribute_user_id` on `user_attribute` (`user_id`);
CREATE INDEX `ix_user_attribute_name_value` ON `user_attribute` (`name`, `value`);



CREATE TABLE `alert_type` (
	`id` VARCHAR(64) NOT NULL,

	`code` VARCHAR(64) NOT NULL,
	`description` VARCHAR(256),

	-- audit fields
	`created_by` VARCHAR(64) NOT NULL,
	`created_date` TIMESTAMP WITH TIME ZONE NOT NULL,
	`last_modified_by` VARCHAR(64),
	`last_modified_date` TIMESTAMP WITH TIME ZONE,

	CONSTRAINT `pk_alert_type` PRIMARY KEY (`id`)
);

CREATE INDEX `ix_alert_type_code` on `alert_type` (`code`);



CREATE TABLE `subscription` (
	`id` VARCHAR(64) NOT NULL,

	`user_id` VARCHAR(9) NOT NULL,
	`email` VARCHAR(50) NOT NULL,
	`registered` BOOLEAN,
	`subscribed` BOOLEAN,
	`preferred_language` BIGINT,
	`alert_type_id` VARCHAR(64) NOT NULL,

	-- audit fields
	`created_by` VARCHAR(64) NOT NULL,
	`created_date` TIMESTAMP WITH TIME ZONE NOT NULL,
	`last_modified_by` VARCHAR(64),
	`last_modified_date` TIMESTAMP WITH TIME ZONE,

	CONSTRAINT `pk_subscription` PRIMARY KEY (`id`),
	CONSTRAINT `fk_subscription_alert_type` FOREIGN KEY (`alert_type_id`) REFERENCES `alert_type` (`id`)
);

CREATE INDEX `ix_subscription_alert_type_id` on `subscription` (`alert_type_id`);
CREATE INDEX `ix_subscription_email` on `subscription` (`email`);
CREATE INDEX `ix_subscription_user_id` on `subscription` (`user_id`);

CREATE TABLE confirmation_code (
	`id` VARCHAR(64) NOT NULL,
	`user_id` VARCHAR(9) NOT NULL,
	`email` VARCHAR(50) NOT NULL,
	`code` VARCHAR(10) NOT NULL,
	expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
	-- audit fields
	`created_by` VARCHAR(64) NOT NULL,
	`created_date` TIMESTAMP WITH TIME ZONE NOT NULL,
	`last_modified_by` VARCHAR(64),
	`last_modified_date` TIMESTAMP WITH TIME ZONE,

	CONSTRAINT pk_confirmation_code PRIMARY KEY (id)
);


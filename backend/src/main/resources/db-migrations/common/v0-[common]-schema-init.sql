CREATE TABLE alert_type (
	id VARCHAR(64) NOT NULL,

	code VARCHAR(64) NOT NULL,
	description VARCHAR(256),

	-- audit fields
	created_by VARCHAR(64) NOT NULL,
	created_date TIMESTAMP NOT NULL,
	last_modified_by VARCHAR(64),
	last_modified_date TIMESTAMP,

	CONSTRAINT pk_status_code PRIMARY KEY (id)
);

CREATE TABLE subscription (
	id VARCHAR(64) NOT NULL,
	user_id VARCHAR(9) NOT NULL,
	email VARCHAR(50) NOT NULL,
	registered BOOLEAN,
	subscribed BOOLEAN,
	preferred_language BIGINT,
	alert_type_id VARCHAR(64) NOT NULL,

	-- audit fields
	created_by VARCHAR(64) NOT NULL,
	created_date TIMESTAMP WITH TIME ZONE NOT NULL,
	last_modified_by VARCHAR(64),
	last_modified_date TIMESTAMP WITH TIME ZONE,

	CONSTRAINT pk_subscription PRIMARY KEY (id),
	CONSTRAINT fk_subscription_alert_type FOREIGN KEY (alert_type_id) REFERENCES alert_type(id)
);

CREATE TABLE confirmation_code (
	id VARCHAR(64) NOT NULL,
	user_id VARCHAR(9) NOT NULL,
	email VARCHAR(50) NOT NULL,
	confirmation_code VARCHAR(50) NOT NULL,
	code_created_date TIMESTAMP WITH TIME ZONE NOT NULL,
	code_expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
	-- audit fields
	created_by VARCHAR(64) NOT NULL,
	created_date TIMESTAMP WITH TIME ZONE NOT NULL,
	last_modified_by VARCHAR(64),
	last_modified_date TIMESTAMP WITH TIME ZONE,

	CONSTRAINT pk_confirmation_code PRIMARY KEY (id)
);
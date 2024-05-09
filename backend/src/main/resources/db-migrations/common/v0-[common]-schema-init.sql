CREATE TABLE subscription (
	id VARCHAR(64) NOT NULL,
	user_id VARCHAR(9) NOT NULL,
	email VARCHAR(50) NOT NULL,
	registered BOOLEAN,
	subscribed BOOLEAN,
	preferred_language BIGINT,
	alert_type VARCHAR(10) NOT NULL,

	-- audit fields
	created_by VARCHAR(64) NOT NULL,
	created_date TIMESTAMP WITH TIME ZONE NOT NULL,
	last_modified_by VARCHAR(64),
	last_modified_date TIMESTAMP WITH TIME ZONE,

	CONSTRAINT pk_subscription PRIMARY KEY (id)
);
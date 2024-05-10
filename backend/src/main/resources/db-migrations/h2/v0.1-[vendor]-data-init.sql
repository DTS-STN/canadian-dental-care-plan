INSERT INTO alert_type 
	(id, code, description, created_by, created_date, last_modified_by, last_modified_date)
VALUES
	('cf185099-8a17-4086-a890-c456250822a3', 'cdcp', 'cdcp email alerts', 'flyway-community-edition', CURRENT_TIMESTAMP, 'flyway-community-edition', CURRENT_TIMESTAMP),
	('daf8b8d9-95f4-4f38-9ee3-17ac7826c1e7', 'ei', 'ei email alerts', 'flyway-community-edition', CURRENT_TIMESTAMP, 'flyway-community-edition', CURRENT_TIMESTAMP);

INSERT INTO subscription 
	(id, user_id, email, registered, subscribed, preferred_language, alert_type_id, created_by, created_date, last_modified_by, last_modified_date)
VALUES
	('a6ea4925-f813-493e-80ec-a5b90ca28b6c', '800011819', 'example@gmail.com', true, true, 1033, 'cf185099-8a17-4086-a890-c456250822a3', 'flyway-community-edition', CURRENT_TIMESTAMP, 'flyway-community-edition', CURRENT_TIMESTAMP),
	('d3419bcb-5e46-4678-831b-c9211d479429', '800011819', 'example@gmail.com', true, false, 1033, 'daf8b8d9-95f4-4f38-9ee3-17ac7826c1e7', 'flyway-community-edition', CURRENT_TIMESTAMP, 'flyway-community-edition', CURRENT_TIMESTAMP);
INSERT INTO confirmation_code
	(id, user_id, email, confirmation_code, code_created_date, code_expiry_date, created_by, created_date, last_modified_by, last_modified_date)
VALUES
	('a6ea4925-f813-493e-80ec-a5b90ca28b6c', '800011819', 'example@gmail.com', '12345', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'flyway-community-edition', CURRENT_TIMESTAMP, 'flyway-community-edition', CURRENT_TIMESTAMP);
	


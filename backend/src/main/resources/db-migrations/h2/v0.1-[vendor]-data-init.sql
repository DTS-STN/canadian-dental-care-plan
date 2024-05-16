INSERT INTO `user` (`id`, `email`, `email_verified`, `created_by`, `created_date`, `last_modified_by`, `last_modified_date`)
VALUES
	('76c48130-e1d4-4c2f-8dd0-1c17f9bbb4f6', 'unverified@example.com', false, 'flyway-community-edition', CURRENT_TIMESTAMP, 'flyway-community-edition', CURRENT_TIMESTAMP),
	('f9f33652-0ebd-46bc-8d93-04cef538a689', 'verified@example.com', true, 'flyway-community-edition', CURRENT_TIMESTAMP, 'flyway-community-edition', CURRENT_TIMESTAMP);


INSERT INTO `user_attribute` (`id`, `name`, `value`, `user_id`, `created_by`, `created_date`, `last_modified_by`, `last_modified_date`)
VALUES
	('291e1ebb-8298-4c47-8903-87b2a57ccfd1', 'RAOIDC_USER_ID', 'b5336580-d93d-4da9-9e19-c2a5e098bd08', '76c48130-e1d4-4c2f-8dd0-1c17f9bbb4f6', 'flyway-community-edition', CURRENT_TIMESTAMP, 'flyway-community-edition', CURRENT_TIMESTAMP),
	('7da43bfb-cb58-4ed2-8fea-436fda24020e', 'RAOIDC_USER_ID', 'd827416b-f808-4035-9ccc-7572f3297015', 'f9f33652-0ebd-46bc-8d93-04cef538a689', 'flyway-community-edition', CURRENT_TIMESTAMP, 'flyway-community-edition', CURRENT_TIMESTAMP);


INSERT INTO `alert_type` (`id`, `code`, `description`, `created_by`, `created_date`, `last_modified_by`, `last_modified_date`)
VALUES
	('cf185099-8a17-4086-a890-c456250822a3', 'cdcp', 'CDCP email alerts', 'flyway-community-edition', CURRENT_TIMESTAMP, 'flyway-community-edition', CURRENT_TIMESTAMP),
	('daf8b8d9-95f4-4f38-9ee3-17ac7826c1e7', 'ei', 'EI email alerts', 'flyway-community-edition', CURRENT_TIMESTAMP, 'flyway-community-edition', CURRENT_TIMESTAMP);


INSERT INTO `subscription` (`id`, `user_id`, `email`, `registered`, `subscribed`, `preferred_language`, `alert_type_id`, `created_by`, `created_date`, `last_modified_by`, `last_modified_date`)
VALUES
	('a6ea4925-f813-493e-80ec-a5b90ca28b6c', '800011819', 'user0001@example.com', true, true, 1033, 'cf185099-8a17-4086-a890-c456250822a3', 'flyway-community-edition', CURRENT_TIMESTAMP, 'flyway-community-edition', CURRENT_TIMESTAMP),
	('d3419bcb-5e46-4678-831b-c9211d479429', '800011819', 'user0002@example.com', true, false, 1033, 'daf8b8d9-95f4-4f38-9ee3-17ac7826c1e7', 'flyway-community-edition', CURRENT_TIMESTAMP, 'flyway-community-edition', CURRENT_TIMESTAMP);

INSERT INTO subscription 
  (id, user_id, email, registered, subscribed, preferred_language, alert_type, created_by, created_date, last_modified_by, last_modified_date)
VALUES
  ('a6ea4925-f813-493e-80ec-a5b90ca28b6c', '800011819', 'example@gmail.com', true, true, 1033, 'cdcp', 'flyway-community-edition', CURRENT_TIMESTAMP, 'flyway-community-edition', CURRENT_TIMESTAMP),
  ('d3419bcb-5e46-4678-831b-c9211d479429', '800011819', 'example@gmail.com', true, false, 1033, 'ei', 'flyway-community-edition', CURRENT_TIMESTAMP, 'flyway-community-edition', CURRENT_TIMESTAMP);
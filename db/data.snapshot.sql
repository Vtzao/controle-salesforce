SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict yqK74Imsat3VJJKmeGclewE8fbQKc73vYt7FGNfNpPa8CwCnoqucDkOIqlmmmB9

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."audit_log" ("id", "occurred_at", "txid", "schema_name", "table_name", "action", "record_pk", "old_data", "new_data", "changed_columns", "actor_id", "actor_email", "actor_role", "actor_is_anonymous", "source", "origin") OVERRIDING SYSTEM VALUE VALUES
	(1, '2026-04-01 16:45:44.382721+00', 1585, 'public', 'portal_admins', 'INSERT', '{"id": "e2b87038-ad45-47f8-96c8-3d15c7fdd562"}', NULL, '{"id": "e2b87038-ad45-47f8-96c8-3d15c7fdd562", "email": "vitor.almeida@organnact.com", "created_at": "2026-04-01T16:45:44.382721+00:00", "created_by": "contato.vtpereira@gmail.com"}', '{}', '41851449-0243-45d0-bb5d-c6f9b29adf00', 'contato.vtpereira@gmail.com', 'authenticated', false, 'trigger', 'audit_row_change_portal_admins'),
	(2, '2026-04-01 16:45:45.278711+00', 1586, 'public', 'portal_events', 'EVENT', '{"event": "admin_auth_account_created"}', NULL, '{"email": "vitor.almeida@organnact.com", "created_by": "contato.vtpereira@gmail.com"}', '{}', '41851449-0243-45d0-bb5d-c6f9b29adf00', 'contato.vtpereira@gmail.com', 'authenticated', false, 'manual', 'admin_auth_account_created'),
	(3, '2026-04-01 16:56:05.160145+00', 1590, 'public', 'portal_admins', 'UPDATE', '{"id": "cebf2c3c-ab51-48b9-a59f-b0083bf26de3"}', '{"id": "cebf2c3c-ab51-48b9-a59f-b0083bf26de3", "email": "rafael@organnact.com", "created_at": "2026-04-01T13:12:58.727864+00:00", "created_by": "contato.vtpereira@gmail.com"}', '{"id": "cebf2c3c-ab51-48b9-a59f-b0083bf26de3", "email": "rafael.teste@organnact.com.br", "created_at": "2026-04-01T13:12:58.727864+00:00", "created_by": "contato.vtpereira@gmail.com"}', '{email}', '11111111-1111-1111-1111-111111111111', 'contato.vtpereira@gmail.com', NULL, false, 'trigger', 'audit_row_change_portal_admins'),
	(4, '2026-04-01 16:56:05.160145+00', 1590, 'public', 'portal_admins', 'UPDATE', '{"id": "cebf2c3c-ab51-48b9-a59f-b0083bf26de3"}', '{"id": "cebf2c3c-ab51-48b9-a59f-b0083bf26de3", "email": "rafael.teste@organnact.com.br", "created_at": "2026-04-01T13:12:58.727864+00:00", "created_by": "contato.vtpereira@gmail.com"}', '{"id": "cebf2c3c-ab51-48b9-a59f-b0083bf26de3", "email": "rafael@organnact.com", "created_at": "2026-04-01T13:12:58.727864+00:00", "created_by": "contato.vtpereira@gmail.com"}', '{email}', '11111111-1111-1111-1111-111111111111', 'contato.vtpereira@gmail.com', NULL, false, 'trigger', 'audit_row_change_portal_admins'),
	(5, '2026-04-01 17:16:23.816952+00', 1591, 'public', 'portal_admins', 'UPDATE', '{"id": "cebf2c3c-ab51-48b9-a59f-b0083bf26de3"}', '{"id": "cebf2c3c-ab51-48b9-a59f-b0083bf26de3", "email": "rafael@organnact.com", "created_at": "2026-04-01T13:12:58.727864+00:00", "created_by": "contato.vtpereira@gmail.com"}', '{"id": "cebf2c3c-ab51-48b9-a59f-b0083bf26de3", "email": "rafael@organnact.com.br", "created_at": "2026-04-01T13:12:58.727864+00:00", "created_by": "contato.vtpereira@gmail.com"}', '{email}', '41851449-0243-45d0-bb5d-c6f9b29adf00', 'contato.vtpereira@gmail.com', 'authenticated', false, 'trigger', 'audit_row_change_portal_admins'),
	(6, '2026-04-01 17:16:24.031568+00', 1592, 'public', 'portal_events', 'EVENT', '{"event": "admin_email_updated"}', NULL, '{"admin_id": "cebf2c3c-ab51-48b9-a59f-b0083bf26de3", "next_email": "rafael@organnact.com.br", "updated_by": "contato.vtpereira@gmail.com", "previous_email": "rafael@organnact.com"}', '{}', '41851449-0243-45d0-bb5d-c6f9b29adf00', 'contato.vtpereira@gmail.com', 'authenticated', false, 'manual', 'admin_email_updated'),
	(7, '2026-04-01 17:16:29.149404+00', 1593, 'public', 'portal_admins', 'UPDATE', '{"id": "cebf2c3c-ab51-48b9-a59f-b0083bf26de3"}', '{"id": "cebf2c3c-ab51-48b9-a59f-b0083bf26de3", "email": "rafael@organnact.com.br", "created_at": "2026-04-01T13:12:58.727864+00:00", "created_by": "contato.vtpereira@gmail.com"}', '{"id": "cebf2c3c-ab51-48b9-a59f-b0083bf26de3", "email": "rafael@organnact.com", "created_at": "2026-04-01T13:12:58.727864+00:00", "created_by": "contato.vtpereira@gmail.com"}', '{email}', '41851449-0243-45d0-bb5d-c6f9b29adf00', 'contato.vtpereira@gmail.com', 'authenticated', false, 'trigger', 'audit_row_change_portal_admins'),
	(8, '2026-04-01 17:16:29.300213+00', 1594, 'public', 'portal_events', 'EVENT', '{"event": "admin_email_updated"}', NULL, '{"admin_id": "cebf2c3c-ab51-48b9-a59f-b0083bf26de3", "next_email": "rafael@organnact.com", "updated_by": "contato.vtpereira@gmail.com", "previous_email": "rafael@organnact.com.br"}', '{}', '41851449-0243-45d0-bb5d-c6f9b29adf00', 'contato.vtpereira@gmail.com', 'authenticated', false, 'manual', 'admin_email_updated'),
	(9, '2026-04-01 19:05:36.001791+00', 1618, 'public', 'collaborators', 'UPDATE', '{"id": "8c7bb733-a5f8-41c9-a7cd-d1214a33f9a4"}', '{"id": "8c7bb733-a5f8-41c9-a7cd-d1214a33f9a4", "name": "Adriana Lopes", "role": "Gerente Organnact USA", "is_active": true, "created_at": "2026-03-25T19:38:52.141895+00:00", "external_id": "adriana-lopes-mn6g5iox-1"}', '{"id": "8c7bb733-a5f8-41c9-a7cd-d1214a33f9a4", "name": "Adriana Lopes", "role": "Gerente Organnact USA", "is_active": false, "created_at": "2026-03-25T19:38:52.141895+00:00", "external_id": "adriana-lopes-mn6g5iox-1"}', '{is_active}', '41851449-0243-45d0-bb5d-c6f9b29adf00', 'contato.vtpereira@gmail.com', 'authenticated', false, 'trigger', 'audit_row_change_collaborators'),
	(10, '2026-04-01 19:05:36.198454+00', 1619, 'public', 'portal_events', 'EVENT', '{"event": "user_deactivated"}', NULL, '{"user_id": "8c7bb733-a5f8-41c9-a7cd-d1214a33f9a4", "user_name": "Adriana Lopes", "changed_by": "contato.vtpereira@gmail.com", "user_email_like_id": "adriana-lopes-mn6g5iox-1"}', '{}', '41851449-0243-45d0-bb5d-c6f9b29adf00', 'contato.vtpereira@gmail.com', 'authenticated', false, 'manual', 'user_deactivated'),
	(11, '2026-04-01 19:07:17.389113+00', 1625, 'public', 'collaborators', 'UPDATE', '{"id": "73eb89d5-9ec6-461e-a009-9767d1c475a6"}', '{"id": "73eb89d5-9ec6-461e-a009-9767d1c475a6", "name": "Vitor Almeida", "role": "Analista Orgadata", "is_active": true, "created_at": "2026-03-24T19:17:52.719313+00:00", "external_id": "vitor-almeida-mn4zyokh"}', '{"id": "73eb89d5-9ec6-461e-a009-9767d1c475a6", "name": "Vitor Almeida", "role": "Analista", "is_active": true, "created_at": "2026-03-24T19:17:52.719313+00:00", "external_id": "vitor-almeida-mn4zyokh"}', '{role}', '41851449-0243-45d0-bb5d-c6f9b29adf00', 'contato.vtpereira@gmail.com', 'authenticated', false, 'trigger', 'audit_row_change_collaborators'),
	(12, '2026-04-01 19:07:17.389113+00', 1625, 'public', 'collaborator_categories', 'INSERT', '{"category_id": "7e7593b9-7f23-4f74-a6d0-57b04a2031b7", "collaborator_id": "73eb89d5-9ec6-461e-a009-9767d1c475a6"}', NULL, '{"created_at": "2026-04-01T19:07:17.389113+00:00", "category_id": "7e7593b9-7f23-4f74-a6d0-57b04a2031b7", "collaborator_id": "73eb89d5-9ec6-461e-a009-9767d1c475a6"}', '{}', '41851449-0243-45d0-bb5d-c6f9b29adf00', 'contato.vtpereira@gmail.com', 'authenticated', false, 'trigger', 'audit_row_change_collaborator_categories'),
	(13, '2026-04-01 19:07:17.486255+00', 1626, 'public', 'collaborator_categories', 'INSERT', '{"category_id": "2f9c0b2a-cfaf-4936-a433-c999ee23e95a", "collaborator_id": "53876915-c175-4a2b-a863-088034f6d824"}', NULL, '{"created_at": "2026-04-01T19:07:17.486255+00:00", "category_id": "2f9c0b2a-cfaf-4936-a433-c999ee23e95a", "collaborator_id": "53876915-c175-4a2b-a863-088034f6d824"}', '{}', '41851449-0243-45d0-bb5d-c6f9b29adf00', 'contato.vtpereira@gmail.com', 'authenticated', false, 'trigger', 'audit_row_change_collaborator_categories'),
	(14, '2026-04-01 19:07:17.544392+00', 1627, 'public', 'collaborator_categories', 'INSERT', '{"category_id": "2f9c0b2a-cfaf-4936-a433-c999ee23e95a", "collaborator_id": "0fcf03bc-86e2-4473-869d-44792b8ae606"}', NULL, '{"created_at": "2026-04-01T19:07:17.544392+00:00", "category_id": "2f9c0b2a-cfaf-4936-a433-c999ee23e95a", "collaborator_id": "0fcf03bc-86e2-4473-869d-44792b8ae606"}', '{}', '41851449-0243-45d0-bb5d-c6f9b29adf00', 'contato.vtpereira@gmail.com', 'authenticated', false, 'trigger', 'audit_row_change_collaborator_categories'),
	(15, '2026-04-01 19:07:17.60886+00', 1628, 'public', 'collaborators', 'UPDATE', '{"id": "08935154-c4d7-4ea8-8eec-7d963d9afda0"}', '{"id": "08935154-c4d7-4ea8-8eec-7d963d9afda0", "name": "Orion Castro", "role": "Consultor Salesforce", "is_active": true, "created_at": "2026-03-25T19:38:52.391364+00:00", "external_id": "orion-castro-mn6g5jd6-2"}', '{"id": "08935154-c4d7-4ea8-8eec-7d963d9afda0", "name": "Orion Castro", "role": "Consultor", "is_active": true, "created_at": "2026-03-25T19:38:52.391364+00:00", "external_id": "orion-castro-mn6g5jd6-2"}', '{role}', '41851449-0243-45d0-bb5d-c6f9b29adf00', 'contato.vtpereira@gmail.com', 'authenticated', false, 'trigger', 'audit_row_change_collaborators'),
	(16, '2026-04-01 19:07:17.60886+00', 1628, 'public', 'collaborator_categories', 'INSERT', '{"category_id": "7e7593b9-7f23-4f74-a6d0-57b04a2031b7", "collaborator_id": "08935154-c4d7-4ea8-8eec-7d963d9afda0"}', NULL, '{"created_at": "2026-04-01T19:07:17.60886+00:00", "category_id": "7e7593b9-7f23-4f74-a6d0-57b04a2031b7", "collaborator_id": "08935154-c4d7-4ea8-8eec-7d963d9afda0"}', '{}', '41851449-0243-45d0-bb5d-c6f9b29adf00', 'contato.vtpereira@gmail.com', 'authenticated', false, 'trigger', 'audit_row_change_collaborator_categories'),
	(17, '2026-04-01 19:07:17.60886+00', 1628, 'public', 'collaborator_categories', 'INSERT', '{"category_id": "44c46378-84f2-44b7-b6b7-25398fa99fb2", "collaborator_id": "08935154-c4d7-4ea8-8eec-7d963d9afda0"}', NULL, '{"created_at": "2026-04-01T19:07:17.60886+00:00", "category_id": "44c46378-84f2-44b7-b6b7-25398fa99fb2", "collaborator_id": "08935154-c4d7-4ea8-8eec-7d963d9afda0"}', '{}', '41851449-0243-45d0-bb5d-c6f9b29adf00', 'contato.vtpereira@gmail.com', 'authenticated', false, 'trigger', 'audit_row_change_collaborator_categories'),
	(18, '2026-04-01 19:07:17.60886+00', 1628, 'public', 'collaborator_categories', 'INSERT', '{"category_id": "2f9c0b2a-cfaf-4936-a433-c999ee23e95a", "collaborator_id": "08935154-c4d7-4ea8-8eec-7d963d9afda0"}', NULL, '{"created_at": "2026-04-01T19:07:17.60886+00:00", "category_id": "2f9c0b2a-cfaf-4936-a433-c999ee23e95a", "collaborator_id": "08935154-c4d7-4ea8-8eec-7d963d9afda0"}', '{}', '41851449-0243-45d0-bb5d-c6f9b29adf00', 'contato.vtpereira@gmail.com', 'authenticated', false, 'trigger', 'audit_row_change_collaborator_categories'),
	(19, '2026-04-01 19:07:17.669344+00', 1629, 'public', 'collaborator_categories', 'INSERT', '{"category_id": "2f9c0b2a-cfaf-4936-a433-c999ee23e95a", "collaborator_id": "82020607-3ee8-4ba0-8842-b505ffc408ed"}', NULL, '{"created_at": "2026-04-01T19:07:17.669344+00:00", "category_id": "2f9c0b2a-cfaf-4936-a433-c999ee23e95a", "collaborator_id": "82020607-3ee8-4ba0-8842-b505ffc408ed"}', '{}', '41851449-0243-45d0-bb5d-c6f9b29adf00', 'contato.vtpereira@gmail.com', 'authenticated', false, 'trigger', 'audit_row_change_collaborator_categories'),
	(20, '2026-04-01 19:07:21.995997+00', 1630, 'public', 'collaborators', 'UPDATE', '{"id": "6ac24ab5-b562-41d0-ab8b-39fe215e9b1d"}', '{"id": "6ac24ab5-b562-41d0-ab8b-39fe215e9b1d", "name": "Pedro Ferrarini", "role": "Gestor", "is_active": true, "created_at": "2026-03-25T19:38:53.601922+00:00", "external_id": "pedro-ferrarini-mn6g5kcb-12"}', '{"id": "6ac24ab5-b562-41d0-ab8b-39fe215e9b1d", "name": "Pedro Ferrarini", "role": "Gestor", "is_active": false, "created_at": "2026-03-25T19:38:53.601922+00:00", "external_id": "pedro-ferrarini-mn6g5kcb-12"}', '{is_active}', '41851449-0243-45d0-bb5d-c6f9b29adf00', 'contato.vtpereira@gmail.com', 'authenticated', false, 'trigger', 'audit_row_change_collaborators'),
	(21, '2026-04-01 19:07:22.076755+00', 1631, 'public', 'portal_events', 'EVENT', '{"event": "user_deactivated"}', NULL, '{"user_id": "6ac24ab5-b562-41d0-ab8b-39fe215e9b1d", "user_name": "Pedro Ferrarini", "changed_by": "contato.vtpereira@gmail.com", "user_email_like_id": "pedro-ferrarini-mn6g5kcb-12"}', '{}', '41851449-0243-45d0-bb5d-c6f9b29adf00', 'contato.vtpereira@gmail.com', 'authenticated', false, 'manual', 'user_deactivated'),
	(22, '2026-04-01 20:12:51.1355+00', 1651, 'public', 'portal_events', 'EVENT', '{"event": "admin_login_success"}', NULL, '{"email": "rafael@organnact.com"}', '{}', 'ee9ed498-cc1a-4ce4-979e-2037c200493f', 'rafael@organnact.com', 'admin', false, 'manual', 'admin_login_success'),
	(23, '2026-04-01 20:13:29.519902+00', 1655, 'public', 'portal_events', 'EVENT', '{"event": "admin_changed_own_password"}', NULL, '{"email": "rafael@organnact.com", "user_id": "ee9ed498-cc1a-4ce4-979e-2037c200493f"}', '{}', 'ee9ed498-cc1a-4ce4-979e-2037c200493f', 'rafael@organnact.com', 'admin', false, 'manual', 'admin_changed_own_password');


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."categories" ("id", "name", "sort_order", "created_at") VALUES
	('7e7593b9-7f23-4f74-a6d0-57b04a2031b7', 'Salesforce', 1, '2026-03-23 14:32:14.373538+00'),
	('44c46378-84f2-44b7-b6b7-25398fa99fb2', 'Orgamind', 3, '2026-03-23 14:32:14.373538+00'),
	('2f9c0b2a-cfaf-4936-a433-c999ee23e95a', 'PowerBI', 2, '2026-04-01 12:04:32.209701+00');


--
-- Data for Name: collaborators; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."collaborators" ("id", "external_id", "name", "role", "created_at", "is_active") VALUES
	('c5b61f00-030f-4396-92c6-59a3627a35d3', 'ricardo-bacila-mn6g5jq0-5', 'Ricardo Bacila', 'Diretor Comercial EUA', '2026-03-25 19:38:52.819435+00', true),
	('8d50528c-5f8b-4903-89a8-86838cee3b0a', 'manoela-belich-mn6g5jtd-6', 'Manoela Belich', 'Analista Comercial', '2026-03-25 19:38:52.924378+00', true),
	('a7852354-c940-41d3-adde-abe128dac3a2', 'leticia-ribeiro-mn6g5l2s-20', 'Letícia Ribeiro', 'Analista de Conteúdo', '2026-03-25 19:38:54.550009+00', true),
	('eeecb41e-0120-4628-b189-7bdf98ce2c5b', 'mariana-hammerschmidt-mn6g5lag-23', 'Mariana Hammerschmidt', 'Analista Comercial Redes / BePet', '2026-03-25 19:38:54.851958+00', true),
	('4530fb5e-dd5f-4055-9a0c-822b3fde2f62', 'mel-heloise-drula-moraes-mn6g5ldl-24', 'Mel Heloise Drula Moraes', 'Analista Comercial Todas as Áreas PET', '2026-03-25 19:38:54.944589+00', true),
	('7120bb9b-70fc-4882-9be5-230120e012f7', 'yusbegny-lyon-mn6g5lwo-32', 'Yusbegny Lyon', 'Analista Exportação', '2026-03-25 19:38:55.626607+00', true),
	('b77ed7a6-8dce-4f57-be31-834bf07310f1', 'luis-nyznyk-mn6g5m6c-36', 'Luis Nyznyk', 'Analista Orgadata', '2026-03-25 19:38:55.969963+00', true),
	('57202e13-fa0b-4a4f-b7b9-47846b4f0a55', 'dhionavan-de-paula-mn6g5mhw-41', 'Dhionavan De Paula', 'Analista de Conteúdo', '2026-03-25 19:38:56.384943+00', true),
	('82020607-3ee8-4ba0-8842-b505ffc408ed', 'rafael-rosa-mn6g5kl6-15', 'Rafael Rosa', 'Gerente', '2026-03-25 19:38:53.930483+00', true),
	('077f15fe-224c-412c-b48a-2658af301fdf', 'maria-eduarda-schwartz-mn6g5ngk-55', 'Maria Eduarda Schwartz', 'Propagandista Trade PET', '2026-03-25 19:38:57.634584+00', true),
	('b9cdfae1-7a8d-481a-a03a-6094c1d800d9', 'myliana-katlyn-de-oliveira-da-silva-mn6g5nj2-56', 'Myliana Katlyn De Oliveira Da Silva', 'Analista Comercial Equinos', '2026-03-25 19:38:57.724902+00', true),
	('02a9f8ec-8741-4c2c-91de-f5daff282d07', 'antonio-bacila-mn6g5mb3-38', 'Antonio Bacila', 'Diretor', '2026-03-25 19:38:56.139336+00', true),
	('67ea427f-23d6-494b-b8f5-adaf5196bee3', 'erick-rufino-mn6g5knr-16', 'Erick Rufino', 'Gestor Propagandista', '2026-03-25 19:38:54.025867+00', true),
	('cc8bfe7f-33d1-4f2b-80a3-c50973683424', 'thais-de-brito-batinga-mn6g5l7l-22', 'Thais de Brito Batinga', 'Coordenador', '2026-03-25 19:38:54.725607+00', true),
	('7142b2d6-7d2e-494a-96a0-d1e39763b6b1', 'adriana-silva-batista-brandao-mn6g5lg1-25', 'Adriana Silva Batista Brandão', 'Gestor Pet e Kitchen', '2026-03-25 19:38:55.024842+00', true),
	('c32849f3-6247-413c-8b74-bdb2f6f70682', 'alexandre-ferrarini-mn6g5k8y-11', 'Alexandre Ferrarini', 'Gerente Comercial Grandes Animais', '2026-03-25 19:38:53.49606+00', true),
	('d7c4c013-235f-449a-9659-5bb2f8584030', 'alexandre-miotto-mn6g5lnz-28', 'Alexandre Miotto', 'Analista Comercial Equinos', '2026-03-25 19:38:55.310644+00', true),
	('a73fa231-579a-4b14-9e54-a05006da1d11', 'anna-clara-marques-souza-mn6g5nax-53', 'Anna Clara Marques Souza', 'Assistente Comercial The Pet', '2026-03-25 19:38:57.446119+00', true),
	('4fd392b8-ff27-46ed-bf91-f9f460a4dfda', 'andreo-figueiredo-mn6g5mpa-44', 'Andreo Figueiredo', 'Assistente Trade', '2026-03-25 19:38:56.662761+00', true),
	('178e2490-2899-4847-a670-e5fd9eb6e665', 'andre-coelho-mn6g5k33-9', 'Andre Coelho', 'Gestor Comercial Equinos', '2026-03-25 19:38:53.284991+00', true),
	('40f0af7d-7796-4ebe-95cb-a39ee5cd1121', 'nicholle-guertzenstein-mn6g5krl-17', 'Nicholle Guertzenstein', 'Gerente', '2026-03-25 19:38:54.16808+00', true),
	('73eb89d5-9ec6-461e-a009-9767d1c475a6', 'vitor-almeida-mn4zyokh', 'Vitor Almeida', 'Analista', '2026-03-24 19:17:52.719313+00', true),
	('48db02ee-7b8a-4a74-ad6a-7b837b570e74', 'beatriz-salvador-mn6g5n82-52', 'Beatriz Salvador', 'Analista Comercial Redes / BePet', '2026-03-25 19:38:57.337915+00', true),
	('81d8e1a4-f8fa-47a6-a2d2-64aee63efa43', 'diego-bergamini-mn6g5jwa-7', 'Diego Bergamini', 'Gerente de Trade PET', '2026-03-25 19:38:53.02489+00', true),
	('c41ccb2b-87da-4762-a6a1-3a8413813e08', 'elly-cavasini-mn6g5m48-35', 'Élly Cavasini', 'Analista PET', '2026-03-25 19:38:55.897079+00', true),
	('5d2bc339-34cf-47d5-9518-ef30eeae6a17', 'evelyn-medeiros-mn6g5ndj-54', 'Evelyn Medeiros', 'Gestor Comercial Equinos', '2026-03-25 19:38:57.534086+00', true),
	('4ca88f38-90b6-47cf-9ff7-c66acca35b4f', 'emizael-correa-bueno-junior-mn6g5n58-51', 'Emizael Correa Bueno Júnior', 'Coordenador DNE', '2026-03-25 19:38:57.245582+00', true),
	('0a2e3613-2798-4875-bc63-3fc5564b5688', 'etielli-caroline-delmonico-caria-mn6g5lul-31', 'Etielli Caroline Delmonico Caria', 'Gestor Trade PET', '2026-03-25 19:38:55.549433+00', true),
	('4170da98-5321-4b4a-b2ae-69f05f52d3ab', 'gabriel-leite-de-freitas-mn6g5lki-27', 'Gabriel Leite de Freitas', 'Gerente de Relacionamento Equino', '2026-03-25 19:38:55.216945+00', true),
	('013d5a26-648d-405e-acc1-3a499f0e6f85', 'isabelle-crystinne-anastacio-mn6g5k68-10', 'Isabelle Crystinne Anastacio', 'Gestor Pet e Kitchen', '2026-03-25 19:38:53.381116+00', true),
	('df487668-9621-48bd-9aa8-97db37e1e296', 'isabelle-orcelli-torriani-mn6g5m1w-34', 'Isabelle Orcelli Torriani', 'Assistente Comercial PET', '2026-03-25 19:38:55.819532+00', true),
	('295c552b-2f8e-48a8-a11f-deced9f9cfcd', 'henrique-ibsch-wilke-mn6g5li8-26', 'Henrique Ibsch Wilke', 'Analista de Dados Geral PET', '2026-03-25 19:38:55.106872+00', true),
	('eb47e690-c7a0-4d6f-bcf6-186553b06b42', 'isabela-santos-mn6g5mto-46', 'Isabela Santos', 'Assistentes de Comunicação', '2026-03-25 19:38:56.819494+00', true),
	('6eb48f8d-f161-4559-b99b-38b7d883ffdd', 'jeane-castro-mn6g5jyv-8', 'Jeane Castro', 'Gerente Comercial Pet Kitchen', '2026-03-25 19:38:53.138836+00', true),
	('fb47d007-44b6-43ba-8b21-61830e058402', 'isabelly-camargo-candido-da-silva-mn6g5mw0-47', 'Isabelly Camargo Cândido da Silva', 'Assistente Comercial PET', '2026-03-25 19:38:56.897921+00', true),
	('f53d86fc-187f-437f-94fd-581c4aa15663', 'jorge-bacila-mn6g5jlj-4', 'Jorge Bacila', 'Diretor Comercial & MKT', '2026-03-25 19:38:52.665726+00', true),
	('6d94a321-8ca6-47e6-9ffe-25939c0c2708', 'israel-fuentes-mn6g5l59-21', 'Israel Fuentes', 'Coordenador de Marketing', '2026-03-25 19:38:54.638079+00', true),
	('25328463-6216-435a-8162-66266e71ea85', 'janaina-paixao-moreira-mn6g5m8k-37', 'Janaina Paixão Moreira', 'Analista de Verbas', '2026-03-25 19:38:56.051041+00', true),
	('e463478b-0cee-4002-ae0c-dedd10dcc202', 'jordan-arruda-mn6g5nl6-57', 'Jordan Arruda', 'Analista Comercial PET', '2026-03-25 19:38:57.797649+00', true),
	('727b02f9-4a81-4d88-aa4b-9a393177bc7a', 'karen-bacila-mn6g5kf2-13', 'Karen Bacila', 'Gerente Comercial Pet Kitchen e BePet', '2026-03-25 19:38:53.699888+00', true),
	('6a7b0035-593b-4a09-aac7-aef736efc966', 'juliana-cristina-saran-mn6g5lz9-33', 'Juliana Cristina Saran', 'Coordenador Trade PET', '2026-03-25 19:38:55.732318+00', true),
	('f646c620-261f-4e58-8ccc-20863d8c4354', 'anna-zanlorenzi-mn6g5mfb-40', 'Anna Zanlorenzi', 'Coordenador', '2026-03-25 19:38:56.306702+00', true),
	('11eea3e8-6bad-48c4-96bb-99ea9c2094dc', 'nathan-zamoner-mn6g5kyn-19', 'Nathan Zamoner', 'Coordenador', '2026-03-25 19:38:54.445313+00', true),
	('d44141a7-691c-4818-87ea-b805ce955dae', 'eduarda-rossa-braz-mn6g5mn1-43', 'Eduarda Rossa Braz', 'Analista', '2026-03-25 19:38:56.574415+00', true),
	('92227701-6dd1-4d49-9304-0428731fe3d5', 'nathalia-tonet-mn6g5kwa-18', 'Nathalia Tonet', 'Gerente', '2026-03-25 19:38:54.320333+00', true),
	('6ac24ab5-b562-41d0-ab8b-39fe215e9b1d', 'pedro-ferrarini-mn6g5kcb-12', 'Pedro Ferrarini', 'Gestor', '2026-03-25 19:38:53.601922+00', false),
	('a69439e1-9b1c-4189-98cd-7fe311f3d586', 'mayara-pacheco-mn6g5khq-14', 'Mayara Pacheco', 'Gestor', '2026-03-25 19:38:53.801766+00', true),
	('5aceb686-5934-498b-acdb-409c66ea8c3b', 'murilo-oliveira-mn6g5mrr-45', 'Murilo Oliveira', 'Gestor', '2026-03-25 19:38:56.737668+00', true),
	('6be07146-56af-45b3-9959-1fb7d1ba6c53', 'nicole-agurto-mn6g5jhh-3', 'Nicole Agurto', 'Gestor', '2026-03-25 19:38:52.524959+00', true),
	('d5d46c8e-a190-4269-8304-e2533b280201', 'roberta-ibsch-wilke-mn6g5lse-30', 'Roberta Ibsch Wilke', 'Gestor', '2026-03-25 19:38:55.467265+00', true),
	('8c7bb733-a5f8-41c9-a7cd-d1214a33f9a4', 'adriana-lopes-mn6g5iox-1', 'Adriana Lopes', 'Gerente Organnact USA', '2026-03-25 19:38:52.141895+00', false),
	('53876915-c175-4a2b-a863-088034f6d824', 'raphael-martins-vieira-mn6g5my3-48', 'Raphael Martins Vieira', 'Gestor', '2026-03-25 19:38:56.98644+00', true),
	('0fcf03bc-86e2-4473-869d-44792b8ae606', 'regina-de-lima-costa-mn6g5lq5-29', 'Regina de Lima Costa', 'Gerente', '2026-03-25 19:38:55.392015+00', true),
	('08935154-c4d7-4ea8-8eec-7d963d9afda0', 'orion-castro-mn6g5jd6-2', 'Orion Castro', 'Consultor', '2026-03-25 19:38:52.391364+00', true);


--
-- Data for Name: collaborator_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."collaborator_categories" ("collaborator_id", "category_id", "created_at") VALUES
	('8c7bb733-a5f8-41c9-a7cd-d1214a33f9a4', '7e7593b9-7f23-4f74-a6d0-57b04a2031b7', '2026-03-25 19:50:39.934808+00'),
	('7142b2d6-7d2e-494a-96a0-d1e39763b6b1', '7e7593b9-7f23-4f74-a6d0-57b04a2031b7', '2026-03-25 19:50:51.728158+00'),
	('7142b2d6-7d2e-494a-96a0-d1e39763b6b1', '44c46378-84f2-44b7-b6b7-25398fa99fb2', '2026-03-25 19:50:54.048741+00'),
	('c32849f3-6247-413c-8b74-bdb2f6f70682', '7e7593b9-7f23-4f74-a6d0-57b04a2031b7', '2026-03-25 19:50:58.223685+00'),
	('c32849f3-6247-413c-8b74-bdb2f6f70682', '44c46378-84f2-44b7-b6b7-25398fa99fb2', '2026-03-25 19:51:00.885093+00'),
	('d7c4c013-235f-449a-9659-5bb2f8584030', '7e7593b9-7f23-4f74-a6d0-57b04a2031b7', '2026-03-25 19:51:21.079622+00'),
	('d7c4c013-235f-449a-9659-5bb2f8584030', '44c46378-84f2-44b7-b6b7-25398fa99fb2', '2026-03-25 19:51:22.254788+00'),
	('178e2490-2899-4847-a670-e5fd9eb6e665', '7e7593b9-7f23-4f74-a6d0-57b04a2031b7', '2026-03-25 19:51:22.918963+00'),
	('4fd392b8-ff27-46ed-bf91-f9f460a4dfda', '7e7593b9-7f23-4f74-a6d0-57b04a2031b7', '2026-03-25 19:51:24.52454+00'),
	('4fd392b8-ff27-46ed-bf91-f9f460a4dfda', '44c46378-84f2-44b7-b6b7-25398fa99fb2', '2026-03-25 19:51:25.40534+00'),
	('178e2490-2899-4847-a670-e5fd9eb6e665', '44c46378-84f2-44b7-b6b7-25398fa99fb2', '2026-03-25 19:51:27.533083+00'),
	('a73fa231-579a-4b14-9e54-a05006da1d11', '7e7593b9-7f23-4f74-a6d0-57b04a2031b7', '2026-03-25 19:51:28.833491+00'),
	('a73fa231-579a-4b14-9e54-a05006da1d11', '44c46378-84f2-44b7-b6b7-25398fa99fb2', '2026-03-25 19:51:31.058244+00'),
	('f646c620-261f-4e58-8ccc-20863d8c4354', '7e7593b9-7f23-4f74-a6d0-57b04a2031b7', '2026-03-25 19:51:32.11461+00'),
	('8c7bb733-a5f8-41c9-a7cd-d1214a33f9a4', '44c46378-84f2-44b7-b6b7-25398fa99fb2', '2026-03-25 19:52:13.224468+00'),
	('48db02ee-7b8a-4a74-ad6a-7b837b570e74', '7e7593b9-7f23-4f74-a6d0-57b04a2031b7', '2026-03-25 19:52:17.719107+00'),
	('48db02ee-7b8a-4a74-ad6a-7b837b570e74', '44c46378-84f2-44b7-b6b7-25398fa99fb2', '2026-03-25 19:52:19.772118+00'),
	('81d8e1a4-f8fa-47a6-a2d2-64aee63efa43', '7e7593b9-7f23-4f74-a6d0-57b04a2031b7', '2026-03-25 19:52:30.232856+00'),
	('81d8e1a4-f8fa-47a6-a2d2-64aee63efa43', '44c46378-84f2-44b7-b6b7-25398fa99fb2', '2026-03-25 19:52:32.221833+00'),
	('d44141a7-691c-4818-87ea-b805ce955dae', '7e7593b9-7f23-4f74-a6d0-57b04a2031b7', '2026-03-25 19:52:35.516088+00'),
	('d44141a7-691c-4818-87ea-b805ce955dae', '44c46378-84f2-44b7-b6b7-25398fa99fb2', '2026-03-25 19:52:36.525728+00'),
	('c41ccb2b-87da-4762-a6a1-3a8413813e08', '7e7593b9-7f23-4f74-a6d0-57b04a2031b7', '2026-03-25 19:52:38.692486+00'),
	('c41ccb2b-87da-4762-a6a1-3a8413813e08', '44c46378-84f2-44b7-b6b7-25398fa99fb2', '2026-03-25 19:52:39.626944+00'),
	('4ca88f38-90b6-47cf-9ff7-c66acca35b4f', '7e7593b9-7f23-4f74-a6d0-57b04a2031b7', '2026-03-25 19:52:42.948693+00'),
	('4ca88f38-90b6-47cf-9ff7-c66acca35b4f', '44c46378-84f2-44b7-b6b7-25398fa99fb2', '2026-03-25 19:52:44.768792+00'),
	('67ea427f-23d6-494b-b8f5-adaf5196bee3', '7e7593b9-7f23-4f74-a6d0-57b04a2031b7', '2026-03-25 19:52:46.17283+00'),
	('67ea427f-23d6-494b-b8f5-adaf5196bee3', '44c46378-84f2-44b7-b6b7-25398fa99fb2', '2026-03-25 19:52:47.357382+00'),
	('0a2e3613-2798-4875-bc63-3fc5564b5688', '7e7593b9-7f23-4f74-a6d0-57b04a2031b7', '2026-03-25 19:52:49.856238+00'),
	('0a2e3613-2798-4875-bc63-3fc5564b5688', '44c46378-84f2-44b7-b6b7-25398fa99fb2', '2026-03-25 19:52:51.820423+00'),
	('5d2bc339-34cf-47d5-9518-ef30eeae6a17', '7e7593b9-7f23-4f74-a6d0-57b04a2031b7', '2026-03-25 19:52:54.711332+00'),
	('5d2bc339-34cf-47d5-9518-ef30eeae6a17', '44c46378-84f2-44b7-b6b7-25398fa99fb2', '2026-03-25 19:52:56.49059+00'),
	('4170da98-5321-4b4a-b2ae-69f05f52d3ab', '7e7593b9-7f23-4f74-a6d0-57b04a2031b7', '2026-03-25 19:53:13.446422+00'),
	('4170da98-5321-4b4a-b2ae-69f05f52d3ab', '44c46378-84f2-44b7-b6b7-25398fa99fb2', '2026-03-25 19:53:14.386334+00'),
	('295c552b-2f8e-48a8-a11f-deced9f9cfcd', '7e7593b9-7f23-4f74-a6d0-57b04a2031b7', '2026-03-25 19:53:17.749521+00'),
	('295c552b-2f8e-48a8-a11f-deced9f9cfcd', '44c46378-84f2-44b7-b6b7-25398fa99fb2', '2026-03-25 19:53:19.679623+00'),
	('eb47e690-c7a0-4d6f-bcf6-186553b06b42', '7e7593b9-7f23-4f74-a6d0-57b04a2031b7', '2026-03-25 19:53:22.138587+00'),
	('eb47e690-c7a0-4d6f-bcf6-186553b06b42', '44c46378-84f2-44b7-b6b7-25398fa99fb2', '2026-03-25 19:53:24.493084+00'),
	('013d5a26-648d-405e-acc1-3a499f0e6f85', '7e7593b9-7f23-4f74-a6d0-57b04a2031b7', '2026-03-25 19:53:26.630605+00'),
	('013d5a26-648d-405e-acc1-3a499f0e6f85', '44c46378-84f2-44b7-b6b7-25398fa99fb2', '2026-03-25 19:53:28.219651+00'),
	('df487668-9621-48bd-9aa8-97db37e1e296', '7e7593b9-7f23-4f74-a6d0-57b04a2031b7', '2026-03-25 19:53:31.766832+00'),
	('df487668-9621-48bd-9aa8-97db37e1e296', '44c46378-84f2-44b7-b6b7-25398fa99fb2', '2026-03-25 19:53:32.941869+00'),
	('fb47d007-44b6-43ba-8b21-61830e058402', '7e7593b9-7f23-4f74-a6d0-57b04a2031b7', '2026-03-25 19:53:34.271501+00'),
	('fb47d007-44b6-43ba-8b21-61830e058402', '44c46378-84f2-44b7-b6b7-25398fa99fb2', '2026-03-25 19:53:35.344418+00'),
	('6d94a321-8ca6-47e6-9ffe-25939c0c2708', '7e7593b9-7f23-4f74-a6d0-57b04a2031b7', '2026-03-25 19:53:37.220081+00'),
	('6d94a321-8ca6-47e6-9ffe-25939c0c2708', '44c46378-84f2-44b7-b6b7-25398fa99fb2', '2026-03-25 19:53:38.774319+00'),
	('25328463-6216-435a-8162-66266e71ea85', '7e7593b9-7f23-4f74-a6d0-57b04a2031b7', '2026-03-25 19:53:42.062227+00'),
	('25328463-6216-435a-8162-66266e71ea85', '44c46378-84f2-44b7-b6b7-25398fa99fb2', '2026-03-25 19:53:43.041127+00'),
	('6eb48f8d-f161-4559-b99b-38b7d883ffdd', '7e7593b9-7f23-4f74-a6d0-57b04a2031b7', '2026-03-25 19:53:44.391855+00'),
	('6eb48f8d-f161-4559-b99b-38b7d883ffdd', '44c46378-84f2-44b7-b6b7-25398fa99fb2', '2026-03-25 19:53:46.316286+00'),
	('e463478b-0cee-4002-ae0c-dedd10dcc202', '7e7593b9-7f23-4f74-a6d0-57b04a2031b7', '2026-03-25 19:53:48.988152+00'),
	('e463478b-0cee-4002-ae0c-dedd10dcc202', '44c46378-84f2-44b7-b6b7-25398fa99fb2', '2026-03-25 19:53:51.097508+00'),
	('f53d86fc-187f-437f-94fd-581c4aa15663', '7e7593b9-7f23-4f74-a6d0-57b04a2031b7', '2026-03-25 19:53:52.412671+00'),
	('f53d86fc-187f-437f-94fd-581c4aa15663', '44c46378-84f2-44b7-b6b7-25398fa99fb2', '2026-03-25 19:53:54.407088+00'),
	('6a7b0035-593b-4a09-aac7-aef736efc966', '7e7593b9-7f23-4f74-a6d0-57b04a2031b7', '2026-03-25 19:53:56.447047+00'),
	('6a7b0035-593b-4a09-aac7-aef736efc966', '44c46378-84f2-44b7-b6b7-25398fa99fb2', '2026-03-25 19:53:57.605248+00'),
	('727b02f9-4a81-4d88-aa4b-9a393177bc7a', '7e7593b9-7f23-4f74-a6d0-57b04a2031b7', '2026-03-25 19:54:00.48908+00'),
	('727b02f9-4a81-4d88-aa4b-9a393177bc7a', '44c46378-84f2-44b7-b6b7-25398fa99fb2', '2026-03-25 19:54:02.411788+00'),
	('02a9f8ec-8741-4c2c-91de-f5daff282d07', '7e7593b9-7f23-4f74-a6d0-57b04a2031b7', '2026-03-30 16:45:14.181225+00'),
	('02a9f8ec-8741-4c2c-91de-f5daff282d07', '44c46378-84f2-44b7-b6b7-25398fa99fb2', '2026-03-30 16:45:14.181225+00'),
	('f646c620-261f-4e58-8ccc-20863d8c4354', '44c46378-84f2-44b7-b6b7-25398fa99fb2', '2026-03-30 16:45:15.376073+00'),
	('11eea3e8-6bad-48c4-96bb-99ea9c2094dc', '7e7593b9-7f23-4f74-a6d0-57b04a2031b7', '2026-03-30 18:30:25.513927+00'),
	('11eea3e8-6bad-48c4-96bb-99ea9c2094dc', '44c46378-84f2-44b7-b6b7-25398fa99fb2', '2026-03-30 18:30:25.513927+00'),
	('cc8bfe7f-33d1-4f2b-80a3-c50973683424', '7e7593b9-7f23-4f74-a6d0-57b04a2031b7', '2026-03-30 18:30:25.708325+00'),
	('cc8bfe7f-33d1-4f2b-80a3-c50973683424', '44c46378-84f2-44b7-b6b7-25398fa99fb2', '2026-03-30 18:30:25.708325+00'),
	('40f0af7d-7796-4ebe-95cb-a39ee5cd1121', '7e7593b9-7f23-4f74-a6d0-57b04a2031b7', '2026-03-30 18:30:25.864685+00'),
	('40f0af7d-7796-4ebe-95cb-a39ee5cd1121', '44c46378-84f2-44b7-b6b7-25398fa99fb2', '2026-03-30 18:30:25.864685+00'),
	('92227701-6dd1-4d49-9304-0428731fe3d5', '7e7593b9-7f23-4f74-a6d0-57b04a2031b7', '2026-03-30 18:30:25.983498+00'),
	('92227701-6dd1-4d49-9304-0428731fe3d5', '44c46378-84f2-44b7-b6b7-25398fa99fb2', '2026-03-30 18:30:25.983498+00'),
	('82020607-3ee8-4ba0-8842-b505ffc408ed', '7e7593b9-7f23-4f74-a6d0-57b04a2031b7', '2026-03-30 18:30:26.137341+00'),
	('82020607-3ee8-4ba0-8842-b505ffc408ed', '44c46378-84f2-44b7-b6b7-25398fa99fb2', '2026-03-30 18:30:26.137341+00'),
	('0fcf03bc-86e2-4473-869d-44792b8ae606', '7e7593b9-7f23-4f74-a6d0-57b04a2031b7', '2026-03-30 18:30:26.241504+00'),
	('0fcf03bc-86e2-4473-869d-44792b8ae606', '44c46378-84f2-44b7-b6b7-25398fa99fb2', '2026-03-30 18:30:26.241504+00'),
	('a69439e1-9b1c-4189-98cd-7fe311f3d586', '7e7593b9-7f23-4f74-a6d0-57b04a2031b7', '2026-03-30 18:30:26.356807+00'),
	('a69439e1-9b1c-4189-98cd-7fe311f3d586', '44c46378-84f2-44b7-b6b7-25398fa99fb2', '2026-03-30 18:30:26.356807+00'),
	('5aceb686-5934-498b-acdb-409c66ea8c3b', '7e7593b9-7f23-4f74-a6d0-57b04a2031b7', '2026-03-30 18:30:26.472757+00'),
	('5aceb686-5934-498b-acdb-409c66ea8c3b', '44c46378-84f2-44b7-b6b7-25398fa99fb2', '2026-03-30 18:30:26.472757+00'),
	('6be07146-56af-45b3-9959-1fb7d1ba6c53', '7e7593b9-7f23-4f74-a6d0-57b04a2031b7', '2026-03-30 18:30:26.624726+00'),
	('6be07146-56af-45b3-9959-1fb7d1ba6c53', '44c46378-84f2-44b7-b6b7-25398fa99fb2', '2026-03-30 18:30:26.624726+00'),
	('6ac24ab5-b562-41d0-ab8b-39fe215e9b1d', '7e7593b9-7f23-4f74-a6d0-57b04a2031b7', '2026-03-30 18:30:26.731605+00'),
	('6ac24ab5-b562-41d0-ab8b-39fe215e9b1d', '44c46378-84f2-44b7-b6b7-25398fa99fb2', '2026-03-30 18:30:26.731605+00'),
	('53876915-c175-4a2b-a863-088034f6d824', '7e7593b9-7f23-4f74-a6d0-57b04a2031b7', '2026-03-30 18:30:26.871814+00'),
	('53876915-c175-4a2b-a863-088034f6d824', '44c46378-84f2-44b7-b6b7-25398fa99fb2', '2026-03-30 18:30:26.871814+00'),
	('d5d46c8e-a190-4269-8304-e2533b280201', '7e7593b9-7f23-4f74-a6d0-57b04a2031b7', '2026-03-30 18:30:26.953715+00'),
	('d5d46c8e-a190-4269-8304-e2533b280201', '44c46378-84f2-44b7-b6b7-25398fa99fb2', '2026-03-30 18:30:26.953715+00'),
	('73eb89d5-9ec6-461e-a009-9767d1c475a6', '7e7593b9-7f23-4f74-a6d0-57b04a2031b7', '2026-04-01 19:07:17.389113+00'),
	('53876915-c175-4a2b-a863-088034f6d824', '2f9c0b2a-cfaf-4936-a433-c999ee23e95a', '2026-04-01 19:07:17.486255+00'),
	('0fcf03bc-86e2-4473-869d-44792b8ae606', '2f9c0b2a-cfaf-4936-a433-c999ee23e95a', '2026-04-01 19:07:17.544392+00'),
	('08935154-c4d7-4ea8-8eec-7d963d9afda0', '7e7593b9-7f23-4f74-a6d0-57b04a2031b7', '2026-04-01 19:07:17.60886+00'),
	('08935154-c4d7-4ea8-8eec-7d963d9afda0', '44c46378-84f2-44b7-b6b7-25398fa99fb2', '2026-04-01 19:07:17.60886+00'),
	('08935154-c4d7-4ea8-8eec-7d963d9afda0', '2f9c0b2a-cfaf-4936-a433-c999ee23e95a', '2026-04-01 19:07:17.60886+00'),
	('82020607-3ee8-4ba0-8842-b505ffc408ed', '2f9c0b2a-cfaf-4936-a433-c999ee23e95a', '2026-04-01 19:07:17.669344+00');


--
-- Data for Name: modules; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."modules" ("id", "category_id", "name", "sort_order", "created_at") VALUES
	('ff6db0f0-cf60-4363-b7a6-71517ab6e5a5', '7e7593b9-7f23-4f74-a6d0-57b04a2031b7', 'CRM Básico', 1, '2026-03-24 18:29:49.280863+00'),
	('3f405491-1641-41b9-be35-cdf24a65eb1f', '7e7593b9-7f23-4f74-a6d0-57b04a2031b7', 'Visitas', 2, '2026-03-23 14:32:14.373538+00'),
	('f57f4781-5406-4eb9-8d6f-6b1610b5b7a5', '7e7593b9-7f23-4f74-a6d0-57b04a2031b7', 'Objetos Personalizados', 3, '2026-03-24 18:29:49.280863+00'),
	('55daf3c8-d68f-4f21-82fa-aa98a8a6bf14', '7e7593b9-7f23-4f74-a6d0-57b04a2031b7', 'Contas', 4, '2026-03-23 14:32:14.373538+00'),
	('67fd67c2-ed7a-4add-ab1f-5fecaab34142', '7e7593b9-7f23-4f74-a6d0-57b04a2031b7', 'Automação', 5, '2026-03-24 18:29:49.280863+00'),
	('20e9a4c2-d459-443d-aa1f-6b7bb9229d3a', '7e7593b9-7f23-4f74-a6d0-57b04a2031b7', 'Evento em Grupo', 6, '2026-03-23 14:46:33.174573+00'),
	('b1b05d8c-617e-412d-9be6-8a748b01920c', '44c46378-84f2-44b7-b6b7-25398fa99fb2', 'Noções Básicas (Acesso)', 1, '2026-03-31 14:45:38.597408+00'),
	('cc32b554-42f3-46c0-98f3-b9d442555903', '44c46378-84f2-44b7-b6b7-25398fa99fb2', 'Dr. Vet Expert', 2, '2026-03-31 14:46:40.759045+00'),
	('776a4875-6412-4c89-9129-ae2d0691a8d8', '44c46378-84f2-44b7-b6b7-25398fa99fb2', 'Dr. Personal Horse', 3, '2026-03-31 14:46:54.115553+00'),
	('ac93f75e-8968-46cb-a211-cba8a189d0b1', '44c46378-84f2-44b7-b6b7-25398fa99fb2', 'Orgamind Avançado', 4, '2026-03-31 14:47:35.25263+00'),
	('a7baaeb6-030d-4262-b6b7-bc90e7829e89', '2f9c0b2a-cfaf-4936-a433-c999ee23e95a', 'DAX Básico', 1, '2026-04-01 12:04:32.209701+00'),
	('62f5ca74-b90e-448c-ae1b-f2297faeb6fd', '2f9c0b2a-cfaf-4936-a433-c999ee23e95a', 'Modelagem de Dados', 2, '2026-04-01 12:04:32.209701+00'),
	('8fa92cf6-b664-4dbe-a65e-8ca1c56298c6', '2f9c0b2a-cfaf-4936-a433-c999ee23e95a', 'Visualizações', 3, '2026-04-01 12:04:32.209701+00');


--
-- Data for Name: collaborator_module_status; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."collaborator_module_status" ("collaborator_id", "module_id", "status", "updated_at") VALUES
	('8c7bb733-a5f8-41c9-a7cd-d1214a33f9a4', '55daf3c8-d68f-4f21-82fa-aa98a8a6bf14', 'Pendente', '2026-03-26 20:09:50.625573+00'),
	('7142b2d6-7d2e-494a-96a0-d1e39763b6b1', 'f57f4781-5406-4eb9-8d6f-6b1610b5b7a5', 'Pendente', '2026-03-30 15:07:13.170207+00'),
	('7142b2d6-7d2e-494a-96a0-d1e39763b6b1', '55daf3c8-d68f-4f21-82fa-aa98a8a6bf14', 'Pendente', '2026-03-30 15:07:13.170207+00'),
	('8c7bb733-a5f8-41c9-a7cd-d1214a33f9a4', '3f405491-1641-41b9-be35-cdf24a65eb1f', 'Concluído', '2026-03-31 14:29:41.452661+00'),
	('7142b2d6-7d2e-494a-96a0-d1e39763b6b1', '3f405491-1641-41b9-be35-cdf24a65eb1f', 'Concluído', '2026-03-31 14:29:41.452661+00'),
	('8c7bb733-a5f8-41c9-a7cd-d1214a33f9a4', 'f57f4781-5406-4eb9-8d6f-6b1610b5b7a5', 'Concluído', '2026-03-31 14:29:41.452661+00'),
	('c32849f3-6247-413c-8b74-bdb2f6f70682', '3f405491-1641-41b9-be35-cdf24a65eb1f', 'Concluído', '2026-03-31 14:29:41.452661+00'),
	('d7c4c013-235f-449a-9659-5bb2f8584030', '3f405491-1641-41b9-be35-cdf24a65eb1f', 'Concluído', '2026-03-31 14:29:41.452661+00'),
	('178e2490-2899-4847-a670-e5fd9eb6e665', '3f405491-1641-41b9-be35-cdf24a65eb1f', 'Concluído', '2026-03-31 14:29:41.452661+00'),
	('a73fa231-579a-4b14-9e54-a05006da1d11', '3f405491-1641-41b9-be35-cdf24a65eb1f', 'Concluído', '2026-03-31 14:29:41.452661+00'),
	('f646c620-261f-4e58-8ccc-20863d8c4354', '3f405491-1641-41b9-be35-cdf24a65eb1f', 'Concluído', '2026-03-31 14:29:41.452661+00'),
	('02a9f8ec-8741-4c2c-91de-f5daff282d07', '3f405491-1641-41b9-be35-cdf24a65eb1f', 'Concluído', '2026-03-31 14:29:41.452661+00'),
	('4fd392b8-ff27-46ed-bf91-f9f460a4dfda', '3f405491-1641-41b9-be35-cdf24a65eb1f', 'Concluído', '2026-03-31 14:29:41.452661+00'),
	('4fd392b8-ff27-46ed-bf91-f9f460a4dfda', 'f57f4781-5406-4eb9-8d6f-6b1610b5b7a5', 'Concluído', '2026-03-31 14:29:41.452661+00'),
	('4fd392b8-ff27-46ed-bf91-f9f460a4dfda', '55daf3c8-d68f-4f21-82fa-aa98a8a6bf14', 'Concluído', '2026-03-31 14:29:41.452661+00'),
	('4fd392b8-ff27-46ed-bf91-f9f460a4dfda', '20e9a4c2-d459-443d-aa1f-6b7bb9229d3a', 'Concluído', '2026-03-31 14:29:41.452661+00'),
	('4fd392b8-ff27-46ed-bf91-f9f460a4dfda', '67fd67c2-ed7a-4add-ab1f-5fecaab34142', 'Concluído', '2026-03-31 14:29:41.452661+00');


--
-- Data for Name: comunicados; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."comunicados" ("id", "label", "title", "summary", "content", "cta_label", "cta_url", "published_at", "is_active", "created_at", "updated_at") VALUES
	('4522b7f3-622a-45a5-bdd1-8b8c0cfa2e39', 'COMUNICADO', 'Hello World. Welcome!', 'só um teste', 'IHAAA MEU PARCERO', 'Ver detalhes', NULL, '2026-04-01 19:43:00+00', true, '2026-04-01 19:43:37.757105+00', '2026-04-01 19:43:37.757105+00');


--
-- Data for Name: noticias; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."noticias" ("id", "title", "summary", "content", "category", "image_url", "source_url", "published_at", "is_published", "created_at", "updated_at") VALUES
	('55f27e19-367d-4b42-8e80-254b37635899', 'News #829 | Organnact da as boas vindas ao novo portal interno!', 'Segura essa novidade!', 'Where does it come from?
Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum" (The Extremes of Good and Evil) by Cicero, written in 45 BC. This book is a treatise on the theory of ethics, very popular during the Renaissance. The first line of Lorem Ipsum, "Lorem ipsum dolor sit amet..", comes from a line in section 1.10.32.

The standard chunk of Lorem Ipsum used since the 1500s is reproduced below for those interested. Sections 1.10.32 and 1.10.33 from "de Finibus Bonorum et Malorum" by Cicero are also reproduced in their exact original form, accompanied by English versions from the 1914 translation by H. Rackham.', 'Geral', NULL, NULL, '2026-04-01 19:43:00+00', true, '2026-04-01 19:45:05.687866+00', '2026-04-01 19:45:05.687866+00');


--
-- Data for Name: portais; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."portais" ("id", "name", "description", "icon", "route", "color_classes", "color_hex", "image_url", "is_external", "external_url", "sort_order", "is_active", "created_at", "updated_at") VALUES
	('37f0ca2b-7d5d-43d0-a4fb-c43f31c2bd92', 'Portal de Materiais Comerciais', '', 'image', '', 'bg-rose-500/10 text-rose-500', '#f43f5e', 'data:image/webp;base64,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', false, NULL, 1, true, '2026-04-01 19:46:13.577891+00', '2026-04-01 19:46:43.831818+00');


--
-- Data for Name: portal_admins; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."portal_admins" ("id", "email", "created_at", "created_by") VALUES
	('9e9df235-5c9c-4263-9891-c32ebffdce79', 'contato.vtpereira@gmail.com', '2026-04-01 12:43:20.73077+00', 'setup'),
	('e2b87038-ad45-47f8-96c8-3d15c7fdd562', 'vitor.almeida@organnact.com', '2026-04-01 16:45:44.382721+00', 'contato.vtpereira@gmail.com'),
	('cebf2c3c-ab51-48b9-a59f-b0083bf26de3', 'rafael@organnact.com', '2026-04-01 13:12:58.727864+00', 'contato.vtpereira@gmail.com');


--
-- Data for Name: sistemas_principais; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."sistemas_principais" ("id", "name", "description", "icon", "color_classes", "color_hex", "image_url", "url", "sort_order", "is_active", "created_at", "updated_at") VALUES
	('124aafce-97ba-4515-bd53-2ffa79407192', 'Orgadata', 'Portal da Orgadata', 'image', 'bg-amber-500/10 text-amber-500', '#f59e0b', 'data:image/webp;base64,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', 'https://app.iacamp.com.br/', 1, true, '2026-04-01 19:41:09.092079+00', '2026-04-01 19:42:10.162539+00');


--
-- Name: audit_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."audit_log_id_seq"', 23, true);


--
-- PostgreSQL database dump complete
--

-- \unrestrict yqK74Imsat3VJJKmeGclewE8fbQKc73vYt7FGNfNpPa8CwCnoqucDkOIqlmmmB9

RESET ALL;

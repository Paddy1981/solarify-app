-- Firestore to BigQuery export query template
-- This query template is used by the BigQuery Data Transfer Service
-- to sync Firestore data to BigQuery for analytics

-- Export Users collection
CREATE OR REPLACE TABLE `${project_id}.${dataset_id}.users` AS
SELECT
  document_name,
  data.uid as user_id,
  data.email,
  data.role,
  data.status,
  data.created_at,
  data.updated_at,
  data.email_verified,
  data.profile_completed
FROM `${project_id}.${dataset_id}.users_raw_latest`
WHERE _PARTITIONTIME = (SELECT MAX(_PARTITIONTIME) FROM `${project_id}.${dataset_id}.users_raw_latest`);

-- Export RFQs collection
CREATE OR REPLACE TABLE `${project_id}.${dataset_id}.rfqs` AS
SELECT
  document_name,
  data.homeowner_id,
  data.status,
  data.created_at,
  data.updated_at,
  data.property_address,
  data.energy_needs,
  data.budget_range,
  data.timeline,
  data.selected_installer_ids,
  data.quotes_received_count
FROM `${project_id}.${dataset_id}.rfqs_raw_latest`
WHERE _PARTITIONTIME = (SELECT MAX(_PARTITIONTIME) FROM `${project_id}.${dataset_id}.rfqs_raw_latest`);

-- Export Solar Systems collection
CREATE OR REPLACE TABLE `${project_id}.${dataset_id}.solar_systems` AS
SELECT
  document_name,
  data.homeowner_id,
  data.installer_id,
  data.system_size_kw,
  data.panel_count,
  data.inverter_type,
  data.installation_date,
  data.commissioning_date,
  data.estimated_annual_production,
  data.warranty_years,
  data.created_at,
  data.updated_at
FROM `${project_id}.${dataset_id}.solar_systems_raw_latest`
WHERE _PARTITIONTIME = (SELECT MAX(_PARTITIONTIME) FROM `${project_id}.${dataset_id}.solar_systems_raw_latest`);

-- Export Energy Production collection
CREATE OR REPLACE TABLE `${project_id}.${dataset_id}.energy_production` AS
SELECT
  document_name,
  data.system_id,
  data.timestamp,
  data.energy_produced_kwh,
  data.power_output_kw,
  data.efficiency_ratio,
  data.weather_conditions,
  data.created_at
FROM `${project_id}.${dataset_id}.energy_production_raw_latest`
WHERE _PARTITIONTIME = (SELECT MAX(_PARTITIONTIME) FROM `${project_id}.${dataset_id}.energy_production_raw_latest`);

-- Create aggregated analytics views
-- Monthly RFQ summary
CREATE OR REPLACE VIEW `${project_id}.${dataset_id}.monthly_rfq_summary` AS
SELECT
  DATE_TRUNC(PARSE_DATETIME('%Y-%m-%d %H:%M:%S', data.created_at), MONTH) as month,
  COUNT(*) as total_rfqs,
  COUNT(CASE WHEN data.status = 'completed' THEN 1 END) as completed_rfqs,
  COUNT(CASE WHEN data.status = 'pending' THEN 1 END) as pending_rfqs,
  AVG(data.quotes_received_count) as avg_quotes_per_rfq
FROM `${project_id}.${dataset_id}.rfqs_raw_latest`
WHERE _PARTITIONTIME = (SELECT MAX(_PARTITIONTIME) FROM `${project_id}.${dataset_id}.rfqs_raw_latest`)
GROUP BY month
ORDER BY month;

-- System performance summary
CREATE OR REPLACE VIEW `${project_id}.${dataset_id}.system_performance_summary` AS
SELECT
  ss.document_name as system_id,
  ss.data.system_size_kw,
  ss.data.estimated_annual_production,
  AVG(ep.data.energy_produced_kwh) as avg_daily_production,
  SUM(ep.data.energy_produced_kwh) as total_production,
  AVG(ep.data.efficiency_ratio) as avg_efficiency
FROM `${project_id}.${dataset_id}.solar_systems_raw_latest` ss
LEFT JOIN `${project_id}.${dataset_id}.energy_production_raw_latest` ep
  ON ss.document_name = ep.data.system_id
WHERE ss._PARTITIONTIME = (SELECT MAX(_PARTITIONTIME) FROM `${project_id}.${dataset_id}.solar_systems_raw_latest`)
  AND ep._PARTITIONTIME = (SELECT MAX(_PARTITIONTIME) FROM `${project_id}.${dataset_id}.energy_production_raw_latest`)
GROUP BY ss.document_name, ss.data.system_size_kw, ss.data.estimated_annual_production;
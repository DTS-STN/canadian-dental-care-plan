package ca.gov.dtsstn.cdcp.api.data.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import ca.gov.dtsstn.cdcp.api.data.entity.EventLogEntity;

@Repository
public interface EventLogRepository extends JpaRepository<EventLogEntity, String> {}

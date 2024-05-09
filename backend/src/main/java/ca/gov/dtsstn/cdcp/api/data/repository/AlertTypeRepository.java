package ca.gov.dtsstn.cdcp.api.data.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import ca.gov.dtsstn.cdcp.api.data.entity.AlertTypeEntity;

/**
 * @author Lei Ye (lei.ye@hrsdc-rhdcc.gc.ca)
 */
public interface AlertTypeRepository extends JpaRepository<AlertTypeEntity, String> {

	Optional<AlertTypeEntity> findById(String id);
}

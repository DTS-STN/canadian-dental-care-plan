package ca.gov.dtsstn.cdcp.api.data.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import ca.gov.dtsstn.cdcp.api.data.entity.AlertTypeEntity;

public interface AlertTypeRepository extends JpaRepository<AlertTypeEntity, String> {

	@Override
	Optional<AlertTypeEntity> findById(String id);

}

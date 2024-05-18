package ca.gov.dtsstn.cdcp.api.data.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import ca.gov.dtsstn.cdcp.api.data.entity.AlertTypeEntity;

@Repository
public interface AlertTypeRepository extends JpaRepository<AlertTypeEntity, String> {

	@Override
	Optional<AlertTypeEntity> findById(String id);

	Optional<AlertTypeEntity> findByCode(String code);

}

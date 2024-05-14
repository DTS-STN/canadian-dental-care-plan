package ca.gov.dtsstn.cdcp.api.data.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import ca.gov.dtsstn.cdcp.api.data.entity.ConfirmationCodeEntity;


public interface ConfirmationCodeRepository extends JpaRepository<ConfirmationCodeEntity, String> {

	@Override
	Optional<ConfirmationCodeEntity> findById(String id);


    List<ConfirmationCodeEntity> findByUserId(String userId);
    List<ConfirmationCodeEntity> findByEmail(String email);
}
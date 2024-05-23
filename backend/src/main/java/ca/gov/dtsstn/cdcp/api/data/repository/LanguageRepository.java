package ca.gov.dtsstn.cdcp.api.data.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import ca.gov.dtsstn.cdcp.api.data.entity.LanguageEntity;

@Repository
public interface LanguageRepository extends JpaRepository<LanguageEntity, String> {

	Optional<LanguageEntity> findByCode(String code);

	Optional<LanguageEntity> findByMsLocaleCode(String msLocaleCode);


}

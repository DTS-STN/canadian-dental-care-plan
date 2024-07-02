package ca.gov.dtsstn.cdcp.api.data.repository;
import java.time.Instant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ca.gov.dtsstn.cdcp.api.data.entity.ConfirmationCodeEntity;


@Repository
public interface ConfirmationCodeRepository extends JpaRepository<ConfirmationCodeEntity, String> {

	int deleteByExpiryDateLessThan(Instant instant);
}

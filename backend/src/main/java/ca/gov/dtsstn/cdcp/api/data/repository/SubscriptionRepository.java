package ca.gov.dtsstn.cdcp.api.data.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import ca.gov.dtsstn.cdcp.api.data.entity.SubscriptionEntity;

/**
 * Repository for {@link SubscriptionEntity} entities.
 */
@Repository
public interface SubscriptionRepository extends JpaRepository<SubscriptionEntity, String> {

	List<SubscriptionEntity> findByUserId(String userId);

}

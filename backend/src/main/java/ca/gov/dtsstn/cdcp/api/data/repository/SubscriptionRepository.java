package ca.gov.dtsstn.cdcp.api.data.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import ca.gov.dtsstn.cdcp.api.data.entity.SubscriptionEntity;

public interface SubscriptionRepository extends JpaRepository<SubscriptionEntity, String> {

	List<SubscriptionEntity> findByUserId(String userId);

}

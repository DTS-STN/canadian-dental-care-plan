package ca.gov.dtsstn.cdcp.api.data.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import ca.gov.dtsstn.cdcp.api.data.entity.SubscriptionEntity;

/**
 * @author Lei Ye (gregory.j.baker@hrsdc-rhdcc.gc.ca)
 */
@SuppressWarnings({ "java:S2479" })

public interface SubscriptionRepository extends JpaRepository<SubscriptionEntity, String>  {
	List<SubscriptionEntity> findByUserId(String userId);
}

package ca.gov.dtsstn.cdcp.api.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.util.Assert;

import ca.gov.dtsstn.cdcp.api.service.domain.ImmutableSubscription;
import ca.gov.dtsstn.cdcp.api.service.domain.Subscription;

@Service
public class SubscriptionService {

	public List<Subscription> getSubscriptionsByUserId(String userId) {
		Assert.hasText(userId, "userId is required; it must not be null or blank");

		return List.of(
			ImmutableSubscription.builder()
				.id("fd649d93-9aaf-48d0-996f-3d74c480e480")
				.sin("800011819")
				.email("user@example.com")
				.registered(true)
				.subscribed(true)
				.preferredLanguage(1033L)
				.alertType("cdcp")
				.build(),
			ImmutableSubscription.builder()
				.id("d1682e89-4d61-469d-852d-8c84711389c8")
				.sin("800011819")
				.email("user@example.com")
				.registered(true)
				.subscribed(false)
				.preferredLanguage(1033L)
				.alertType("ei")
				.build());
	}

}

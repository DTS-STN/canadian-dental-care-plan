package ca.gov.dtsstn.cdcp.api.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import ca.gov.dtsstn.cdcp.api.dto.ImmutableSubscription;
import ca.gov.dtsstn.cdcp.api.dto.Subscription;

@RestController
@RequestMapping({ "/api/v1" })
public class SubscriptionControllerV1 {

	@GetMapping({ "/users/{userId}/subscriptions" })
	public List<Subscription> getSubscriptions(@PathVariable String userId) {
		return List.of(
			ImmutableSubscription.builder()
				.id(10001L)
				.sin("800011819")
				.email("user@example.com")
				.registered(true)
				.subscribed(true)
				.preferredLanguage(1033L)
				.alertType("cdcp")
				.build(),
			ImmutableSubscription.builder()
				.id(10002L)
				.sin("800011819")
				.email("user@example.com")
				.registered(true)
				.subscribed(false)
				.preferredLanguage(1033L)
				.alertType("ei")
				.build()
		);
	}

}

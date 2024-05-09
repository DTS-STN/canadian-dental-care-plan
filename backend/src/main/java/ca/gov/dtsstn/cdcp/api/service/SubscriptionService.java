package ca.gov.dtsstn.cdcp.api.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.util.Assert;

import ca.gov.dtsstn.cdcp.api.data.repository.SubscriptionRepository;
import ca.gov.dtsstn.cdcp.api.service.domain.Subscription;
import ca.gov.dtsstn.cdcp.api.service.domain.mapper.SubscriptionMapper;

@Service
public class SubscriptionService {

	private final SubscriptionMapper mapper;

	private final SubscriptionRepository repository;


	public SubscriptionService(SubscriptionMapper mapper, SubscriptionRepository repository) {
		Assert.notNull(mapper, "mapper is required; it must not be null");
		Assert.notNull(repository, "repository is required; it must not be null");
		this.mapper = mapper;
		this.repository = repository;
	}

	public List<Subscription> getSubscriptionsByUserId(String userId) {
		Assert.hasText(userId, "userId is required; it must not be null or blank");

		final var subscriptions = repository.findByUserId(userId).stream().map(mapper::fromEntity).toList();
		return subscriptions;
	}
}

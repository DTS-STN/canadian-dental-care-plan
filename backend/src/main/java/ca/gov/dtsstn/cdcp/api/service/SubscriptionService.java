package ca.gov.dtsstn.cdcp.api.service;

import java.util.List;
import java.util.Optional;

import org.mapstruct.factory.Mappers;
import org.springframework.stereotype.Service;
import org.springframework.util.Assert;

import ca.gov.dtsstn.cdcp.api.data.repository.SubscriptionRepository;
import ca.gov.dtsstn.cdcp.api.service.domain.Subscription;
import ca.gov.dtsstn.cdcp.api.service.domain.mapper.SubscriptionMapper;

@Service
public class SubscriptionService {

	private final SubscriptionMapper subscriptionMapper = Mappers.getMapper(SubscriptionMapper.class);

	private final SubscriptionRepository subscriptionRepository;

	public SubscriptionService(SubscriptionRepository repository) {
		Assert.notNull(repository, "subscriptionRepository is required; it must not be null");
		this.subscriptionRepository = repository;
	}

	public Subscription create(Subscription subscription) {
		Assert.notNull(subscription, "subscription is required; it must not be null");
		Assert.isNull(subscription.getId(), "subscription.id must be null when creating new instance");

		return subscriptionMapper.fromEntity(subscriptionRepository.save(subscriptionMapper.toEntity(subscription)));
	}

	public Subscription update(Subscription subscription) {
		Assert.notNull(subscription, "subscription is required; it must not be null");
		final var originalSubscription = subscriptionRepository.findById(subscription.getId()).orElseThrow();
		return subscriptionMapper.fromEntity(subscriptionRepository.save(subscriptionMapper.update(subscription, originalSubscription)));
	}

	public Optional<Subscription> getSubscriptionById(String id) {
		Assert.hasText(id, "id is required; it must not be null or blank");
		return subscriptionRepository.findById(id).map(subscriptionMapper::fromEntity);
	}

	public List<Subscription> getSubscriptionsByUserId(String userId) {
		Assert.hasText(userId, "userId is required; it must not be null or blank");
		return subscriptionRepository.findByUserId(userId).stream().map(subscriptionMapper::fromEntity).toList();
	}

}

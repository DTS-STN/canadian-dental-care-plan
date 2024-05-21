package ca.gov.dtsstn.cdcp.api.service;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import org.mapstruct.factory.Mappers;
import org.springframework.stereotype.Service;
import org.springframework.util.Assert;

import ca.gov.dtsstn.cdcp.api.data.repository.SubscriptionRepository;
import ca.gov.dtsstn.cdcp.api.data.repository.UserRepository;
import ca.gov.dtsstn.cdcp.api.service.domain.Subscription;
import ca.gov.dtsstn.cdcp.api.service.domain.mapper.SubscriptionMapper;

@Service
public class SubscriptionService {

	private final SubscriptionRepository subscriptionRepository;

	SubscriptionMapper subscriptionMapper = Mappers.getMapper(SubscriptionMapper.class);

	private final UserRepository userRepository;

	public SubscriptionService(
				SubscriptionRepository subscriptionRepository, 
				UserRepository userRepository) {
		Assert.notNull(subscriptionRepository, "subscriptionRepository is required; it must not be null");
		Assert.notNull(userRepository, "userRepository is required; it must not be null");
		this.subscriptionRepository = subscriptionRepository;
		this.userRepository = userRepository;
	}

	public void create(Subscription subscription, String userId) {
		Assert.notNull(subscription, "subscription is required; it must not be null");
		Assert.notNull(userId, "userId is required; it must not be null");
		final var userEntity = userRepository.findById(userId).get();
		final var subscriptions = userEntity.getSubscriptions();
		if (subscriptions.size() == 0) {
			userEntity.setSubscriptions(Arrays.asList(subscriptionMapper.toEntity(subscription)));				
		} else {
			subscriptions.add(subscriptionMapper.toEntity(subscription));
			userEntity.setSubscriptions(subscriptions);			
		}
		userRepository.save(userEntity);
	}

	public void update(Subscription subscription, String userId, String subscriptionId) {
		Assert.notNull(subscription, "subscription is required; it must not be null");
		Assert.notNull(subscriptionId, "subscriptionId is required; it must not be null");
		final var userEntity = userRepository.findById(userId).get();
		final var oldSubscriptionEntity = subscriptionRepository.findById(subscriptionId).get();
		final var newSubscriptionEntity = subscriptionMapper.update(subscription, oldSubscriptionEntity);
		final var subscriptions = userEntity.getSubscriptions();
		subscriptions.remove(oldSubscriptionEntity);
		subscriptions.add(newSubscriptionEntity);
		userEntity.setSubscriptions(subscriptions);
		userRepository.save(userEntity);
	}

	public Optional<Subscription> getSubscriptionById(String id) {
		Assert.hasText(id, "id is required; it must not be null or blank");
		return subscriptionRepository.findById(id).map(subscriptionMapper::fromEntity);
	}

	public List<Subscription> getSubscriptionsByUserId(String userId) {
		Assert.hasText(userId, "userId is required; it must not be null or blank");
		return subscriptionMapper.fromEntity(userRepository.findById(userId).get().getSubscriptions());
	}

}

package ca.gov.dtsstn.cdcp.api.service;

import java.time.Instant;
import java.util.Optional;
import java.util.function.Predicate;

import org.apache.commons.lang3.RandomStringUtils;
import org.mapstruct.factory.Mappers;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.Assert;

import ca.gov.dtsstn.cdcp.api.config.properties.ApplicationProperties;
import ca.gov.dtsstn.cdcp.api.data.entity.AlertTypeEntityBuilder;
import ca.gov.dtsstn.cdcp.api.data.entity.ConfirmationCodeEntity;
import ca.gov.dtsstn.cdcp.api.data.entity.ConfirmationCodeEntityBuilder;
import ca.gov.dtsstn.cdcp.api.data.entity.LanguageEntityBuilder;
import ca.gov.dtsstn.cdcp.api.data.entity.SubscriptionEntity;
import ca.gov.dtsstn.cdcp.api.data.entity.SubscriptionEntityBuilder;
import ca.gov.dtsstn.cdcp.api.data.repository.AlertTypeRepository;
import ca.gov.dtsstn.cdcp.api.data.repository.LanguageRepository;
import ca.gov.dtsstn.cdcp.api.data.repository.UserRepository;
import ca.gov.dtsstn.cdcp.api.service.domain.AlertType;
import ca.gov.dtsstn.cdcp.api.service.domain.ConfirmationCode;
import ca.gov.dtsstn.cdcp.api.service.domain.Language;
import ca.gov.dtsstn.cdcp.api.service.domain.Subscription;
import ca.gov.dtsstn.cdcp.api.service.domain.User;
import ca.gov.dtsstn.cdcp.api.service.domain.mapper.ConfirmationCodeMapper;
import ca.gov.dtsstn.cdcp.api.service.domain.mapper.SubscriptionMapper;
import ca.gov.dtsstn.cdcp.api.service.domain.mapper.UserMapper;

@Service
@Transactional
public class UserService {

	private static final Logger log = LoggerFactory.getLogger(UserService.class);

	private final AlertTypeRepository alertTypeRepository;

	private final LanguageRepository languageRepository;

	private final ApplicationProperties applicationProperties;

	private final ConfirmationCodeMapper confirmationCodeMapper = Mappers.getMapper(ConfirmationCodeMapper.class);

	private final SubscriptionMapper subscriptionMapper = Mappers.getMapper(SubscriptionMapper.class);

	private final UserMapper userMapper = Mappers.getMapper(UserMapper.class);

	private final UserRepository userRepository;

	public UserService(
			AlertTypeRepository alertTypeRepository,
			LanguageRepository languageRepository,
			ApplicationProperties applicationProperties,
			UserRepository userRepository) {
		Assert.notNull(alertTypeRepository, "alertTypeRepository is requird; it must not be null");
		Assert.notNull(applicationProperties, "applicationProperties is requird; it must not be null");
		Assert.notNull(userRepository, "userRepository is required; it must not be null");
		this.alertTypeRepository = alertTypeRepository;
		this.languageRepository = languageRepository;
		this.applicationProperties = applicationProperties;
		this.userRepository = userRepository;
	}

	public User createUser(User user) {
		Assert.notNull(user, "user is required; it must not be null");
		Assert.isNull(user.getId(), "user.id must be null when creating new instance");

		return userMapper.toDomainObject(userRepository.save(userMapper.toEntity(user)));
	}

	public ConfirmationCode createConfirmationCodeForUser(String userId) {
		Assert.hasText(userId, "userId is required; it must not be null or blank");

		final var codeLength = applicationProperties.getEmailNotifications().getConfirmationCodes().getLength();
		final var expiryTimeUnit = applicationProperties.getEmailNotifications().getConfirmationCodes().getExpiry().getTimeUnit();
		final var expiryTimeValue = applicationProperties.getEmailNotifications().getConfirmationCodes().getExpiry().getValue();

		log.debug("Fetching user [{}] from repository", userId);
		final var user = userRepository.findById(userId).orElseThrow();

		final var confirmationCode = new ConfirmationCodeEntityBuilder()
			.code(RandomStringUtils.randomNumeric(codeLength))
			.expiryDate(Instant.now().plus(expiryTimeValue, expiryTimeUnit))
			.build();

		log.debug("Creating confirmation code [{}] (expiry: [{}]) for user [{}]", confirmationCode.getCode(), confirmationCode.getExpiryDate(), userId);
		user.getConfirmationCodes().add(confirmationCode);

		// return the persisted entity so it includes the id and audit fields
		return userRepository.save(user).getConfirmationCodes().stream()
			.filter(byCode(confirmationCode.getCode())).findFirst()
			.map(confirmationCodeMapper::toDomainObject).orElseThrow();
	}

	public Subscription createSubscriptionForUser(String userId, Subscription subscription) {
		Assert.hasText(userId, "userId is required; it must not be null or blank");
		Assert.notNull(Optional.ofNullable(subscription.getAlertType()).map(AlertType::getCode).orElse(null), "subscription.alertType.code is required; it must not be null or blank");
		Assert.notNull(Optional.ofNullable(subscription.getLanguage()).map(Language::getMsLocaleCode).orElse(null), "subscription.getLanguage.getMsLocaleCode is required; it must not be null");

		log.debug("Fetching user [{}] from repository", userId);
		final var user = userRepository.findById(userId).orElseThrow();

		log.debug("Fetching alert type [{}] from repository", subscription.getAlertType().getCode());
		final var alertType = alertTypeRepository.findByCode(subscription.getAlertType().getCode()).orElseThrow();

		log.debug("Fetching language with msLocaleCode=[{}] from repository", subscription.getLanguage().getMsLocaleCode());
		final var preferredLanguage = languageRepository.findByMsLocaleCode(subscription.getLanguage().getMsLocaleCode()).orElseThrow();		

		final var existingSubscription = user.getSubscriptions().stream()
			.filter(byAlertTypeId(alertType.getId())).findFirst();

		if (existingSubscription.isPresent()) {
			throw new DataIntegrityViolationException("User [%s] is already subscribed to alert type [%s]".formatted(userId, subscription.getAlertType().getCode()));
		}

		user.getSubscriptions().add(new SubscriptionEntityBuilder()
			.alertType(new AlertTypeEntityBuilder()
				.id(alertType.getId())
				.build())
			.language(new LanguageEntityBuilder()
				.id(preferredLanguage.getId())
				.build())
			.build());

		return userRepository.save(user).getSubscriptions().stream()
			.filter(byAlertTypeId(alertType.getId())).findFirst()
			.map(subscriptionMapper::toDomainObject).get();
	}

	public Optional<User> getUserById(String id) {
		Assert.hasText(id, "id is required; it must not be null or blank");
		return userRepository.findById(id).map(userMapper::toDomainObject);
	}

	private Predicate<SubscriptionEntity> byAlertTypeId(String alertTypeId) {
		return subscription -> {
			return alertTypeId.equals(subscription.getAlertType().getId());
		};
	}

	private Predicate<ConfirmationCodeEntity> byCode(String code) {
		return confirmationCode -> confirmationCode.getCode().equals(code);
	}

}

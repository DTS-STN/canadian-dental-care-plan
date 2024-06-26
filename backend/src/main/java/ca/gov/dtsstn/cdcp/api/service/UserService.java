package ca.gov.dtsstn.cdcp.api.service;

import java.time.Instant;
import java.util.Optional;
import java.util.function.Predicate;

import org.apache.commons.lang3.RandomStringUtils;
import org.apache.commons.lang3.StringUtils;
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
import ca.gov.dtsstn.cdcp.api.service.domain.ConfirmationCode;
import ca.gov.dtsstn.cdcp.api.service.domain.Subscription;
import ca.gov.dtsstn.cdcp.api.service.domain.User;
import ca.gov.dtsstn.cdcp.api.service.domain.mapper.ConfirmationCodeMapper;
import ca.gov.dtsstn.cdcp.api.service.domain.mapper.SubscriptionMapper;
import ca.gov.dtsstn.cdcp.api.service.domain.mapper.UserMapper;
import io.micrometer.core.annotation.Timed;

@Service
@Transactional
public class UserService {

	private static final Logger log = LoggerFactory.getLogger(UserService.class);

	private final ApplicationProperties applicationProperties;

	private final AlertTypeRepository alertTypeRepository;
	private final LanguageRepository languageRepository;
	private final UserRepository userRepository;

	private final ConfirmationCodeMapper confirmationCodeMapper = Mappers.getMapper(ConfirmationCodeMapper.class);
	private final SubscriptionMapper subscriptionMapper = Mappers.getMapper(SubscriptionMapper.class);

	private final UserMapper userMapper = Mappers.getMapper(UserMapper.class);

	public UserService(
			ApplicationProperties applicationProperties,
			AlertTypeRepository alertTypeRepository,
			LanguageRepository languageRepository,
			UserRepository userRepository) {
		Assert.notNull(applicationProperties, "applicationProperties is required; it must not be null");
		Assert.notNull(alertTypeRepository, "alertTypeRepository is required; it must not be null");
		Assert.notNull(languageRepository, "languageRepository is required; it must not be null");
		Assert.notNull(userRepository, "userRepository is required; it must not be null");

		this.alertTypeRepository = alertTypeRepository;
		this.languageRepository = languageRepository;
		this.applicationProperties = applicationProperties;
		this.userRepository = userRepository;
	}

	@Timed
	public User createUser(User user) {
		Assert.notNull(user, "user is required; it must not be null");
		Assert.isNull(user.getId(), "user.id must be null when creating new instance");

		return userMapper.toUser(userRepository.save(userMapper.toUserEntity(user)));
	}

	@Timed
	public Optional<User> getUserById(String id) {
		Assert.hasText(id, "id is required; it must not be null or blank");
		return userRepository.findById(id).map(userMapper::toUser);
	}

	@Timed
	public Optional<User> getUserByRaoidcUserId(String id) {
		Assert.hasText(id, "id is required; it must not be null or blank");
		return userRepository.findByRaoidcUserId(id).map(userMapper::toUser);
	}

	@Timed
	public void updateUser(String userId, User userPatch) {
		Assert.hasText(userId, "userId is required; it must not be null or blank");
		Assert.notNull(userPatch, "userPatch is required; it must not be null");

		log.debug("Fetching user [{}] from repository", userId);
		final var user = userRepository.findById(userId).orElseThrow();

		if (StringUtils.equals(userPatch.getEmail(), user.getEmail()) == false) {
			user.setEmailVerified(false);
		}

		userRepository.save(userMapper.update(user, userPatch));
	}

	@Timed
	public Subscription createSubscriptionForUser(String userId, String alertTypeId, String languageId) {
		Assert.hasText(userId, "userId is required; it must not be null or blank");
		Assert.hasText(alertTypeId, "alertTypeId is required; it must not be null or blank");
		Assert.hasText(languageId, "languageId is required; it must not be null or blank");

		log.debug("Fetching user [{}] from repository", userId);
		final var user = userRepository.findById(userId).orElseThrow();

		final var existingSubscription = user.getSubscriptions().stream()
			.filter(byAlertTypeId(alertTypeId)).findFirst();

		if (existingSubscription.isPresent()) {
			throw new DataIntegrityViolationException("User [%s] is already subscribed to alert type [%s]".formatted(userId, alertTypeId));
		}

		log.debug("Fetching alert type [{}] from repository", alertTypeId);
		final var alertType = alertTypeRepository.findById(alertTypeId).orElseThrow();

		log.debug("Fetching language [{}] from repository", languageId);
		final var language = languageRepository.findById(languageId).orElseThrow();

		user.getSubscriptions().add(new SubscriptionEntityBuilder()
			.alertType(new AlertTypeEntityBuilder()
				.id(alertType.getId())
				.build())
			.language(new LanguageEntityBuilder()
				.id(language.getId())
				.build())
			.build());

		return userRepository.save(user).getSubscriptions().stream()
			.filter(byAlertTypeId(alertType.getId())).findFirst()
			.map(subscriptionMapper::toSubscription).orElseThrow();
	}

	@Timed
	public void updateSubscriptionForUser(String userId, String subscriptionId, String languageId) {
		Assert.hasText(userId, "userId is required; it must not be null or blank");
		Assert.hasText(subscriptionId, "subscriptionId is required; it must not be null or blank");
		Assert.hasText(languageId, "languageId is required; it must not be null or blank");

		log.debug("Fetching user [{}] from repository", userId);
		final var user = userRepository.findById(userId).orElseThrow();

		log.debug("Fetching subscription [{}] for user [{}]", subscriptionId, userId);
		final var subscription = user.getSubscriptions().stream()
			.filter(byId(subscriptionId)).findFirst().orElseThrow();

		log.debug("Fetching language [{}] from repository", languageId);
		final var preferredLanguage = languageRepository.findById(languageId).orElseThrow();

		if (StringUtils.equals(subscription.getLanguage().getId(), languageId) == false) {
			log.debug("Updating language for subscription [{}] to [{}]", subscriptionId, languageId);
			subscription.setLanguage(preferredLanguage);
		}

		userRepository.save(user);
	}

	@Timed
	public void deleteSubscriptionForUser(String userId, String subscriptionId) {
		Assert.hasText(userId, "userId is required; it must not be null or blank");
		Assert.hasText(subscriptionId, "subscriptionId is required; it must not be null or blank");

		final var user = userRepository.findById(userId).orElseThrow();
		user.getSubscriptions().removeIf(subscription -> subscription.getId().equals(subscriptionId));
		userRepository.save(user);
	}

	@Timed
	public boolean verifyEmail(String userId, String code){
		Assert.hasText(code, "code is required; it must not be null or blank");
		Assert.hasText(userId, "userId is required; it must not be null or blank");

		log.debug("Fetching user [{}] from repository" , userId);
		final var user = userRepository.findById(userId).orElseThrow();

		final var hasConfirmationCode = user.getConfirmationCodes().stream()
			.filter(byNotExpired(Instant.now())).anyMatch(byCode(code));

		if (hasConfirmationCode == false) {
			log.debug("User [{}] has no valid confirmation code [{}]", userId, code);
			return false;
		}

		log.info("Found confirmation code [{}] for user [{}]; validating email address", code, userId);
		user.setEmailVerified(true);
		user.getConfirmationCodes().clear();
		userRepository.save(user);

		return true;
	}

	@Timed
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
			.map(confirmationCodeMapper::toConfirmationCode).orElseThrow();
	}

	private Predicate<SubscriptionEntity> byAlertTypeId(String alertTypeId) {
		Assert.hasText(alertTypeId, "alertTypeId is required; it must not be null or blank");
		return subscription -> alertTypeId.equals(subscription.getAlertType().getId());
	}

	private Predicate<ConfirmationCodeEntity> byCode(String code) {
		Assert.hasText(code, "code is required; it must not be null or blank");
		return confirmationCode -> code.equals(confirmationCode.getCode());
	}

	private Predicate<SubscriptionEntity> byId(String id) {
		Assert.hasText(id, "id is required; it must not be null or blank");
		return subscription -> id.equals(subscription.getId());
	}

	private Predicate<ConfirmationCodeEntity> byNotExpired(Instant instant) {
		Assert.notNull(instant, "instant is required; it must not be null");
		return confirmationCode -> confirmationCode.getExpiryDate().isAfter(instant);
	}

}

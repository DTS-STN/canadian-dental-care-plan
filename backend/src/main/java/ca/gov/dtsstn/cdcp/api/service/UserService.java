package ca.gov.dtsstn.cdcp.api.service;

import java.time.Instant;
import java.util.function.Predicate;

import org.apache.commons.lang3.RandomStringUtils;
import org.mapstruct.factory.Mappers;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.Assert;

import ca.gov.dtsstn.cdcp.api.config.properties.ApplicationProperties;
import ca.gov.dtsstn.cdcp.api.data.entity.ConfirmationCodeEntity;
import ca.gov.dtsstn.cdcp.api.data.entity.ConfirmationCodeEntityBuilder;
import ca.gov.dtsstn.cdcp.api.data.repository.UserRepository;
import ca.gov.dtsstn.cdcp.api.service.domain.ConfirmationCode;
import ca.gov.dtsstn.cdcp.api.service.domain.User;
import ca.gov.dtsstn.cdcp.api.service.domain.mapper.ConfirmationCodeMapper;
import ca.gov.dtsstn.cdcp.api.service.domain.mapper.UserMapper;

@Service
@Transactional
public class UserService {

	private static final Logger log = LoggerFactory.getLogger(UserService.class);

	private final ApplicationProperties applicationProperties;

	private final ConfirmationCodeMapper confirmationCodeMapper = Mappers.getMapper(ConfirmationCodeMapper.class);

	private final UserMapper userMapper = Mappers.getMapper(UserMapper.class);

	private final UserRepository userRepository;

	public UserService(ApplicationProperties applicationProperties, UserRepository userRepository) {
		Assert.notNull(applicationProperties, "applicationProperties is requird; it must not be null");
		Assert.notNull(userRepository, "userRepository is required; it must not be null");
		this.applicationProperties = applicationProperties;
		this.userRepository = userRepository;
	}

	public User createUser(User user) {
		Assert.notNull(user, "user is required; it must not be null");
		Assert.isNull(user.getId(), "user.id must be null when creating new instance");

		return userMapper.fromEntity(userRepository.save(userMapper.toEntity(user)));
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
			.map(confirmationCodeMapper::fromEntity).orElseThrow();
	}

	private Predicate<ConfirmationCodeEntity> byCode(String code) {
		return confirmationCode -> confirmationCode.getCode().equals(code);
	}

}

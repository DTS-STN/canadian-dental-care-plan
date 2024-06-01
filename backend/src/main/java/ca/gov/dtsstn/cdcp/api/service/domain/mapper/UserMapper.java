package ca.gov.dtsstn.cdcp.api.service.domain.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import ca.gov.dtsstn.cdcp.api.data.entity.UserEntity;
import ca.gov.dtsstn.cdcp.api.service.domain.User;
import jakarta.annotation.Nullable;

/**
 * Mapper for converting between {@link User} domain objects and {@link UserEntity} entities.
 */
@Mapper(uses = { ConfirmationCodeMapper.class, SubscriptionMapper.class, UserAttributeMapper.class })
public abstract class UserMapper extends AbstractDomainMapper {

	/**
	 * Converts a {@link UserEntity} entity to a {@link User} domain object.
	 */
	@Nullable
	public abstract User toUser(@Nullable UserEntity user);

	/**
	 * Converts a {@link User} domain object to a {@link UserEntity} entity.
	 */
	@Nullable
	@Mapping(target = "isNew", ignore = true)
	public abstract UserEntity toUserEntity(@Nullable User user);

	/**
	 * Updates a {@link UserEntity} entity with the values from a {@link User} domain object.
	 */
	@Nullable
	@Mapping(target = "id", ignore = true)
	@Mapping(target = "isNew", ignore = true)
	@Mapping(target = "createdBy", ignore = true)
	@Mapping(target = "createdDate", ignore = true)
	@Mapping(target = "lastModifiedBy", ignore = true)
	@Mapping(target = "lastModifiedDate", ignore = true)
	@Mapping(target = "confirmationCodes", qualifiedByName = { "updateConfirmationCodeEntities" })
	@Mapping(target = "subscriptions", qualifiedByName = { "updateSubscriptionEntities" })
	@Mapping(target = "userAttributes", qualifiedByName = { "updateUserAttributeEntities" })
	public abstract void updateUserEntity(@MappingTarget UserEntity userEntity, @Nullable User user);

}

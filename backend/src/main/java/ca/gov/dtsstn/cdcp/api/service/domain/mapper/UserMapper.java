package ca.gov.dtsstn.cdcp.api.service.domain.mapper;

import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

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
	@Mapping(target = "email", ignore = false)
	@BeanMapping(ignoreByDefault = true, nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
	public abstract UserEntity update(@MappingTarget UserEntity userEntity, @Nullable User user);

}

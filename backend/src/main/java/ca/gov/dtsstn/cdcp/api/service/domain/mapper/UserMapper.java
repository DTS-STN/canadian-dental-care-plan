package ca.gov.dtsstn.cdcp.api.service.domain.mapper;

import static org.mapstruct.NullValueMappingStrategy.RETURN_DEFAULT;
import static org.mapstruct.NullValuePropertyMappingStrategy.IGNORE;

import org.mapstruct.BeanMapping;
import org.mapstruct.IterableMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import ca.gov.dtsstn.cdcp.api.data.entity.UserEntity;
import ca.gov.dtsstn.cdcp.api.service.domain.User;
import jakarta.annotation.Nullable;

@Mapper(uses = { ConfirmationCodeMapper.class, SubscriptionMapper.class, UserAttributeMapper.class })
public interface UserMapper {

	@Nullable
	@IterableMapping(nullValueMappingStrategy = RETURN_DEFAULT)
	User toDomainObject(@Nullable UserEntity user);

	@Nullable
	@Mapping(target = "isNew", ignore = true)
	UserEntity toEntity(@Nullable User user);

	@Nullable
	@Mapping(target = "isNew", ignore = true)
	@BeanMapping(nullValuePropertyMappingStrategy = IGNORE)
	UserEntity updateEntity(@MappingTarget UserEntity user, @Nullable User userUpdate);

}

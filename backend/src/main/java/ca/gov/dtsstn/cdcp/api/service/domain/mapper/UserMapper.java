package ca.gov.dtsstn.cdcp.api.service.domain.mapper;

import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

import ca.gov.dtsstn.cdcp.api.data.entity.UserEntity;
import ca.gov.dtsstn.cdcp.api.service.domain.User;
import jakarta.annotation.Nullable;

@Mapper(uses = { ConfirmationCodeMapper.class, UserAttributeMapper.class })
public interface UserMapper {

	@Nullable
	@Mapping(target = "isNew", ignore = true)
	UserEntity toEntity(@Nullable User user);

	@Nullable
	User fromEntity(@Nullable UserEntity user);

	@Nullable
	@Mapping(target = "isNew", ignore = true)
	@BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
	UserEntity update(@MappingTarget UserEntity existingUser, @Nullable User user);

}

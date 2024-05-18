package ca.gov.dtsstn.cdcp.api.service.domain.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import ca.gov.dtsstn.cdcp.api.data.entity.UserAttributeEntity;
import ca.gov.dtsstn.cdcp.api.service.domain.UserAttribute;
import jakarta.annotation.Nullable;

@Mapper
public interface UserAttributeMapper {

	@Nullable
	@Mapping(target = "isNew", ignore = true)
	UserAttributeEntity toEntity(UserAttribute userAttribute);

}

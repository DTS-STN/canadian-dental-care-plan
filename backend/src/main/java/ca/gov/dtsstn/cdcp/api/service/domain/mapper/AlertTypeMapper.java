package ca.gov.dtsstn.cdcp.api.service.domain.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.springframework.lang.Nullable;

import ca.gov.dtsstn.cdcp.api.data.entity.AlertTypeEntity;
import ca.gov.dtsstn.cdcp.api.service.domain.AlertType;

@Mapper
public interface AlertTypeMapper {

	@Nullable
	AlertType toDomainObject(@Nullable AlertTypeEntity alertType);

	@Nullable
	@Mapping(target = "isNew", ignore = true)
	AlertTypeEntity toEntity(@Nullable AlertType alertType);

}

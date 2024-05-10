package ca.gov.dtsstn.cdcp.api.service.domain.mapper;

import java.util.List;
import java.util.stream.StreamSupport;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.springframework.lang.Nullable;

import ca.gov.dtsstn.cdcp.api.data.entity.AlertTypeEntity;
import ca.gov.dtsstn.cdcp.api.service.domain.AlertType;

@Mapper(componentModel = "spring")
public interface AlertTypeMapper {

	@Nullable
	public default List<AlertType> fromEntity(@Nullable Iterable<AlertTypeEntity> alertTypes) {
		if (alertTypes == null) { return null; }
		return StreamSupport.stream(alertTypes.spliterator(), false).map(this::fromEntity).toList();
	}

	@Nullable
	AlertType fromEntity(@Nullable AlertTypeEntity alertType);

	@Nullable
	public default List<AlertTypeEntity> toEntity(@Nullable Iterable<AlertType> alertTypes) {
		if (alertTypes == null) { return null; }
		return StreamSupport.stream(alertTypes.spliterator(), false).map(this::toEntity).toList();
	}

	@Nullable
	@Mapping(target = "isNew", ignore = true)
	AlertTypeEntity toEntity(@Nullable AlertType alertType);

}

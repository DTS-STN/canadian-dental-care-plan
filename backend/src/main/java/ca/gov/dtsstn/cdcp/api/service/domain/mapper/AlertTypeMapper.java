package ca.gov.dtsstn.cdcp.api.service.domain.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import ca.gov.dtsstn.cdcp.api.data.entity.AlertTypeEntity;
import ca.gov.dtsstn.cdcp.api.service.domain.AlertType;
import jakarta.annotation.Nullable;

/**
 * Mapper for converting between {@link AlertType} domain objects and {@link AlertTypeEntity} entities.
 */
@Mapper
public abstract class AlertTypeMapper extends AbstractDomainMapper {

	/**
	 * Converts an {@link AlertTypeEntity} to an {@link AlertType} domain object.
	 */
	@Nullable
	public abstract AlertType toAlertType(@Nullable AlertTypeEntity alertType);

	/**
	 * Converts an {@link AlertType} domain object to an {@link AlertTypeEntity} entity.
	 */
	@Nullable
	@Mapping(target = "isNew", ignore = true)
	public abstract AlertTypeEntity toAlertTypeEntity(@Nullable AlertType alertType);

}

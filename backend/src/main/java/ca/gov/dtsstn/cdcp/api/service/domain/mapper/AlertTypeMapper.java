package ca.gov.dtsstn.cdcp.api.service.domain.mapper;

import java.util.Optional;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.Nullable;
import org.springframework.util.Assert;

import ca.gov.dtsstn.cdcp.api.data.entity.AlertTypeEntity;
import ca.gov.dtsstn.cdcp.api.service.AlertTypeService;
import ca.gov.dtsstn.cdcp.api.service.domain.AlertType;
import jakarta.annotation.PostConstruct;

/**
 * @author Lei Ye (lei.ye@hrsdc-rhdcc.gc.ca)
 */
@Mapper(componentModel = "spring")
public abstract class AlertTypeMapper {

	@Autowired
	protected AlertTypeService alertTypeService;

	@PostConstruct
	public void postConstruct() {
		Assert.notNull(alertTypeService, "alertTypeService is required; it must not be null");
	}

	@Nullable
	public AlertTypeEntity fromId(@Nullable String id) {
		return Optional.ofNullable(id)
			.flatMap(alertTypeService::read)
			.map(this::toEntity)
			.orElse(null);
	}


	@Nullable
	public abstract AlertType fromEntity(@Nullable AlertTypeEntity alertTypeEntity);

	@Nullable
	@Mapping(target = "isNew", ignore = true)
	public abstract AlertTypeEntity toEntity(@Nullable AlertType alertType);
}

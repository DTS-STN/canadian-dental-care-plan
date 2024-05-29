package ca.gov.dtsstn.cdcp.api.service.domain;

import java.time.Instant;

import org.springframework.lang.Nullable;

import ca.gov.dtsstn.cdcp.api.service.domain.validation.ValidationGroup;
import jakarta.validation.constraints.Null;

public interface BaseDomainObject {

	@Nullable
	@Null(groups = { ValidationGroup.Create.class, ValidationGroup.Update.class }, message = "id must be null when creating/updating an entity")
	String getId();

	@Nullable
	@Null(groups = { ValidationGroup.Create.class, ValidationGroup.Update.class }, message = "createdBy must be null when creating/updating an entity")
	String getCreatedBy();

	@Nullable
	@Null(groups = { ValidationGroup.Create.class, ValidationGroup.Update.class }, message = "createdDate must be null when creating/updating an entity")
	Instant getCreatedDate();

	@Nullable
	@Null(groups = { ValidationGroup.Create.class, ValidationGroup.Update.class }, message = "lastModifiedBy must be null when creating/updating an entity")
	String getLastModifiedBy();

	@Nullable
	@Null(groups = { ValidationGroup.Create.class, ValidationGroup.Update.class }, message = "lastModifiedDate must be null when creating/updating an entity")
	Instant getLastModifiedDate();

}

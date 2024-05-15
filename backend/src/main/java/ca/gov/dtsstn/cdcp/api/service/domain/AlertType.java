package ca.gov.dtsstn.cdcp.api.service.domain;

import org.immutables.value.Value.Immutable;

import jakarta.annotation.Nullable;

@Immutable
public interface AlertType extends BaseDomainObject {

	@Nullable
	String getCode();

	@Nullable
	String getDescription();

}

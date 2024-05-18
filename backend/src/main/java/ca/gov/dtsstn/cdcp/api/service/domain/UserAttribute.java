package ca.gov.dtsstn.cdcp.api.service.domain;

import org.immutables.value.Value.Immutable;

import jakarta.annotation.Nullable;

@Immutable
public interface UserAttribute extends BaseDomainObject {

	@Nullable
	String getName();

	@Nullable
	String getValue();

}

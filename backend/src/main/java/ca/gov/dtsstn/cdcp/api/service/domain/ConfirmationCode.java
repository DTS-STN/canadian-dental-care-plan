package ca.gov.dtsstn.cdcp.api.service.domain;

import java.time.Instant;

import org.immutables.value.Value.Immutable;

import jakarta.annotation.Nullable;

@Immutable
public interface ConfirmationCode extends BaseDomainObject {

	@Nullable
	String getCode();

	@Nullable
	Instant getExpiryDate();

}

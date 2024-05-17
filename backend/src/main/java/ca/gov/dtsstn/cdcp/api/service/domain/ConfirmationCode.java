package ca.gov.dtsstn.cdcp.api.service.domain;

import org.immutables.value.Value.Immutable;

import java.time.Instant;
import jakarta.annotation.Nullable;

@Immutable
public interface ConfirmationCode extends BaseDomainObject {

	@Nullable
	String getUserId();

	@Nullable
	String getEmail();

	@Nullable
	String getCode();

	@Nullable
	Instant getExpiryDate();

}

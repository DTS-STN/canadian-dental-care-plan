package ca.gov.dtsstn.cdcp.api.service.domain;
import org.immutables.value.Value.Immutable;

import java.time.Instant;

@Immutable
public interface  ConfirmationCode extends BaseDomainObject {

    String getUserId();

	String getEmail();

	String getConfirmationCode();

	Instant getCodeCreatedDate();

    Instant getCodeExpiryDate();
	
}

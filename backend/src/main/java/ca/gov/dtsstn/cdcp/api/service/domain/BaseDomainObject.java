package ca.gov.dtsstn.cdcp.api.service.domain;

import java.time.Instant;

import org.springframework.lang.Nullable;

public interface BaseDomainObject {

	@Nullable
	String getId();

	@Nullable
	String getCreatedBy();

	@Nullable
	Instant getCreatedDate();

	@Nullable
	String getLastModifiedBy();

	@Nullable
	Instant getLastModifiedDate();

}

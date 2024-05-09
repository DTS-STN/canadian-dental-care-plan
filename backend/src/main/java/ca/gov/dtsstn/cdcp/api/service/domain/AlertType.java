package ca.gov.dtsstn.cdcp.api.service.domain;

import org.immutables.value.Value.Immutable;

@Immutable
public interface AlertType extends BaseDomainObject {

	String getCode();

	String getDescription();

}

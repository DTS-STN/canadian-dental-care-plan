package ca.gov.dtsstn.cdcp.api.service.domain;

import org.immutables.value.Value.Immutable;

@Immutable
public interface Subscription extends BaseDomainObject {

	String getSin();

	String getEmail();

	Boolean getRegistered();

	Boolean getSubscribed();

	Long  getPreferredLanguage();

	String getAlertType();

}

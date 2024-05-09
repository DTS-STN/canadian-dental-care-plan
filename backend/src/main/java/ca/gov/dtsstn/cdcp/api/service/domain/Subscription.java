package ca.gov.dtsstn.cdcp.api.service.domain;

import org.immutables.value.Value.Immutable;

@Immutable
public interface Subscription extends BaseDomainObject {

	String getUserId();

	String getEmail();

	Boolean getRegistered();

	Boolean getSubscribed();

	Long  getPreferredLanguage();

	AlertType getAlertType();

}

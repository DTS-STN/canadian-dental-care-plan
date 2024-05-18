package ca.gov.dtsstn.cdcp.api.service.domain;

import org.immutables.value.Value.Immutable;

import jakarta.annotation.Nullable;


@Immutable
public interface Subscription extends BaseDomainObject {

	@Nullable
	AlertType getAlertType();

	@Nullable
	String getEmail();

	@Nullable
	Long  getPreferredLanguage();

	@Nullable
	Boolean getRegistered();

	@Nullable
	Boolean getSubscribed();

	@Nullable
	String getUserId();

}

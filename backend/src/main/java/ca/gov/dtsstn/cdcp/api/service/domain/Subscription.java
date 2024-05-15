package ca.gov.dtsstn.cdcp.api.service.domain;

import org.immutables.value.Value.Immutable;

import jakarta.annotation.Nullable;


@Immutable
public interface Subscription extends BaseDomainObject {

	@Nullable
	String getUserId();

	@Nullable
	String getEmail();

	@Nullable
	Boolean getRegistered();

	@Nullable
	Boolean getSubscribed();

	@Nullable
	Long  getPreferredLanguage();

	@Nullable
	AlertType getAlertType();

}

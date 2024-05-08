package ca.gov.dtsstn.cdcp.api.dto;

import org.immutables.value.Value.Immutable;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;

@Immutable
@JsonSerialize(as = ImmutableSubscription.class)
@JsonDeserialize(as = ImmutableSubscription.class)
public interface Subscription {

	Long getId();

	String getSin();

	String getEmail();

	Boolean getRegistered();

	Boolean getSubscribed();

	Long  getPreferredLanguage();

	String getAlertType();

}

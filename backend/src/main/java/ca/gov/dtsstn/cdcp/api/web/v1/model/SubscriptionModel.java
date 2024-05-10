package ca.gov.dtsstn.cdcp.api.web.v1.model;

import org.immutables.value.Value.Immutable;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;

@Immutable
@JsonDeserialize(as = ImmutableSubscriptionModel.class)
public interface SubscriptionModel {

	String getId();

	String getUserId();

	String getEmail();

	Boolean getRegistered();

	Boolean getSubscribed();

	String getPreferredLanguage();

	String getAlertType();

}

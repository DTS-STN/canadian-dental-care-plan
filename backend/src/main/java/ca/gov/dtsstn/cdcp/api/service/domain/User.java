package ca.gov.dtsstn.cdcp.api.service.domain;

import java.util.Set;

import org.immutables.value.Value.Immutable;

import jakarta.annotation.Nullable;

@Immutable
public interface User extends BaseDomainObject {

	Set<ConfirmationCode> getConfirmationCodes();

	@Nullable
	String getEmail();

	@Nullable
	Boolean getEmailVerified();

	Set<Subscription> getSubscriptions();

	Set<UserAttribute> getUserAttributes();

}

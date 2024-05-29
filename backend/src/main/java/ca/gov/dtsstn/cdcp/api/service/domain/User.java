package ca.gov.dtsstn.cdcp.api.service.domain;

import java.util.Set;

import org.immutables.value.Value.Immutable;

import jakarta.annotation.Nullable;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;

@Immutable
public interface User extends BaseDomainObject {

	@Nullable
	Set<@Valid ConfirmationCode> getConfirmationCodes();

	@Email
	@Nullable
	String getEmail();

	@Nullable
	Boolean getEmailVerified();

	@Nullable
	Set<@Valid Subscription> getSubscriptions();

	@Nullable
	Set<@Valid UserAttribute> getUserAttributes();

}

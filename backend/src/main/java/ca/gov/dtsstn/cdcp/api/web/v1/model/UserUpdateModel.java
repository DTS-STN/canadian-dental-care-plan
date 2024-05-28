package ca.gov.dtsstn.cdcp.api.web.v1.model;

import org.immutables.value.Value.Immutable;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;

import jakarta.validation.constraints.NotBlank;

@Immutable
@JsonDeserialize(as = ImmutableUserUpdateModel.class)
public interface UserUpdateModel {

	@NotBlank
	String getEmail();

}

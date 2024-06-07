package ca.gov.dtsstn.cdcp.api.web.v1.model;

import org.immutables.value.Value.Immutable;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Immutable
@Schema(name = "UserUpdate")
@JsonDeserialize(as = ImmutableUserUpdateModel.class)
public interface UserUpdateModel {

	@NotBlank
	String getEmail();

}

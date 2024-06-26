package ca.gov.dtsstn.cdcp.api.web.v1.model;

import org.immutables.value.Value.Immutable;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Immutable
@Schema(name = "EmailValidation")
@JsonDeserialize(as = ImmutableEmailValidationModel.class)
public interface EmailValidationModel {

	@NotBlank
	@Schema(example = "00000000-0000-0000-0000-000000000000")
	String getConfirmationCode();

}

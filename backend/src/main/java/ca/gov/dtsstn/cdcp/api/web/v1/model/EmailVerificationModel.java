package ca.gov.dtsstn.cdcp.api.web.v1.model;

import org.immutables.value.Value.Immutable;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;

import ca.gov.dtsstn.cdcp.api.web.validation.AlertTypeCode;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

@Immutable
@JsonDeserialize(as = ImmutableEmailVerificationModel.class)
public interface EmailVerificationModel {

	@NotNull
	@Schema(example = "00000000-0000-0000-0000-000000000000")
	@AlertTypeCode(message = "Confirmation code does not exist")
	String getConfirmationCode();

}

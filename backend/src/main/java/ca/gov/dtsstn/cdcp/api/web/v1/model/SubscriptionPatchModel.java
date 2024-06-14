package ca.gov.dtsstn.cdcp.api.web.v1.model;

import org.immutables.value.Value.Immutable;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;

import ca.gov.dtsstn.cdcp.api.web.validation.LanguageCode;
import ca.gov.dtsstn.cdcp.api.web.validation.LanguageCodeValidator.CodeType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Immutable
@Schema(name = "SubscriptionPatch")
@JsonDeserialize(as = ImmutableSubscriptionPatchModel.class)
public interface SubscriptionPatchModel {

	@NotBlank
	@Schema(example = "1036")
	@LanguageCode(codeType = CodeType.MS_LOCALE_CODE, message = "Preferred language code does not exist")
	String getMsLanguageCode();

}

package ca.gov.dtsstn.cdcp.api.web.v1.model;

import org.immutables.value.Value.Immutable;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;

import ca.gov.dtsstn.cdcp.api.web.validation.AlertTypeCode;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

@Immutable
@JsonDeserialize(as = ImmutableSubscriptionCreateModel.class)
public interface SubscriptionCreateModel {

	@NotNull
	@Schema(example = "CDCP")
	@AlertTypeCode(message = "Alert type code does not exist")
	String getAlertTypeCode();

	@Schema(example = "1033")
	Long getPreferredLanguage();

}

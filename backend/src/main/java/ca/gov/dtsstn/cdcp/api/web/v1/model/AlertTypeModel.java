package ca.gov.dtsstn.cdcp.api.web.v1.model;

import org.immutables.value.Value.Immutable;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;

@Immutable
@JsonDeserialize(as = ImmutableAlertTypeModel.class)
public interface AlertTypeModel {

	String getId();

	String getCode();

	String getDescription();

}

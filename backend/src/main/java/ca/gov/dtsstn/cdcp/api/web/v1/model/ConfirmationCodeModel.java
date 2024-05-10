package ca.gov.dtsstn.cdcp.api.web.v1.model;
import java.time.Instant;

import org.immutables.value.Value.Immutable;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;

@Immutable
@JsonDeserialize(as =ImmutableConfirmationCodeModel.class)
public interface ConfirmationCodeModel {
    
    String getId();
    
    String getUserId();

	String getEmail();

	String getConfirmationCode();

	Instant getCodeCreatedDate();

    Instant getCodeExpiryDate();
}

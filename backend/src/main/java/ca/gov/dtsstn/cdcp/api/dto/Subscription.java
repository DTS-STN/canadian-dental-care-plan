package ca.gov.dtsstn.cdcp.api.dto;

import java.io.Serializable;

import org.immutables.value.Value;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;

import org.springframework.lang.Nullable;
import org.springframework.validation.annotation.Validated;

@Value.Immutable
@JsonSerialize(as = ImmutableSubscription.class)
@JsonDeserialize(as = ImmutableSubscription.class)
public interface Subscription {
    
    Long getId();

    String getSin();

    String getEmail();

    Boolean getRegistered();

    Boolean getSubscribed();

    Long  getPreferredLanguage();

    String getAlertType();    
}

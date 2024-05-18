package ca.gov.dtsstn.cdcp.api.web.v1.model;

import java.util.Objects;

import org.springframework.core.style.ToStringCreator;
import org.springframework.hateoas.server.core.Relation;

import com.fasterxml.jackson.annotation.JsonPropertyOrder;

import ca.gov.dtsstn.cdcp.api.web.model.BaseResourceModel;
import ca.gov.dtsstn.cdcp.api.web.validation.AlertTypeCode;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.annotation.Nullable;

@Schema(name = "Subscription")
@Relation(collectionRelation = "subscriptions", itemRelation = "subscription")
@JsonPropertyOrder({ "id", "alertType",	"email", "preferredLanguage", "registered", "subscribed", "userId", "createdBy", "createdDate", "lastModifiedBy", "lastModifiedDate" })
public class SubscriptionModel extends BaseResourceModel<SubscriptionModel> {

	@AlertTypeCode(message = "alertType is invalid or unknown")
	private String alertType;

	private String email;

	private String preferredLanguage;

	private Boolean registered;

	private Boolean subscribed;

	private String userId;

	public String getAlertType() {
		return alertType;
	}

	public void setAlertType(String alertType) {
		this.alertType = alertType;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public String getPreferredLanguage() {
		return preferredLanguage;
	}

	public void setPreferredLanguage(String preferredLanguage) {
		this.preferredLanguage = preferredLanguage;
	}

	public Boolean getRegistered() {
		return registered;
	}

	public void setRegistered(Boolean registered) {
		this.registered = registered;
	}

	public Boolean getSubscribed() {
		return subscribed;
	}

	public void setSubscribed(Boolean subscribed) {
		this.subscribed = subscribed;
	}

	public String getUserId() {
		return userId;
	}

	public void setUserId(String userId) {
		this.userId = userId;
	}

	@Override
	public boolean equals(@Nullable Object obj) {
		if (this == obj) { return true; }
		if (obj == null || !super.equals(obj)) { return false; }
		if (getClass() != obj.getClass()) { return false; }

		final var other = (SubscriptionModel) obj;

		return Objects.equals(alertType, other.alertType)
			&& Objects.equals(email, other.email)
			&& Objects.equals(preferredLanguage, other.preferredLanguage)
			&& Objects.equals(registered, other.registered)
			&& Objects.equals(subscribed, other.subscribed)
			&& Objects.equals(userId, other.userId);
	}

	@Override
	public int hashCode() {
		return Objects.hash(
			super.hashCode(),
			alertType,
			email,
			preferredLanguage,
			registered,
			subscribed,
			userId);
	}

	@Override
	public String toString() {
		return new ToStringCreator(this)
			.append("super", super.toString())
			.append("alertType", alertType)
			.append("email", email)
			.append("preferredLanguage", preferredLanguage)
			.append("registered", registered)
			.append("subscribed", subscribed)
			.append("userId", userId)
			.toString();
	}

}

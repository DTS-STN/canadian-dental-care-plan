package ca.gov.dtsstn.cdcp.api.web.v1.model;

import java.util.Objects;

import org.springframework.core.style.ToStringCreator;
import org.springframework.hateoas.server.core.Relation;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;

import com.fasterxml.jackson.annotation.JsonPropertyOrder;

import ca.gov.dtsstn.cdcp.api.web.model.BaseResourceModel;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "Subscription")
@Relation(collectionRelation = "subscriptions", itemRelation = "subscription")
@JsonPropertyOrder({ "id", "alertType",	"email", "msLanguageCode", "registered", "subscribed", "userId", "createdBy", "createdDate", "lastModifiedBy", "lastModifiedDate" })
public class SubscriptionModel extends BaseResourceModel<SubscriptionModel> {

	private String alertTypeCode;

	private String msLanguageCode;

	public String getAlertTypeCode() {
		return alertTypeCode;
	}

	public void setAlertTypeCode(String alertTypeCode) {
		this.alertTypeCode = alertTypeCode;
	}

	public String getMsLanguageCode() {
		return msLanguageCode;
	}

	public void setMsLanguageCode(String msLanguageCode) {
		this.msLanguageCode = msLanguageCode;
	}

	@Override
	public boolean equals(@Nullable Object obj) {
		if (this == obj) { return true; }
		if (obj == null || !super.equals(obj)) { return false; }
		if (getClass() != obj.getClass()) { return false; }

		final var other = (SubscriptionModel) obj;

		return Objects.equals(alertTypeCode, other.alertTypeCode)
			&& Objects.equals(msLanguageCode, other.msLanguageCode);
	}

	@NonNull
	@Override
	public String toString() {
		return new ToStringCreator(this)
			.append("super", super.toString())
			.toString();
	}

}

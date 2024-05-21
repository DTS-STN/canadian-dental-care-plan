package ca.gov.dtsstn.cdcp.api.data.entity;

import java.time.Instant;

import org.immutables.builder.Builder;
import org.springframework.core.style.ToStringCreator;
import org.springframework.lang.Nullable;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;

@Entity(name = "Subscription")
@SuppressWarnings({ "serial" })
public class SubscriptionEntity extends AbstractEntity {

	@ManyToOne(optional = false)
	private AlertTypeEntity alertType;

	@Column(nullable = false)
	private Long preferredLanguage;

	public SubscriptionEntity() {
		super();
	}

	@Builder.Constructor
	protected SubscriptionEntity(
			@Nullable Boolean isNew,
			@Nullable String id,
			@Nullable String createdBy,
			@Nullable Instant createdDate,
			@Nullable String lastModifiedBy,
			@Nullable Instant lastModifiedDate,
			@Nullable AlertTypeEntity alertType,
			@Nullable Long preferredLanguage,
			@Nullable String userId) {
		super(isNew, id, createdBy, createdDate, lastModifiedBy, lastModifiedDate);
		this.alertType = alertType;
		this.preferredLanguage = preferredLanguage;
	}

	public AlertTypeEntity getAlertType() {
		return alertType;
	}

	public void setAlertType(AlertTypeEntity alertType) {
		this.alertType = alertType;
	}

	public Long getPreferredLanguage() {
		return preferredLanguage;
	}

	public void setPreferredLanguage(Long preferredLanguage) {
		this.preferredLanguage = preferredLanguage;
	}

	@Override
	public String toString() {
		return new ToStringCreator(this)
			.append("super", super.toString())
			.append("alertType", alertType)
			.append("preferredLanguage", preferredLanguage)
			.toString();
	}

}

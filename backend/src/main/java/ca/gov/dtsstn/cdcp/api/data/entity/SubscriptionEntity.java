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

	@ManyToOne
	private AlertTypeEntity alertType;

	@Column(length = 256, nullable = false)
	private String email;

	@Column(nullable = false)
	private Long preferredLanguage ;

	@Column(nullable = true)
	private Boolean registered;

	@Column(nullable = true)
	private Boolean subscribed;

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
			@Nullable String email,
			@Nullable Long preferredLanguage,
			@Nullable Boolean registered,
			@Nullable Boolean subscribed,
			@Nullable String userId) {
		super(isNew, id, createdBy, createdDate, lastModifiedBy, lastModifiedDate);
		this.alertType = alertType;
		this.email = email;
		this.registered = registered;
		this.subscribed = subscribed;
		this.preferredLanguage = preferredLanguage;
		this.alertType = alertType;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
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

	public Long getPreferredLanguage() {
		return preferredLanguage;
	}

	public void setPreferredLanguage(Long preferredLanguage) {
		this.preferredLanguage = preferredLanguage;
	}

	public AlertTypeEntity getAlertType() {
		return alertType;
	}

	public void setAlertType(AlertTypeEntity alertType) {
		this.alertType = alertType;
	}

	@Override
	public String toString() {
		return new ToStringCreator(this)
			.append("super", super.toString())
			.append("email", email)
			.append("registered", registered)
			.append("subscribed", subscribed)
			.append("preferredLanguage", preferredLanguage)
			.append("alertType", alertType)
			.toString();
	}

}
